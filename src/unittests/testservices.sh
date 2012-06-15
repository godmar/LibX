
echo "print('Loading environment, one moment...');load('loadlibx.js');load('services.js');" | \
    java -classpath .:js.jar org.mozilla.javascript.tools.shell.Main -opt -1

