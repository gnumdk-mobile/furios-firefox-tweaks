# Copyright 2023 Oliver Smith
# SPDX-License-Identifier: MPL-2.0

HEADER_FILE := src/common/header.css
USERCHROME_FILES := $(HEADER_FILE) $(sort $(wildcard src/userChrome/*.css))
USERCONTENT_FILES := $(HEADER_FILE) $(sort $(wildcard src/userContent/*.css))

USERCHROME_FILES += src/firefox-gnome-theme/userChrome.css
USERCONTENT_FILES += src/firefox-gnome-theme/userContent.css

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
	src/prepare_install.sh "$(FIREFOX_DIR)" "$(DESTDIR)"
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
	# Ensure DESTDIR is an absolute path \
	DESTDIR=$$(realpath "$(DESTDIR)"); \
	walk_dir() { \
		echo "1 = $$1" ; \
		for i in "$$1"/*; do \
			echo "i = $$i"; \
			if [ -d "$$i" ]; then \
				echo "Installing directory: $$i"; \
				walk_dir "$$i"; \
			else \
				echo "Installing file: $$i to $$DESTDIR/etc/mobile-config-firefox/$$i"; \
				install -Dm644 "$$i" -t "$$DESTDIR/etc/mobile-config-firefox/$$(dirname "$$i")"; \
			fi; \
		done; \
	}; \
	cd src; \
	for dir in common userChrome userContent firefox-gnome-theme; do \
		walk_dir "$$dir"; \
	done; \
	cd ..
	install -Dm644 org.postmarketos.mobile_config_firefox.metainfo.xml \
		"$(DESTDIR)/usr/share/metainfo/org.postmarketos.mobile_config_firefox.metainfo.xml"

uninstall:
	src/prepare_uninstall.sh "$(FIREFOX_DIR)" "$(DESTDIR)"
	rm -fv "$(DESTDIR)/$(FIREFOX_CONFIG_DIR)/policies/policies.json"
	rm -fv "$(DESTDIR)/$(FIREFOX_DIR)/defaults/pref/mobile-config-prefs.js"
	rm -fv "$(DESTDIR)/$(FIREFOX_DIR)/mobile-config-autoconfig.js"
	rm -rfv "$(DESTDIR)/etc/mobile-config-firefox"
	rm -fv "$(DESTDIR)/usr/share/metainfo/org.postmarketos.mobile_config_firefox.metainfo.xml"


.PHONY: all clean install uninstall
