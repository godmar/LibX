#!/usr/bin/perl -w

use strict;
use XML::LibXML;

#
# Create an edition based on its XML file
#
my $config_xml = "config.xml";
my $copytargetdir = "/home/www/libx.org/editions";

my $edition = $ARGV[0];

if (!defined($edition) || ! -d $edition) {
    die "Usage: $0 edition\n";
}

my $config = $edition . "/$config_xml";
if (! -r $config) {
    die "$config does not exist.";
}

my $parser = XML::LibXML->new();
my $doc = $parser->parse_file($config);
#######################################################
my %conf = ();

#####
# While transitioning, add the $-prefixed entries from the */config file
# as additional properties.
#
my $addprop = "";
open (H, "<$edition/config") || die ("Can't read $edition/config");
while (<H>) {
    next if (/^#/ || /^\s*$/);
    chomp;
    chop if (/\r$/);
    if (/^\$(.*)$/) {           # line starts with a $
        $addprop = $addprop . "\n" . $1;
    } else {
        my ($key, $value) = split(/=/, $_, 2);
        # do not introduce these, non-dollar prefixed properties, they must come from XML below
        # $conf{$key} = $value;
    }
    #print "...$key...=+++" . $conf{$key} . "\n";
}
close(H);
$conf{'additionalproperties'} = $addprop;
#
#####

my $root = $doc->documentElement();
my $editionid = $root->getAttribute('id');

# major.minor.release taken from config file
$conf{'libxversion'} = $root->getAttribute('version');

my $name = ${$root->getChildrenByTagName('name')}[0];
$conf{'emname'} = $name->getAttribute('long');
$conf{'emnameshort'} = $name->getAttribute('short');
$conf{'emdescription'} = $name->getAttribute('description');
$conf{'libxedition'} = $name->getAttribute('edition');

# set logoURL and emiconURL variables from options
my $options_node = ${$root->getChildrenByTagName('options')}[0];
for my $o ($options_node->getChildrenByTagName('option')) {
    $conf{'logoURL'} = $o->getAttribute('value') if ($o->getAttribute('key') eq 'logo');
    $conf{'emiconURL'} = $o->getAttribute('value') if ($o->getAttribute('key') eq 'icon');
}

$conf{'emhomepageURL'} = "http://www.libx.org/editions/" . $editionid . "/libx.html";
$conf{'emupdateURL'} = "http://www.libx.org/editions/" . $editionid . "/update.rdf";
$conf{'xpilocation'} = "http://www.libx.org/editions/" . $editionid . "/libx-" . $editionid . ".xpi";

$conf{'builddate'} = `date +%Y%m%d`;
chomp($conf{'builddate'});

#######################################################

sub copyandreplace 
{
    my ($src, $dst) = @_;

    # copy files, replacing variables
    print "processing $src to $dst\n";
    local (*FS);
    open (FS, "<$src") || die "Could not open $src for reading";
    my $srctext = do { local ($/); <FS> };      # slurp
    close (FS);
    foreach my $key (keys(%conf)) {
        $srctext =~ s/\$$key\$/$conf{$key}/g;
    }
    open (FD, ">$dst") || die "Can't open $dst for writing";
    printf FD "%s", $srctext;
    close (FD);
}

my $tmpdir = "tmp2";
system("/bin/rm -rf $tmpdir");

my @files = split(/\s+/, `find ../base`);
foreach my $src (@files) {
    my $dst = $src;
    $dst =~ s/..\/base/$tmpdir/;
    if (-d $src) {
        # recreate directory
        system("mkdir $dst");
    } else {
        &copyandreplace($src, $dst);
    }
}

#
# add additional files as specified in additionalfiles/file
#
my $afiles_node = ${$root->getChildrenByTagName('additionalfiles')}[0];
my @afiles = $afiles_node->getChildrenByTagName('file');

foreach my $f (@afiles) {
    my $file = $f->getAttribute('name');
    my $dir = $f->getAttribute('directory');
    my $subvars = $f->getAttribute('substitutevars');
    if (defined($subvars) && $subvars eq "true") {
        &copyandreplace("$edition/$file", "$tmpdir/$dir/$file");
    } else {
        system("cp $edition/$file $tmpdir/$dir/$file");
    }
}

my $addtoplevelfiles = "install.rdf changelog.txt chrome.manifest";
my $xpifile = $conf{'xpilocation'};
$xpifile =~ s/.*\/([^\/]*)/$1/;         # basename
system("cd $tmpdir; " .
       "rm ../$edition/$xpifile; " .
       "find . -name CVS -type d | xargs /bin/rm -fr ; " .
       "zip -r ../$edition/$xpifile ./chrome " . $addtoplevelfiles);

system("touch $edition/uses_xml_config");
#print "created $xpifile. did not copy update.rdf and makelive.sh\n";
#exit;
############################################################

system("cp $tmpdir/update.rdf $edition");

my $livescript = "$edition/makelive.sh";
open (O, ">$livescript") || die ("Could not write to $livescript");

my $icon = $conf{'emiconURL'};
$icon =~ s/.*\/([^\/]*)/$1/;         # basename of icon

print O <<MAKELIVE_SCRIPT;
#!/bin/sh
T=$copytargetdir/$edition
test -d \$T || echo This works only on a machine where \$T exists
test -d \$T || exit
cp $xpifile \$T
cp update.rdf \$T
cp $icon \$T
cp config \$T

echo I have copied the files for this edition to the $copytargetdir/$edition/ directory

test -r \$T/.htaccess && echo \$T/.htaccess exists, please check for correctness of edition URL
test -r \$T/.htaccess || echo No \$T/.htaccess file found, will create a default one.

test -r \$T/.htaccess || cat > \$T/.htaccess << HTACCESSFILE
AddType application/x-xpinstall .xpi
Redirect /editions/$edition/libx.html http://libx.org/editions/download.php?edition=$edition
HTACCESSFILE

cat << BEGINHTACCESS
----- begin of .htaccess file -----
BEGINHTACCESS

test -r \$T/.htaccess && cat \$T/.htaccess
cat << ENDHTACCESS
----- end of .htaccess file -----

Do not forget to add this edition to $copytargetdir/editions.list
if it is to be shown on the libx.org main page
ENDHTACCESS
MAKELIVE_SCRIPT
        
close (O);
chmod 0755, "$livescript";

