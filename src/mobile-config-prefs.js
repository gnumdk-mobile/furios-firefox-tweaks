// Copyright 2022 Oliver Smith, Martijn Braam
// SPDX-License-Identifier: MPL-2.0

// Set up autoconfig (we use it to copy/update userChrome.css into profile dir)
pref('general.config.filename', "mobile-config-autoconfig.js");
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

// Disable search suggestions
pref('browser.search.suggest.enabled', false);

// Empty new tab page: faster, less distractions
pref('browser.newtabpage.enabled', false);

// Allow UI customizations with userChrome.css and userContent.css
pref('toolkit.legacyUserProfileCustomizations.stylesheets', true);

// Select the entire URL with one click
pref('browser.urlbar.clickSelectsAll', true);

// Disable cosmetic animations, save CPU
pref('toolkit.cosmeticAnimations.enabled', false);

// Disable download animations, save CPU
pref('browser.download.animateNotifications', false);
