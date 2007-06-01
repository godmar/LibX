#!/usr/bin/perl -w

use strict;
use XML::LibXML;
use Cwd;

#
# Create an edition based on its XML file
#
my $config_xml = "config.xml";
my $copytargetdir = "/home/www/libx.org/editions";
my $httpeditionpath = "http://www.libx.org/editions/";

# path to edition directory
my $editionpath = $ARGV[0];
if (substr($editionpath, 0, 1) ne "/") {        # make relative paths absolute 
    $editionpath = cwd() . "/" . $editionpath;
}

if (!defined($editionpath) || ! -d $editionpath) {
    die "Usage: $0 edition_directory_path\n";
}

my $config = $editionpath . "/$config_xml";
if (! -r $config) {
    die "$config does not exist.";
}

my $parser = XML::LibXML->new();
my $doc = $parser->parse_file($config);
#######################################################
my %conf = ();

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
#######################################################
# code to create default preferences file
#
# Should we use XML::Simple here? Order doesn't matter.
#
my $pref = XML::LibXML::Document->new();

sub getCatalog {
    my ($cat0, $type) = @_;
    my $cat = $pref->createElement("catalog");
    $cat->setAttribute('name', $cat0->getAttribute('name'));
    $cat->setAttribute('type', $type);
    return $cat;
}

sub getOpenURL {
    my ($openurl0, $type) = @_;
    my $o = $pref->createElement("openurl");
    $o->setAttribute('name', $openurl0->getAttribute('name'));
    $o->setAttribute('type', $type);
    return $o;
}

my $cat0 = ${$root->findnodes('//catalogs/*')}[0];
my $openurl0 = ${$root->findnodes('//openurl/resolver[1]')}[0];
my $proxy0 = ${$root->findnodes('//proxy/*[1]')}[0];

my $prefroot = $pref->createElement('preferences');
$pref->setDocumentElement($prefroot);
my $prefcmenu = $pref->createElement('contextmenu');
$prefroot->appendChild($prefcmenu);

my $isbn = $pref->createElement('isbn');
if ($cat0) {
    $isbn->appendChild(getCatalog($cat0, 'i'));
    if ($cat0->findnodes('xisbn')) {
        $isbn->appendChild(getCatalog($cat0, 'xisbn'));
    }
}
$prefcmenu->appendChild($isbn);

my $issn = $pref->createElement('issn');
$issn->appendChild(getCatalog($cat0, 'i')) if ($cat0);
$issn->appendChild(getOpenURL($openurl0, 'i')) if ($openurl0);
$prefcmenu->appendChild($issn);

my $doi = $pref->createElement('doi');
$doi->appendChild(getOpenURL($openurl0, 'doi')) if ($openurl0);
$prefcmenu->appendChild($doi);

my $pmid = $pref->createElement('pmid');
$pmid->appendChild(getOpenURL($openurl0, 'pmid')) if ($openurl0);
$prefcmenu->appendChild($pmid);

# enable Keyword, Title, Author by default for general
my $default = $pref->createElement('general');
$default->appendChild(getCatalog($cat0, 'Y')) if ($cat0);
$default->appendChild(getCatalog($cat0, 't')) if ($cat0);
$default->appendChild(getCatalog($cat0, 'a')) if ($cat0);

# enable magic button by default
my $scholarpref = $pref->createElement('scholar');
$scholarpref->setAttribute('name', 'Google Scholar');
$scholarpref->setAttribute('type', 'magicsearch');
$default->appendChild($scholarpref);
$prefcmenu->appendChild($default);

if ($proxy0) {
    my $proxy = $pref->createElement('proxy');
    my $proxypref = $pref->createElement('proxy');
    $proxypref->setAttribute('name', $proxy0->getAttribute('name'));
    $proxypref->setAttribute('type', 'enabled');
    $proxy->appendChild($proxypref);
    $prefcmenu->appendChild($proxy);
}

# XXX once edition maker writes this file, don't blindly overwrite it.
my $defaultspreffile = $editionpath . "/defaultprefs.xml";
open (DEFPREF, ">$defaultspreffile") || die "Could not write " . $defaultspreffile; 
print DEFPREF $pref->toString(1);
close (DEFPREF);

#
#
#######################################################

$conf{'additionalproperties'} = "";
$conf{'emhomepageURL'} = $httpeditionpath . $editionid . "/libx.html";
$conf{'emupdateURL'} = $httpeditionpath . $editionid . "/update.rdf";
$conf{'xpilocation'} = $httpeditionpath . $editionid . "/libx-" . $editionid . ".xpi";

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
if (-d $tmpdir) {
    system("/bin/rm -r $tmpdir") == 0 or die "$!: cannot rm " . $tmpdir . " in " . `pwd` . " running as " . `id`;
}

my @files = split(/\s+/, `find ../base`);
foreach my $src (@files) {
    my $dst = $src;
    $dst =~ s/..\/base/$tmpdir/;
    if (-d $src) {
        # recreate directory
        system("mkdir $dst") == 0 || die "$!: cannot mkdir $dst in " . `pwd` . " running as " . `id`;
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
        &copyandreplace("$editionpath/$file", "$tmpdir/$dir/$file");
    } else {
        system("cp $editionpath/$file $tmpdir/$dir/$file") == 0 || die "Cannot copy $editionpath/$file $tmpdir/$dir/$file";
    }
}

my $addtoplevelfiles = "install.rdf changelog.txt chrome.manifest";
my $xpifile = $conf{'xpilocation'};
$xpifile =~ s/.*\/([^\/]*)/$1/;         # basename
system("rm $editionpath/$xpifile; " .
       "cd $tmpdir; " .
       "find . -name CVS -type d | xargs /bin/rm -fr ; " .
       "zip -r $editionpath/$xpifile ./chrome " . $addtoplevelfiles) == 0 || die "zip failed";

system("touch $editionpath/uses_xml_config") == 0 || die "touch failed";
#print "created $xpifile. did not copy update.rdf and makelive.sh\n";
#exit;
############################################################

system("cp $tmpdir/update.rdf $editionpath") == 0 || die "could not copy update.rdf";

my $livescript = "$editionpath/makelive.sh";
open (O, ">$livescript") || die ("Could not write to $livescript");

my $icon = $conf{'emiconURL'};
$icon =~ s/.*\/([^\/]*)/$1/;         # basename of icon

print O <<MAKELIVE_SCRIPT;
#!/bin/sh
T=$copytargetdir/$editionid
test -d \$T || echo This works only on a machine where \$T exists
test -d \$T || exit
cp $xpifile \$T
cp update.rdf \$T
cp $icon \$T
cp config \$T

echo I have copied the files for this edition to the $copytargetdir/$editionid/ directory

test -r \$T/.htaccess && echo \$T/.htaccess exists, please check for correctness of edition URL
test -r \$T/.htaccess || echo No \$T/.htaccess file found, will create a default one.

test -r \$T/.htaccess || cat > \$T/.htaccess << HTACCESSFILE
AddType application/x-xpinstall .xpi
Redirect /editions/$editionid/libx.html http://libx.org/editions/download.php?edition=$editionid
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

exit 0;
