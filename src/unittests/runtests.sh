#!/bin/sh

CLASSPATH="./js.jar"

# why is rhino beng invoked this way?
# for some reason, 'rhino loadlibx.js' doesn't load env.js properly. but if 
# rhino is invoked first and then load('loadlibx.js') is called, then env.js
# works.

echo "print('Loading environment, one moment...');load('loadlibx.js');load('$1');libx.testing.runAllUnitTests();" \
    | java -classpath .:$CLASSPATH: org.mozilla.javascript.tools.shell.Main
