/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

use super::protocol::{
    identify_message, request_message, AuthChallenge, HelloData, IdentifiedData, ObsMessage,
    RequestResponseData, OP_EVENT, OP_HELLO, OP_IDENTIFIED, OP_REQUEST_RESPONSE,
};
use base64::{engine::general_purpose, Engine as _};
use futures_util::{SinkExt, StreamExt};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::time::Duration;
use thiserror::Error;
use tokio::net::TcpStream;
use tokio::time::timeout;
use tokio_tungstenite::{
    connect_async,
    tungstenite::{Error as TungsteniteError, Message},
    MaybeTlsStream, WebSocketStream,
};

const DEFAULT_RPC_VERSION: u32 = 1;
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Debug, Error)]
pub enum ObsError {
    #[error("OBS is not connected")]
    Disconnected,

    #[error("OBS authentication is required")]
    AuthRequired,

    #[error("OBS WebSocket protocol error: {0}")]
    Protocol(String),

    #[error("OBS request {request_type} failed with code {code}: {comment}")]
    RequestFailed {
        request_type: String,
        code: u32,
        comment: String,
    },

    #[error("OBS WebSocket error: {0}")]
    WebSocket(#[from] TungsteniteError),

    #[error("OBS JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("OBS request timed out")]
    Timeout,
}

impl serde::Serialize for ObsError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;

        let mut state = serializer.serialize_struct("ObsError", 3)?;
        state.serialize_field("code", self.code())?;
        state.serialize_field("message", &self.to_string())?;
        if let ObsError::RequestFailed {
            request_type, code, ..
        } = self
        {
            state.serialize_field(
                "details",
                &json!({
                    "requestType": request_type,
                    "statusCode": code
                }),
            )?;
        }
        state.end()
    }
}

impl ObsError {
    fn code(&self) -> &'static str {
        match self {
            ObsError::Disconnected => "OBS_DISCONNECTED",
            ObsError::AuthRequired => "OBS_AUTH_REQUIRED",
            ObsError::Protocol(_) => "OBS_PROTOCOL_ERROR",
            ObsError::RequestFailed { .. } => "OBS_REQUEST_FAILED",
            ObsError::WebSocket(_) => "OBS_WEBSOCKET_ERROR",
            ObsError::Json(_) => "OBS_JSON_ERROR",
            ObsError::Timeout => "OBS_TIMEOUT",
        }
    }
}

pub type Result<T> = std::result::Result<T, ObsError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OBSConnectionInfo {
    pub connected: bool,
    pub host: String,
    pub port: u16,
    pub version: Option<String>,
    pub rpc_version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OBSRuntimeState {
    pub connected: bool,
    pub connection: Option<OBSConnectionInfo>,
    pub current_scene: Option<String>,
    pub is_recording: bool,
    pub is_streaming: bool,
}

impl OBSRuntimeState {
    pub fn disconnected() -> Self {
        Self {
            connected: false,
            connection: None,
            current_scene: None,
            is_recording: false,
            is_streaming: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct OBSScene {
    pub name: String,
    pub sources: Vec<OBSSource>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct OBSSource {
    pub name: String,
    #[serde(rename = "type")]
    pub source_type: String,
    pub visible: bool,
    pub settings: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct OBSRecordStatus {
    pub is_recording: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct OBSStreamStatus {
    pub is_streaming: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SceneListResponse {
    #[serde(default)]
    current_program_scene_name: Option<String>,
    #[serde(default)]
    scenes: Vec<RawScene>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawScene {
    scene_name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SceneItemListResponse {
    #[serde(default)]
    scene_items: Vec<RawSceneItem>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawSceneItem {
    scene_item_id: i64,
    source_name: String,
    #[serde(default)]
    source_type: Option<String>,
    #[serde(default)]
    input_kind: Option<String>,
    #[serde(default)]
    scene_item_enabled: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OutputStatusResponse {
    #[serde(default)]
    output_active: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EmptyResponse {}

type ObsSocket = WebSocketStream<MaybeTlsStream<TcpStream>>;

pub struct ObsClient {
    socket: ObsSocket,
    connection: OBSConnectionInfo,
    request_counter: u64,
}

impl ObsClient {
    pub async fn connect(host: String, port: u16, password: Option<String>) -> Result<Self> {
        let url = format!("ws://{}:{}", host.trim(), port);
        let (mut socket, _) = connect_async(&url).await?;

        let hello = read_required_message(&mut socket).await?;
        if hello.op != OP_HELLO {
            return Err(ObsError::Protocol(format!(
                "expected Hello op {}, received {}",
                OP_HELLO, hello.op
            )));
        }

        let hello_data: HelloData = serde_json::from_value(hello.d)?;
        let auth = match hello_data.authentication.as_ref() {
            Some(challenge) => {
                let password = password
                    .filter(|value| !value.is_empty())
                    .ok_or(ObsError::AuthRequired)?;
                Some(compute_authentication(&password, challenge))
            }
            None => None,
        };

        let rpc_version = hello_data.rpc_version.unwrap_or(DEFAULT_RPC_VERSION);
        send_json(&mut socket, &identify_message(rpc_version, auth)).await?;

        let identified = loop {
            let message = read_required_message(&mut socket).await?;
            if message.op == OP_IDENTIFIED {
                break message;
            }
            if message.op != OP_EVENT {
                return Err(ObsError::Protocol(format!(
                    "expected Identified op {}, received {}",
                    OP_IDENTIFIED, message.op
                )));
            }
        };

        let identified_data: IdentifiedData = serde_json::from_value(identified.d)?;
        let negotiated_rpc_version = identified_data
            .negotiated_rpc_version
            .unwrap_or(rpc_version);

        Ok(Self {
            socket,
            connection: OBSConnectionInfo {
                connected: true,
                host,
                port,
                version: hello_data.obs_web_socket_version,
                rpc_version: negotiated_rpc_version,
            },
            request_counter: 0,
        })
    }

    pub fn connection_info(&self) -> OBSConnectionInfo {
        self.connection.clone()
    }

    pub async fn disconnect(&mut self) -> Result<()> {
        self.socket.close(None).await?;
        Ok(())
    }

    pub async fn runtime_state(&mut self) -> Result<OBSRuntimeState> {
        let scenes = self.scene_list().await?;
        let record = self.record_status().await?;
        let stream = self.stream_status().await?;

        Ok(OBSRuntimeState {
            connected: true,
            connection: Some(self.connection_info()),
            current_scene: scenes.current_program_scene_name,
            is_recording: record.is_recording,
            is_streaming: stream.is_streaming,
        })
    }

    pub async fn list_scenes(&mut self) -> Result<Vec<OBSScene>> {
        let scene_list = self.scene_list().await?;
        let mut scenes = Vec::with_capacity(scene_list.scenes.len());

        for scene in scene_list.scenes {
            let items = self.scene_items(&scene.scene_name).await?;
            let sources = items
                .scene_items
                .into_iter()
                .map(|item| OBSSource {
                    name: item.source_name,
                    source_type: item
                        .source_type
                        .or(item.input_kind)
                        .unwrap_or_else(|| "unknown".to_string()),
                    visible: item.scene_item_enabled,
                    settings: serde_json::Map::new(),
                })
                .collect();

            scenes.push(OBSScene {
                name: scene.scene_name,
                sources,
            });
        }

        Ok(scenes)
    }

    pub async fn set_current_scene(&mut self, scene_name: String) -> Result<()> {
        self.call_empty(
            "SetCurrentProgramScene",
            Some(json!({ "sceneName": scene_name })),
        )
        .await
    }

    pub async fn set_source_visibility(
        &mut self,
        scene_name: String,
        source_name: String,
        visible: bool,
    ) -> Result<()> {
        let items = self.scene_items(&scene_name).await?;
        let item = items
            .scene_items
            .into_iter()
            .find(|item| item.source_name == source_name)
            .ok_or_else(|| {
                ObsError::Protocol(format!(
                    "source '{source_name}' was not found in scene '{scene_name}'"
                ))
            })?;

        self.call_empty(
            "SetSceneItemEnabled",
            Some(json!({
                "sceneName": scene_name,
                "sceneItemId": item.scene_item_id,
                "sceneItemEnabled": visible
            })),
        )
        .await
    }

    pub async fn record_status(&mut self) -> Result<OBSRecordStatus> {
        let response: OutputStatusResponse = self.call("GetRecordStatus", None).await?;
        Ok(OBSRecordStatus {
            is_recording: response.output_active,
        })
    }

    pub async fn start_record(&mut self) -> Result<()> {
        self.call_empty("StartRecord", None).await
    }

    pub async fn stop_record(&mut self) -> Result<()> {
        self.call_empty("StopRecord", None).await
    }

    pub async fn stream_status(&mut self) -> Result<OBSStreamStatus> {
        let response: OutputStatusResponse = self.call("GetStreamStatus", None).await?;
        Ok(OBSStreamStatus {
            is_streaming: response.output_active,
        })
    }

    pub async fn start_stream(&mut self) -> Result<()> {
        self.call_empty("StartStream", None).await
    }

    pub async fn stop_stream(&mut self) -> Result<()> {
        self.call_empty("StopStream", None).await
    }

    async fn scene_list(&mut self) -> Result<SceneListResponse> {
        self.call("GetSceneList", None).await
    }

    async fn scene_items(&mut self, scene_name: &str) -> Result<SceneItemListResponse> {
        self.call(
            "GetSceneItemList",
            Some(json!({
                "sceneName": scene_name
            })),
        )
        .await
    }

    async fn call_empty(&mut self, request_type: &str, request_data: Option<Value>) -> Result<()> {
        let _: EmptyResponse = self.call(request_type, request_data).await?;
        Ok(())
    }

    async fn call<T>(&mut self, request_type: &str, request_data: Option<Value>) -> Result<T>
    where
        T: DeserializeOwned,
    {
        self.request_counter += 1;
        let request_id = format!("streamslate-{}", self.request_counter);
        let envelope = request_message(request_type, request_id.clone(), request_data);
        send_json(&mut self.socket, &envelope).await?;

        loop {
            let message = read_required_message(&mut self.socket).await?;
            if message.op != OP_REQUEST_RESPONSE {
                continue;
            }

            let response: RequestResponseData = serde_json::from_value(message.d)?;
            if response.request_id != request_id {
                continue;
            }

            if !response.request_status.result {
                return Err(ObsError::RequestFailed {
                    request_type: response.request_type,
                    code: response.request_status.code,
                    comment: response
                        .request_status
                        .comment
                        .unwrap_or_else(|| "OBS request failed".to_string()),
                });
            }

            return serde_json::from_value(response.response_data).map_err(ObsError::Json);
        }
    }
}

async fn send_json<T: Serialize>(socket: &mut ObsSocket, value: &T) -> Result<()> {
    let text = serde_json::to_string(value)?;
    socket.send(Message::Text(text)).await?;
    Ok(())
}

async fn read_required_message(socket: &mut ObsSocket) -> Result<ObsMessage> {
    loop {
        let next = timeout(DEFAULT_TIMEOUT, socket.next())
            .await
            .map_err(|_| ObsError::Timeout)?;

        match next {
            Some(Ok(Message::Text(text))) => {
                return serde_json::from_str(&text).map_err(ObsError::Json)
            }
            Some(Ok(Message::Binary(bytes))) => {
                return serde_json::from_slice(&bytes).map_err(ObsError::Json)
            }
            Some(Ok(Message::Ping(data))) => {
                socket.send(Message::Pong(data)).await?;
                continue;
            }
            Some(Ok(Message::Close(_))) | None => return Err(ObsError::Disconnected),
            Some(Ok(_)) => continue,
            Some(Err(error)) => return Err(ObsError::WebSocket(error)),
        }
    }
}

fn compute_authentication(password: &str, challenge: &AuthChallenge) -> String {
    let secret = sha256_base64(format!("{}{}", password, challenge.salt).as_bytes());
    sha256_base64(format!("{}{}", secret, challenge.challenge).as_bytes())
}

fn sha256_base64(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    general_purpose::STANDARD.encode(hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn obs_authentication_matches_v5_derivation() {
        let challenge = AuthChallenge {
            salt: "salt".to_string(),
            challenge: "challenge".to_string(),
        };

        assert_eq!(
            compute_authentication("password", &challenge),
            "zTM5ki6L2vVvBQiTG9ckH1Lh64AbnCf6XZ226UmnkIA="
        );
    }

    #[test]
    fn scene_list_response_maps_to_frontend_model() {
        let response: SceneItemListResponse = serde_json::from_value(json!({
            "sceneItems": [
                {
                    "sceneItemId": 8,
                    "sourceName": "StreamSlate Capture",
                    "sourceType": "input",
                    "inputKind": "window_capture",
                    "sceneItemEnabled": true
                }
            ]
        }))
        .unwrap();

        let source = response.scene_items[0].clone();
        let mapped = OBSSource {
            name: source.source_name,
            source_type: source.source_type.or(source.input_kind).unwrap(),
            visible: source.scene_item_enabled,
            settings: serde_json::Map::new(),
        };

        assert_eq!(
            mapped,
            OBSSource {
                name: "StreamSlate Capture".to_string(),
                source_type: "input".to_string(),
                visible: true,
                settings: serde_json::Map::new(),
            }
        );
    }

    #[test]
    fn record_status_response_maps_output_active() {
        let response: OutputStatusResponse =
            serde_json::from_value(json!({ "outputActive": true })).unwrap();

        assert!(response.output_active);
    }
}
