/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const OP_HELLO: u8 = 0;
pub const OP_IDENTIFY: u8 = 1;
pub const OP_IDENTIFIED: u8 = 2;
pub const OP_EVENT: u8 = 5;
pub const OP_REQUEST: u8 = 6;
pub const OP_REQUEST_RESPONSE: u8 = 7;

#[derive(Debug, Deserialize)]
pub struct ObsMessage {
    pub op: u8,
    #[serde(default)]
    pub d: Value,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HelloData {
    #[serde(default)]
    pub obs_web_socket_version: Option<String>,
    #[serde(default)]
    pub rpc_version: Option<u32>,
    #[serde(default)]
    pub authentication: Option<AuthChallenge>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthChallenge {
    pub challenge: String,
    pub salt: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdentifiedData {
    #[serde(default)]
    pub negotiated_rpc_version: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct OutgoingMessage<T: Serialize> {
    pub op: u8,
    pub d: T,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IdentifyData {
    pub rpc_version: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authentication: Option<String>,
    pub event_subscriptions: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestData {
    pub request_type: String,
    pub request_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_data: Option<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestResponseData {
    pub request_type: String,
    pub request_id: String,
    pub request_status: RequestStatus,
    #[serde(default)]
    pub response_data: Value,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestStatus {
    pub result: bool,
    pub code: u32,
    #[serde(default)]
    pub comment: Option<String>,
}

pub fn identify_message(
    rpc_version: u32,
    authentication: Option<String>,
) -> OutgoingMessage<IdentifyData> {
    OutgoingMessage {
        op: OP_IDENTIFY,
        d: IdentifyData {
            rpc_version,
            authentication,
            event_subscriptions: 0,
        },
    }
}

pub fn request_message(
    request_type: &str,
    request_id: String,
    request_data: Option<Value>,
) -> OutgoingMessage<RequestData> {
    OutgoingMessage {
        op: OP_REQUEST,
        d: RequestData {
            request_type: request_type.to_string(),
            request_id,
            request_data,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn obs_request_envelope_serializes_for_scene_switch() {
        let envelope = request_message(
            "SetCurrentProgramScene",
            "streamslate-1".to_string(),
            Some(json!({ "sceneName": "Camera" })),
        );

        let serialized = serde_json::to_value(envelope).unwrap();

        assert_eq!(
            serialized,
            json!({
                "op": 6,
                "d": {
                    "requestType": "SetCurrentProgramScene",
                    "requestId": "streamslate-1",
                    "requestData": {
                        "sceneName": "Camera"
                    }
                }
            })
        );
    }

    #[test]
    fn obs_identify_envelope_omits_auth_when_unused() {
        let envelope = identify_message(1, None);
        let serialized = serde_json::to_value(envelope).unwrap();

        assert_eq!(
            serialized,
            json!({
                "op": 1,
                "d": {
                    "rpcVersion": 1,
                    "eventSubscriptions": 0
                }
            })
        );
    }

    #[test]
    fn obs_response_parses_core_status_and_payload() {
        let response: ObsMessage = serde_json::from_value(json!({
            "op": 7,
            "d": {
                "requestType": "GetRecordStatus",
                "requestId": "streamslate-2",
                "requestStatus": {
                    "result": true,
                    "code": 100
                },
                "responseData": {
                    "outputActive": true
                }
            }
        }))
        .unwrap();

        assert_eq!(response.op, OP_REQUEST_RESPONSE);

        let data: RequestResponseData = serde_json::from_value(response.d).unwrap();
        assert_eq!(data.request_type, "GetRecordStatus");
        assert_eq!(data.request_id, "streamslate-2");
        assert!(data.request_status.result);
        assert_eq!(data.response_data["outputActive"], true);
    }
}
