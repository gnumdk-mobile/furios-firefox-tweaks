// Copyright 2023 Arnaud Ferraris, Oliver Smith
// SPDX-License-Identifier: MPL-2.0
// This is a Firefox autoconfig file:
// https://support.mozilla.org/en-US/kb/customizing-firefox-using-autoconfig
// Import custom userChrome.css on startup or new profile creation
// Log file: $(find ~/.mozilla -name mobile-config-firefox.log)

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");

var updated = false;

// Create <profile>/chrome/ directory if not already present
var chromeDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
chromeDir.append("chrome");
if (!chromeDir.exists()) {
    chromeDir.create(Ci.nsIFile.DIRECTORY_TYPE, FileUtils.PERMS_DIRECTORY);
}

var logFile = chromeDir.clone();
logFile.append("mobile-config-firefox.log");
var mode = FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_APPEND;
var logFileStream = FileUtils.openFileOutputStream(logFile, mode);

function log(line) {
    var date = new Date().toISOString().replace("T", " ").slice(0, 19);
    line = "[" + date + "] " + line + "\n";
    logFileStream.write(line, line.length);
}

// Debug function for logging object attributes
function log_obj(obj) {
    var prop;
    var value;

    for (var prop in obj) {
        try {
            value = obj[prop];
        } catch(e) {
            value = e;
        }
        log(" - " + prop + ": " + value);
    }
}

function get_firefox_version() {
    try {
        return Services.appinfo.lastAppVersion;
    } catch(e) {
        log("Failed to get FF version: " + e);
        return 0;
    }
}

function trigger_firefox_restart() {
    log("Triggering Firefox restart");
    var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
    appStartup.quit(Ci.nsIAppStartup.eForceQuit | Ci.nsIAppStartup.eRestart);
}

function set_default_prefs() {
    log("Setting default preferences");
    // Select a mobile user agent for firefox (same as tor browser on android)
    defaultPref('general.useragent.override', 'Mozilla/5.0 (Android 10; Mobile; rv:110.0) Gecko/110.0 Firefox/110.0');

    // Do not suggest facebook, ebay, reddit etc. in the urlbar. Same as
    // Settings -> Privacy & Security -> Address Bar -> Shortcuts. As
    // side-effect, the urlbar results are not immediatelly opened once
    // clicking the urlbar.
    defaultPref('browser.urlbar.suggest.topsites', false);

    // Do not suggest search engines. Even though amazon is removed via
    // policies.json, it gets installed shortly after the browser is opened.
    // With this option, at least there is no big "Search with Amazon" message
    // in the urlbar results as soon as typing the letter "a".
    defaultPref('browser.urlbar.suggest.engines', false);

    // Show about:home in new tabs, so it's not just a weird looking completely
    // empty page.
    defaultPref('browser.newtabpage.enabled', true);
}

log("Running mobile-config-autoconfig.js");

var ff_version = get_firefox_version();
log("Firefox version: " + ff_version);

// Create nsIFile objects for userChrome.css in <profile>/chrome/ and in /etc/
var chromeFile = chromeDir.clone();
chromeFile.append("userChrome.css");
var defaultChrome = new FileUtils.File("/etc/mobile-config-firefox/userChrome.css");

// Remove the existing userChrome.css if older than the installed one
if (chromeFile.exists() && defaultChrome.exists() &&
        chromeFile.lastModifiedTime < defaultChrome.lastModifiedTime) {
    log("Removing outdated userChrome.css from profile");
    chromeFile.remove(false);
}

// Copy userChrome.css to <profile>/chrome/
if (!chromeFile.exists()) {
    log("Copying userChrome.css from /etc/mobile-config-firefox to profile");
    defaultChrome.copyTo(chromeDir, "userChrome.css");
    updated = true;
}

// Create nsIFile objects for userContent.css in <profile>/chrome/ and in /etc/
var contentFile = chromeDir.clone();
contentFile.append("userContent.css");
var defaultContent = new FileUtils.File("/etc/mobile-config-firefox/userContent.css");

// Remove the existing userContent.css if older than the installed one
if (contentFile.exists() && defaultContent.exists() &&
        contentFile.lastModifiedTime < defaultContent.lastModifiedTime) {
    log("Removing outdated userContent.css from profile");
    contentFile.remove(false);
}

// Copy userContent.css to <profile>/chrome/
if (!contentFile.exists()) {
    log("Copying userContent.css from /etc/mobile-config-firefox to profile");
    defaultContent.copyTo(chromeDir, "userContent.css");
    updated = true;
}

// Restart Firefox immediately if one of the files got updated
if (updated == true)
    trigger_firefox_restart();
else
    set_default_prefs();

log("Done");
logFileStream.close();
