#!/bin/sh

# glxtest can cause certain graphics drivers to crash the browser, especially
# under some canvas loads. We really don't need glxtest, and it turns out that
# this variable literally only does one thing: disable it. Hooray!

export MOZ_AVOID_OPENGL_ALTOGETHER=1
