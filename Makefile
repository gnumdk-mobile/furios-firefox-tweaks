# Copyright 2023 Oliver Smith
# SPDX-License-Identifier: MPL-2.0

HEADER_FILE := src/common/header.css
USERCHROME_FILES := $(HEADER_FILE) $(sort $(wildcard src/userChrome/*.css))
USERCONTENT_FILES := $(HEADER_FILE) $(sort $(wildcard src/userContent/*.css))
DESTDIR :=
FIREFOX_DIR := /usr/lib/firefox
FIREFOX_CONFIG_DIR := /etc/firefox

all: out/userChrome.files out/userContent.files

clean:
	rm -rf out
out:
	mkdir out

out/userChrome.files: $(USERCHROME_FILES) out
	for i in $(USERCHROME_FILES); do \
        echo "$$i" | cut -d/ -f 2-; \
    done > $@

out/userContent.files: $(USERCONTENT_FILES) out
	for i in $(USERCONTENT_FILES); do \
        echo "$$i" | cut -d/ -f 2-; \
    done > $@

install: all
	install -Dm644 src/policies.json \
		"$(DESTDIR)/$(FIREFOX_CONFIG_DIR)/policies/policies.json"
	install -Dm644 src/mobile-config-prefs.js \
		"$(DESTDIR)/$(FIREFOX_DIR)/defaults/pref/mobile-config-prefs.js"
	install -Dm644 src/mobile-config-autoconfig.js \
		"$(DESTDIR)/$(FIREFOX_DIR)/mobile-config-autoconfig.js"
	install -Dm644 "out/userChrome.files" \
		-t "$(DESTDIR)/etc/mobile-config-firefox"
	install -Dm644 "out/userContent.files" \
		-t "$(DESTDIR)/etc/mobile-config-firefox"
	for dir in common userChrome userContent; do \
		for i in src/$$dir/*.css; do \
			install \
				-Dm644 \
				"$$i" \
				-t "$(DESTDIR)/etc/mobile-config-firefox/$$dir"; \
		done; \
	done
	install -Dm644 org.postmarketos.mobile_config_firefox.metainfo.xml \
		"$(DESTDIR)/usr/share/metainfo/org.postmarketos.mobile_config_firefox.metainfo.xml"

.PHONY: all clean install
