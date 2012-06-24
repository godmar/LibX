CLASSPATH=".:./js.jar"

echo "print('Loading environment, one moment...');load('loadlibx.js');load('services.js');" \
    | java -classpath $CLASSPATH org.mozilla.javascript.tools.shell.Main -opt -1
    
