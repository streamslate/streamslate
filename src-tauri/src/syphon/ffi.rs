/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * FFI declarations for the Syphon Objective-C bridge.
 */

use std::os::raw::{c_char, c_int, c_uint, c_void};

extern "C" {
    pub fn syphon_server_create(name: *const c_char) -> *mut c_void;

    pub fn syphon_server_publish_frame(
        handle: *mut c_void,
        data: *const u8,
        width: c_uint,
        height: c_uint,
        bytes_per_row: c_uint,
    ) -> c_int;

    pub fn syphon_server_has_clients(handle: *mut c_void) -> c_int;

    pub fn syphon_server_destroy(handle: *mut c_void);
}
