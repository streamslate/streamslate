/*
 * This file is part of StreamSlate.
 * Copyright (C) 2025 StreamSlate Contributors
 *
 * Objective-C bridge for Syphon.framework (SyphonMetalServer).
 * Provides C-callable functions used by the Rust FFI layer.
 */

#import <Foundation/Foundation.h>
#import <Metal/Metal.h>
#import <Syphon/Syphon.h>

/// Internal handle wrapping the Metal device, command queue, and Syphon server.
typedef struct {
    id<MTLDevice>        device;
    id<MTLCommandQueue>  commandQueue;
    SyphonMetalServer   *server;
} SyphonHandle;

/// Create a SyphonMetalServer with the given name.
/// Returns an opaque handle, or NULL on failure.
void *syphon_server_create(const char *name) {
    @autoreleasepool {
        id<MTLDevice> device = MTLCreateSystemDefaultDevice();
        if (!device) {
            NSLog(@"[StreamSlate-Syphon] No Metal device available");
            return NULL;
        }

        id<MTLCommandQueue> queue = [device newCommandQueue];
        if (!queue) {
            NSLog(@"[StreamSlate-Syphon] Failed to create command queue");
            return NULL;
        }

        NSString *serverName = [NSString stringWithUTF8String:name];
        SyphonMetalServer *server = [[SyphonMetalServer alloc] initWithName:serverName
                                                                     device:device
                                                                    options:nil];
        if (!server) {
            NSLog(@"[StreamSlate-Syphon] Failed to create SyphonMetalServer");
            return NULL;
        }

        SyphonHandle *handle = (SyphonHandle *)malloc(sizeof(SyphonHandle));
        handle->device       = device;
        handle->commandQueue = queue;
        handle->server       = server;

        NSLog(@"[StreamSlate-Syphon] Server created: %@", serverName);
        return handle;
    }
}

/// Publish a BGRA frame to connected Syphon clients.
/// Returns 0 on success, non-zero on failure.
int syphon_server_publish_frame(void *handle_ptr,
                                const uint8_t *data,
                                unsigned int width,
                                unsigned int height,
                                unsigned int bytes_per_row) {
    @autoreleasepool {
        if (!handle_ptr || !data || width == 0 || height == 0) return -1;

        SyphonHandle *handle = (SyphonHandle *)handle_ptr;

        // Create a Metal texture descriptor matching the BGRA frame
        MTLTextureDescriptor *desc = [MTLTextureDescriptor
            texture2DDescriptorWithPixelFormat:MTLPixelFormatBGRA8Unorm
                                        width:width
                                       height:height
                                    mipmapped:NO];
        desc.usage = MTLTextureUsageShaderRead;

        id<MTLTexture> texture = [handle->device newTextureWithDescriptor:desc];
        if (!texture) return -1;

        // Upload pixel data into the texture
        MTLRegion region = MTLRegionMake2D(0, 0, width, height);
        [texture replaceRegion:region
                   mipmapLevel:0
                     withBytes:data
                   bytesPerRow:bytes_per_row];

        // Publish via Syphon
        id<MTLCommandBuffer> commandBuffer = [handle->commandQueue commandBuffer];
        [handle->server publishFrameTexture:texture
                            onCommandBuffer:commandBuffer
                                imageRegion:NSMakeRect(0, 0, width, height)
                                    flipped:NO];
        [commandBuffer commit];

        return 0;
    }
}

/// Check if any Syphon clients are connected.
int syphon_server_has_clients(void *handle_ptr) {
    if (!handle_ptr) return 0;
    SyphonHandle *handle = (SyphonHandle *)handle_ptr;
    return handle->server.hasClients ? 1 : 0;
}

/// Destroy the Syphon server and free resources.
void syphon_server_destroy(void *handle_ptr) {
    @autoreleasepool {
        if (!handle_ptr) return;
        SyphonHandle *handle = (SyphonHandle *)handle_ptr;

        [handle->server stop];
        handle->server       = nil;
        handle->commandQueue = nil;
        handle->device       = nil;
        free(handle);

        NSLog(@"[StreamSlate-Syphon] Server destroyed");
    }
}
