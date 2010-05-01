#!/bin/bash

# path to private key file
keypath=~/libx.pem

# path to output crx
crxout=~/libx.crx

# temporary directory to create crx structure in
crxtmp=/tmp/crxtmp

if [ ! -f $keypath ]; then
    echo "Please set keypath to point to the private key."
    exit 1
fi

# change to directory containing this script
cd `dirname $0`

rm -r $crxtmp
cp -r ./crxroot $crxtmp
cp -r ./popup $crxtmp/popup
cp -r ./core $crxtmp/core

crxmake --pack-extension=$crxtmp \
    --extension-output=$crxout \
    --pack-extension-key=$keypath