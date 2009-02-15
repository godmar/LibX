#!/bin/sh

# run a test .js file after loading loadlibx.js
jrunscript -cp . -f loadlibx.js -f $*

