#!/bin/sh

classpath="./js.jar"

echo "print('Loading environment, one moment...');load('loadlibx.js');load('$1');libx.testing.runAllUnitTests();" \
    | java -classpath .:$classpath: org.mozilla.javascript.tools.shell.Main
