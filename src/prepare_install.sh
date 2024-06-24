#!/bin/sh
FIREFOX_DIR="$1"
DESTDIR="$2"

if ! [ -d "$FIREFOX_DIR"/browser ]; then
	echo
	echo "WARNING: FIREFOX_DIR does not exist: $FIREFOX_DIR"
	echo "This should be fine during packaging. However if you just ran"
	echo "'make install' manually, consider running 'make uninstall', then"
	echo "adjusting FIREFOX_DIR (in the Makefile or via environment"
	echo "variable) and running 'make install' again."
	echo
fi

if [ -z "$DESTDIR" ] && [ "$(id -u)" != 0 ]; then
	echo
	echo "ERROR: run make install as root!"
	echo
	echo "$ make"
	echo "$ sudo make FIREFOX_DIR=$FIREFOX_DIR install"
	echo
	exit 1
fi
