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
    for file in ${1+"$@"}
    do 
        LOADTESTS="${LOADTESTS}load('tests/${file}.test.js');"
    done
fi

if [ "x$2" = "x-r" ]; then
    SETFLAGS="libx.testing.setRecordingMode(true);"
fi


# why is rhino beng invoked this way?
# for some reason, 'rhino loadlibx.js' doesn't load env.js properly. but if 
# rhino is invoked first and then load('loadlibx.js') is called, then env.js
# works.

# add -opt -1 to this
echo "print('Loading environment, one moment...');load('loadlibx.js');load('testing.js');${LOADTESTS}${SETFLAGS}libx.testing.runAllUnitTests();" \
    | java -classpath $CLASSPATH org.mozilla.javascript.tools.shell.Main
    