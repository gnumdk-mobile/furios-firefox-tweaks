#!/bin/sh
# Copyright 2020 Oliver Smith
# SPDX-License-Identifier: GPL-3.0-or-later

# Create chrome/userChrome.css symlink in a firefox profile dir
# $1: path to profile dir, e.g. "/home/user/.mozilla/firefox/asdf.default"
prepare_profile() {
	mkdir -p "$1/chrome"
	if ! [ -e "$1/chrome/userChrome.css" ]; then
		ln -sv /etc/mobile-config-firefox/userChrome.css \
			"$1/chrome/userChrome.css"
	fi
}

profile_found=false
for profiledir in ~/.mozilla/firefox/*/; do
	if ! [ -e "$profiledir/prefs.js" ]; then
		continue
	fi

	prepare_profile "$profiledir"
	profile_found=true
done

if [ "$profile_found" = "true" ]; then
	exec /usr/bin/firefox "$@"
else
	profiledir=~/.mozilla/firefox/firefox.default
	prepare_profile "$profiledir"
	exec /usr/bin/firefox --profile "$profiledir" "$@"
fi
