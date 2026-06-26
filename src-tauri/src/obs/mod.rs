/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

//! OBS WebSocket v5 client and runtime state.

mod client;
mod protocol;
mod runtime;

pub use client::{
    OBSConnectionInfo, OBSRecordStatus, OBSRuntimeState, OBSScene, OBSSource, OBSStreamStatus,
    ObsError,
};
pub use runtime::{
    connect, disconnect, get_record_status, get_state, get_stream_status, list_scenes,
    set_current_scene, set_source_visibility, start_record, start_stream, stop_record, stop_stream,
};
