#crxmake --pack-extension=helloworld \
#    --extension-output=helloworld.crx \
#    --pack-extension-key=helloworld.pem 

rm -r /tmp/crxtmp
cp -r crxroot /tmp/crxtmp
cp -r core /tmp/crxtmp/core

crxmake --pack-extension=/tmp/crxtmp \
    --extension-output=~/libx.crx \
    --pack-extension-key=~/libx.pem 