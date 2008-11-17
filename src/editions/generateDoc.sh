#!/bin/sh


files="../base/chrome/libx/content/libx ../base/chrome/libx/content/libx/catalogs"
outdir="doc"
defopts="-a -p"
opts=""

while [ $# -ge 1 ]; do
case "$1" in 
'-?')
    echo "Usage:"
    echo "$0 [-d outdir][-files files]"
    echo "    -d outdir    - directory to output documentation to"
    echo "    -files files - Quote-enclosed list of files to parse, defaults to all libx src files if this paramater is not specified"
    echo "    -chrome      - Generates documentation to be inserted into LibX XPI file if this option is specified "
    echo "    -a           - Specifies that all methods and fields should be output, even those that are not documented"
    echo "    -p           - Specifies that all private methods and fields should be output"
    echo "All other command line options are passed directly to jsdoc, see JSDoc-Toolkit wiki for complete reference"
    exit 2;
;;
-files)
    shift
    files=$1
;;
-chrome)
    opts="$opts $1"
;;
-d)
    shift
    outdir=$1
;;
*)
    opts="$opts $1"
;;
esac

shift
done

if [ "$opts" = "" ]; then
    opts=$defopts
fi
echo "Generating documentation..."
echo "Use -? for additional options"
echo "Options:           " $opts
echo "Files to document: " $files
echo "Output Directory:  " $outdir
java -jar ../jsdoc/jsrun.jar ../jsdoc/app/run.js $opts -t=../jsdoc/templates/jsdoc -d=$outdir $files



