#!/bin/sh


files="../base/chrome/libx/content/libx ../base/chrome/libx/content/libx/catalogs ../libx2 ../libx2/base"
outdir="doc"
defopts="-p"
opts=""

while [ $# -ge 1 ]; do
case "$1" in 
'-h')
    cat - << EOF 
Usage:
$0 [-d outdir][-files files]
  -d outdir    - directory to output documentation to, 
                 defaults to $outdir
    
  -files files - Quote-enclosed list of files to parse, defaults to
                 all files in $files

  -chrome      - Generates documentation ready to be inserted into LibX XPI 
                 file (use ./xcreateextension.pl -doc $outdir)

  -a           - Output all methods and fields, even not documented ones
  -p           - Output methods and fields marked @private
    
All other command line options are passed directly to jsdoc, see 
http://code.google.com/p/jsdoc-toolkit/wiki/CommandlineOptions

EOF
    exit 2;
;;
-files)
    shift
    files=$1
;;
-chrome)
    opts="$opts -chrome=chrome://libxdoc/content/"
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
echo "Use -h for additional options"
echo "Options:           " $opts
echo "Files to document: " $files
echo "Output Directory:  " $outdir
java -jar ../jsdoc/jsrun.jar ../jsdoc/app/run.js $opts -t=../jsdoc/templates/jsdoc -d=$outdir $files

cat > $outdir/rindex.html << EOF
<html>
<head>
	<script type="text/javascript">
		window.location = "chrome://libxdoc/content/index.html";
	</script>
</head>
<body>
</body>
</html>
EOF

