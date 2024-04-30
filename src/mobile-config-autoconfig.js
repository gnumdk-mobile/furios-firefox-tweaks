// Copyright 2023 Arnaud Ferraris, Oliver Smith
// SPDX-License-Identifier: MPL-2.0
//
// Generate and update userChrome.css and userContent.css for the user's
// profile from CSS fragments in /etc/mobile-config-firefox, depending on the
// installed Firefox version. Set various defaults for about:config options in
// set_default_prefs().
//
// Log file:
// $ find ~/.mozilla -name mobile-config-firefox.log
//
// This is a Firefox autoconfig file:
// https://support.mozilla.org/en-US/kb/customizing-firefox-using-autoconfig
//
// The XPCOM APIs used here are the same as old Firefox add-ons used, and the
// documentation for them has been removed (can we use something else? patches
// welcome). They appear to still work fine for autoconfig scripts.
// https://web.archive.org/web/20201018211550/https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Code_snippets/File_I_O

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const Services = globalThis.Services;
Cu.import("resource://gre/modules/FileUtils.jsm");

var g_ff_version;
var g_updated = false;
var g_fragments_cache = {}; // cache for css_file_get_fragments()
var g_logFileStream;
var g_chromeDir; // nsIFile object for the "chrome" dir in user's profile


function write_line(ostream, line) {
    line = line + "\n"
    ostream.write(line, line.length);
}

// Create <profile>/chrome/ directory if not already present
function chrome_dir_init() {
    g_chromeDir = Services.dirsvc.get("ProfD", Ci.nsIFile);
    g_chromeDir.append("chrome");
    if (!g_chromeDir.exists()) {
        g_chromeDir.create(Ci.nsIFile.DIRECTORY_TYPE, FileUtils.PERMS_DIRECTORY);
    }
}

function log_init() {
    var mode = FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_APPEND;
    var logFile = g_chromeDir.clone();
    logFile.append("mobile-config-firefox.log");
    g_logFileStream = FileUtils.openFileOutputStream(logFile, mode);
}

function log(line) {
    var date = new Date().toISOString().replace("T", " ").slice(0, 19);
    line = "[" + date + "] " + line;
    write_line(g_logFileStream, line);
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
    return Services.appinfo.version.split(".")[0];
}

function get_firefox_version_previous() {
    var file = g_chromeDir.clone();
    file.append("ff_previous.txt");

    if (!file.exists())
        return "unknown";

    var istream = Cc["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Components.interfaces.nsIFileInputStream);
    istream.init(file, 0x01, 0444, 0);
    istream.QueryInterface(Components.interfaces.nsILineInputStream);

    var line = {};
    istream.readLine(line);
    istream.close();

    return line.value.trim();
}

function set_firefox_version_previous(new_version) {
    log("Updating previous Firefox version to: " + new_version);

    var file = g_chromeDir.clone();
    file.append("ff_previous.txt");

    var ostream = Cc["@mozilla.org/network/file-output-stream;1"].
                  createInstance(Components.interfaces.nsIFileOutputStream);
    ostream.init(file, 0x02 | 0x08 | 0x20, 0644, 0);
    write_line(ostream, new_version);
    ostream.close();
}

function trigger_firefox_restart() {
    log("Triggering Firefox restart");
    var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
    appStartup.quit(Ci.nsIAppStartup.eForceQuit | Ci.nsIAppStartup.eRestart);
}

// Check if a CSS fragment should be used or not, depending on the current
// Firefox version.
// fragment: e.g. "userChrome/popups.before-ff-108.css"
// returns: true if it should be used, false if it must not be used
function css_fragment_check_firefox_version(fragment) {
    if (fragment.indexOf(".before-ff-") !== -1) {
        var before_ff_version = fragment.split("-").pop().split(".")[0];
        if (g_ff_version >= before_ff_version) {
            log("Fragment with FF version check not included: " + fragment);
            return false;
        } else {
            log("Fragment with FF version check included: " + fragment);
            return true;
        }
    }

    return true;
}

// Get an array of paths to the fragments for one CSS file
// name: either "userChrome" or "userContent"
function css_file_get_fragments(name) {
    if (name in g_fragments_cache)
        return g_fragments_cache[name];

    var ret = [];
    var path = "/etc/mobile-config-firefox/" + name + ".files";
    log("Reading fragments from file: " + path);
    var file = new FileUtils.File(path);

    var istream = Cc["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Components.interfaces.nsIFileInputStream);
    istream.init(file, 0x01, 0444, 0);
    istream.QueryInterface(Components.interfaces.nsILineInputStream);

    var has_more;
    do {
        var line = {};
        has_more = istream.readLine(line);
        if (css_fragment_check_firefox_version(line.value))
            ret.push("/etc/mobile-config-firefox/" + line.value);

    } while (has_more);

    istream.close();

    g_fragments_cache[name] = ret;
    return ret;
}

// Create a nsIFile object with one of the CSS files in the user's profile as
// path. The file doesn't need to exist at this point.
// name: either "userChrome" or "userContent"
function css_file_get(name) {
    var ret = g_chromeDir.clone();
    ret.append(name + ".css");
    return ret;
}

// Delete either userChrome.css or userContent.css inside the user's profile if
// they have an older timestamp than the CSS fragments (or list of CSS
// fragments) installed system-wide.
// name: either "userChrome" or "userContent"
// file: return of css_file_get()
function css_file_delete_outdated(name, file) {
    var depends = css_file_get_fragments(name).slice(); /* copy the array */
    depends.push("/etc/mobile-config-firefox/" + name + ".files");
    for (var i in depends) {
        try {
            var depend = depends[i];
            var file_depend = new FileUtils.File(depend);

            if (file.lastModifiedTime < file_depend.lastModifiedTime) {
                log("Removing outdated file: " + file.path + " (newer: "
                    + depend + ")");
                file.remove(false);
                return;
            }
        } catch(e) {
            log("Error checking file " + depend + ": " + e);
        }
    }

    log("File is up-to-date: " + file.path);
    return;
}

// Read a CSS file line by line and resolve any @import statements relative to
// the file's directory. Also embeds any relative SVG files.
// file: nsIFile
// returns: array of CSS lines
function css_file_resolve_recursive(file) {
    var ret = [];
    var istream = Cc["@mozilla.org/network/file-input-stream;1"].
                    createInstance(Components.interfaces.nsIFileInputStream);
    istream.init(file, 0x01, 0444, 0);
    istream.QueryInterface(Components.interfaces.nsILineInputStream);

    var line_buffer = {};

    do {
        var has_more = istream.readLine(line_buffer);
        var line = line_buffer.value;
        if (line.slice(0, 7) == "@import") {
            var filename_clean = line.split(" ")[1].replace(/['";]+/g, "");
            var resolved_path = file.parent.path + "/" + filename_clean;
            var import_file = new FileUtils.File(resolved_path);
            if (!import_file.exists()) {
                log("CSS import from " + file.path + " not found: " + resolved_path);
                continue;
            }
            ret = ret.concat(css_file_resolve_recursive(import_file));
        } else {
            // Look for SVG files and embed them as data URIs
            var svg_match = line.match(/url\(['"]?([^'")]+\.svg)['"]?\)/);
            if (svg_match) {
                log("Line contains SVG:" + line);
                var svg_file = new FileUtils.File(file.parent.path + "/" + svg_match[1]);
                if (svg_file.exists()) {
                    var svg_fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                                        createInstance(Components.interfaces.nsIFileInputStream);
                    svg_fstream.init(svg_file, 0x01, 0444, 0);
                    var svg_sstream = Cc["@mozilla.org/scriptableinputstream;1"].
                                        createInstance(Components.interfaces.nsIScriptableInputStream);
                    svg_sstream.init(svg_fstream);

                    var svg = "";
                    var svg_chunk = "";
                    do {
                        svg_chunk = svg_sstream.read(4096);
                        svg += svg_chunk;
                    } while (svg_chunk.length > 0);

                    svg_sstream.close();
                    svg_fstream.close();

                    // XUL does not seem to expose btoa(), or I am too stupid to find it
                    // but I am also stupid enough to write it myself. Maybe.
                    function btoa(input) {
                        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                        var output = "";
                        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                        var i = 0;

                        while (i < input.length) {
                            chr1 = input.charCodeAt(i++);
                            chr2 = input.charCodeAt(i++);
                            chr3 = input.charCodeAt(i++);

                            enc1 = chr1 >> 2;
                            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                            enc4 = chr3 & 63;

                            if (isNaN(chr2)) {
                                enc3 = enc4 = 64;
                            } else if (isNaN(chr3)) {
                                enc4 = 64;
                            }

                            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                                     keyStr.charAt(enc3) + keyStr.charAt(enc4);
                        }

                        return output;
                    }

                    var svg_data_uri = "url('data:image/svg+xml;base64," +
                                       btoa(svg) + "')";
                    line = line.replace(/url\(['"]?[^'")]+\.svg['"]?\)/, svg_data_uri);
                } else {
                    log("SVG file not found: " + svg_file.path);
                }
            }
            ret.push(line);
        }
    } while (has_more);

    istream.close();

    return ret;
}

// Create userChrome.css / userContent.css in the user's profile, based on the
// CSS fragments stored in /etc/mobile-config-firefox.
// name: either "userChrome" or "userContent"
// file: return of css_file_get()
function css_file_merge(name, file) {
    log("Creating CSS file from fragments: " + file.path);

    var ostream = Cc["@mozilla.org/network/file-output-stream;1"].
                  createInstance(Components.interfaces.nsIFileOutputStream);
    ostream.init(file, 0x02 | 0x08 | 0x20, 0644, 0);

    var fragments = css_file_get_fragments(name);
    for (var i in fragments) {
        var line;
        var fragment = fragments[i];
        log("- " + fragment);
        write_line(ostream, "/* === " + fragment + " === */");

        var file_fragment = new FileUtils.File(fragment);
        var fragment_lines = css_file_resolve_recursive(file_fragment);
        for (var i = 0; i < fragment_lines.length; i++) {
            write_line(ostream, fragment_lines[i]);
        }
    }

    ostream.close();
    g_updated = true;
}

function css_files_update() {
    g_ff_version = get_firefox_version();
    var ff_previous = get_firefox_version_previous();
    log("Firefox version: " + g_ff_version + " (previous: " + ff_previous + ")");

    var names = ["userChrome", "userContent"];
    for (var i in names) {
        var name = names[i];
        var file = css_file_get(name);

        if (file.exists()) {
            if (g_ff_version != ff_previous) {
                log("Removing outdated file: " + file.path + " (Firefox" +
                    " version changed)");
                file.remove(false);
            } else {
                css_file_delete_outdated(name, file);
            }
        }

        if (!file.exists()) {
            css_file_merge(name, file);
        }
    }

    if (g_ff_version != ff_previous)
        set_firefox_version_previous(g_ff_version);
}

/**
 * Builds a user-agent as similar to the default as possible, but with "Mobile"
 * inserted into the platforms section.
 *
 * @returns {string}
 */
function build_user_agent() {
    var appinfo = Services.appinfo;
    var vendor = appinfo.vendor || "Mozilla";
    var os = appinfo.OS || "Linux";
    var version = get_firefox_version() + ".0";
    var name = appinfo.name || "Firefox";
    var arch = (appinfo.XPCOMABI && appinfo.XPCOMABI.includes("-"))
        ? appinfo.XPCOMABI.split("-")[0]
        : "aarch64";

    return `${vendor}/5.0 (X11; ${os} ${arch}; Mobile; rv:${version}) Gecko/20100101 ${name}/${version}`;
}

function set_default_prefs() {
    log("Setting default preferences");

    var user_agent = build_user_agent();
    defaultPref('general.useragent.override', user_agent);

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

    // Disable "Firefox View" feature by default. It's a pinned tab that allows
    // to "pick up" tabs from other devices after registering an account, and
    // shows recently closed tabs. The always pinned tab takes up screen estate
    // and it's slightly annoying if you do not want to register an account.
    defaultPref('browser.tabs.firefox-view', false);

    // FF >= 116 allows to use cameras via Pipewire. While it will likely still
    // take a while until this is made the default, on most mobile devices it
    // makes a lot of sense to enable it unconditionally, as cameras usually
    // only work with libcamera, not via plain v4l2.
    defaultPref('media.webrtc.camera.allow-pipewire', true);
}

function main() {
    log("Running mobile-config-autoconfig.js");
    css_files_update();

    // Restart Firefox immediately if one of the files got updated
    if (g_updated == true)
        trigger_firefox_restart();
    else
        set_default_prefs();

    log("Done");
}

chrome_dir_init();
log_init();
try {
    main();
} catch(e) {
    log("main() failed: " + e);

    // Let Firefox display the generic error message that something went wrong
    // in the autoconfig script.
    error;
}
g_logFileStream.close();
