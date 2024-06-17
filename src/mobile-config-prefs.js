// Copyright 2022 Oliver Smith, Martijn Braam
// SPDX-License-Identifier: MPL-2.0

// Set up autoconfig (we use it to copy/update userChrome.css into profile dir)
pref('general.config.filename', 'mobile-config-autoconfig.js');
pref('general.config.obscure_value', 0);
pref('general.config.sandbox_enabled', false);

// Enable android-style pinch-to-zoom
pref('dom.w3c.touch_events.enabled', true);
pref('apz.allow_zooming', true);
pref('apz.allow_double_tap_zooming', true);

// Enable legacy touch event APIs, as some websites use this to check for mobile compatibility
// and Firefox on Android behaves the same way
pref('dom.w3c_touch_events.legacy_apis.enabled', true);

// Save vertical space by hiding the titlebar
pref('browser.tabs.inTitlebar', 1);

// Allow UI customizations with userChrome.css and userContent.css
pref('toolkit.legacyUserProfileCustomizations.stylesheets', true);

// Select the entire URL with one click
pref('browser.urlbar.clickSelectsAll', true);

// Snap touches to nearest interactive elemetn
pref('ui.mouse.radius.bottommm', 2);
pref('ui.mouse.radius.enabled', true);
pref('ui.mouse.radius.leftmm', 4);
pref('ui.mouse.radius.rightmm', 4);
pref('ui.mouse.radius.topmm', 2);
pref('ui.touch.radius.bottommm', 2);
pref('ui.touch.radius.enabled', true);
pref('ui.touch.radius.leftmm', 4);
pref('ui.touch.radius.rightmm', 4);
pref('ui.touch.radius.topmm', 2);

// WebGL tweaks
pref('webgl.default-antialias', false);
pref('webgl.enable-debug-renderer-info', false);
pref('webgl.force-enabled', true);

// Improvements for touch gestures (zoom, etc)
pref('apz.gtk.pangesture.enabled', false);
pref('apz.one_touch_pinch.enabled', true);
pref('apz.content_response_timeout', 1000);

// Responsiveness tweaks; prioritize user interaction
pref('content.max.deflected.tokens', 64);
pref('content.max.tokenizing.time', 10000);

// Temporary workaround: don't throttle offscreen animations. This fixes the
// animations in the app menu being slow. Should be fixed properly in the future.
pref('dom.animations.offscreen-throttling', false);

// Use lowp precision for blitting
pref('gfx.blithelper.precision', 0);

// More misc rendering performance tweaks
pref('gfx.canvas.accelerated.aa-stroke.enabled', false);
pref('gfx.canvas.accelerated.force-enabled', true);
pref('gfx.canvas.accelerated.max-surface-size', 2048);
pref('gfx.canvas.accelerated.stroke-to-fill-path', true);
pref('gfx.content.skia-font-cache-size', 16);

// WebRender tweaks
pref('gfx.webrender.all', true);
pref('gfx.webrender.blob-tile-size', 128);
pref('gfx.webrender.compositor', true);
pref('gfx.webrender.compositor.force-enabled', true);
pref('gfx.webrender.fallback.software', false);
pref('gfx.webrender.force-disabled', false);
pref('gfx.webrender.enabled', true);
pref('gfx.webrender.force-enabled', true);
pref('gfx.webrender.multithreading', true);
pref('gfx.webrender.prefer-robustness', false);
pref('gfx.webrender.low-quality-pinch-zoom', true);
pref('gfx.webrender.max-shared-surface-size', 2048);
pref('gfx.webrender.precache-shaders', true);
pref('gfx.webrender.allow-partial-present-buffer-age', false);
pref('gfx.webrender.program-binary-disk', true);
pref('gfx.webrender.scissored-cache-clears.enabled', true);
pref('gfx.webrender.scissored-cache-clears.force-enabled', true);
pref('gfx.will-change.ignore-opacity', false);
pref('dom.animations.mainthread-synchronization-with-geometric-animations', false);
pref('gfx.webrender.multithreading', true);
pref('webgl.cgl.multithreaded', true);
pref('webgl.out-of-process.async-present', true);
pref('layers.gpu-process.enabled', true);
pref('layers.offmainthreadcomposition.force-disabled', false);
pref('layout.scrollbars.always-layerize-track', false);

pref('gfx.display.max-frame-rate', 120);



// Reuse stacking contexts
pref('layout.display-list.retain.sc', true);

pref('layout.lower_priority_refresh_driver_during_load', false);

// Don't throttle iframe layout calculations.
pref('layout.throttle_in_process_iframes', false);

// Disable backdrop-filter - it's usually used for blurs and is very slow right now.
pref('layout.css.backdrop-filter.enabled', false);

// Fix icon coloring
pref('svg.context-properties.content.enabled', true);

// Disable caret browsing, can be confusing on mobile
pref('accessibility.browsewithcaret_shortcut.enabled', false);
pref('accessibility.typeaheadfind', false);

// Download without asking
pref('browser.download.folderList', 1);
pref('browser.download.useDownloadDir', true);

// Directly open PDFs
pref('browser.download.open_pdf_attachments_inline', true);
pref('pdfjs.handleOctetStream', true);

// Keep a couple processes alive to improve responsiveness
pref('dom.ipc.keepProcessesAlive.extension', 1);
pref('dom.ipc.keepProcessesAlive.web', 1);

// Allow webpush notifications to open stuff even if they take a bit to start up
pref('dom.serviceWorkers.disable_open_click_delay', 100000);

// Improve caret usability
pref('layout.accessiblecaret.caret_shown_when_long_tapping_on_empty_content', false);
pref('layout.accessiblecaret.extend_selection_for_phone_number', true);
pref('layout.accessiblecaret.script_change_update_mode', 1);

// Not super sure what these actually do; stole from Fennec
pref('image.cache.size', 1048576); // bytes
pref('media.video-queue.default-size', 3);
pref('media.video-queue.send-to-compositor-size', 1);
pref('network.http.http2.default-hpack-buffer', 4096);
pref('network.http.http2.push-allowance', 32768);
pref('network.http.keep-alive.timeout', 109);
pref('network.tickle-wifi.enabled', true);

// Disable PiP controls - they don't work here and are just annoying
pref('media.videocontrols.picture-in-picture.enabled', false);

// Restart the GPU process when it crashes instead of giving up the ghost
pref('layers.gpu-process.max_restarts', 64);
pref('layers.gpu-process.stable.frame-threshold', 1);
pref('layers.gpu-process.stable.min-uptime-ms', 1);

// Correctly calculate vsync rate even if idle -- fixes hitch when interacting after a few seconds
pref('widget.wayland.vsync.keep-firing-at-idle', true);

// Disable pointer lock API, causes crash if no mouse is connected
pref('full-screen-api.pointer-lock.enabled', false);
pref('dom.pointer-lock.enabled', false);
