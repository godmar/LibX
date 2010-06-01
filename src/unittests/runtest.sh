#!/bin/sh

CLASSPATH="./js.jar"
LOADTESTS=""
SETFLAGS=""

if [ $# = 0 ]; then
    echo "Usage: $0 [--all] [--clearlog] [-r] [test]"
    exit 1
fi

if [ $1 = "--all" ]; then 
    for file in tests/*.js
    do 
        LOADTESTS="${LOADTESTS}load('${file}');"
    done
elif [ $1 = "--clearlogs" ]; then
    rm testlog_*
    exit
else
    LOADTESTS="load('tests/${1}.test.js');"
fi

if [ "x$2" = "x-r" ]; then
    SETFLAGS="libx.testing.recording(true);"
fi


# why is rhino beng invoked this way?
# for some reason, 'rhino loadlibx.js' doesn't load env.js properly. but if 
# rhino is invoked first and then load('loadlibx.js') is called, then env.js
# works.

echo "print('Loading environment, one moment...');load('loadlibx.js');${LOADTESTS}${SETFLAGS}libx.testing.runAllUnitTests();" \
    | java -classpath .:$CLASSPATH: org.mozilla.javascript.tools.shell.Main
