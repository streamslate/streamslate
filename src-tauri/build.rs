/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

fn main() {
    #[cfg(target_os = "macos")]
    println!("cargo:rustc-link-arg=-Wl,-rpath,/usr/lib/swift");

    // Compile Syphon Objective-C bridge when the syphon feature is enabled
    #[cfg(target_os = "macos")]
    if std::env::var("CARGO_FEATURE_SYPHON").is_ok() {
        cc::Build::new()
            .file("src/syphon/syphon_bridge.m")
            .flag("-fobjc-arc")
            .flag("-F/Library/Frameworks")
            .include("/Library/Frameworks/Syphon.framework/Headers")
            .compile("syphon_bridge");

        println!("cargo:rustc-link-lib=framework=Metal");
        println!("cargo:rustc-link-lib=framework=Foundation");
        println!("cargo:rustc-link-search=framework=/Library/Frameworks");
        println!("cargo:rustc-link-lib=framework=Syphon");
    }

    tauri_build::build()
}
