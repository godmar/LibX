#!/usr/bin/perl -w

use strict;
use XML::LibXML;
use HTML::Entities;
use Cwd;

#
# Create an edition based on its XML file
#
my $config_xml = "config.xml";
my $httpeditionpath = "http://www.libx.org/editions/";
my $libxiedllpath="http://libx.org/libx/src/editions/LibXIE";

# Change this to build, say "libx-experimental-<edition>.xpi"
# If set to non-empty, will suppress creation of update.rdf file
# my $localbuild = "experimental-";
my $localbuild = "";

# path to edition directory
# example: /home/www/libx.org/editions/vt.2
# or /home/www/libx.org/editions/12/34/12345678.1
my $editionpath = $ARGV[0];
if (substr($editionpath, 0, 1) ne "/") {        # make relative paths absolute 
    $editionpath = cwd() . "/" . $editionpath;
}
if (substr($editionpath, length($editionpath) - 1, 1) ne "/") {
    $editionpath = $editionpath . '/'
}

if (!defined($editionpath) || ! -d $editionpath) {
    die "Usage: $0 edition_directory_path\n";
}

my $config = $editionpath . "$config_xml";
if (! -r $config) {
    die "$config does not exist.";
}

my $parser = XML::LibXML->new();
my $doc = $parser->parse_file($config);
#######################################################
my %conf = ();

my $root = $doc->documentElement();
# edition id is 'vt' or '12345678'
my $editionid = $root->getAttribute('id');

# relpath is for legacy: vt -> vt
# for new: 12345678 -> 12/34/12345678
my $editionrelpath = $editionid;
if ($editionid =~ /([0-9A-Z]{2})([0-9A-Z]{2})([0-9A-Z]{4})/) {
    $editionrelpath = $1 . "/" . $2 . "/" . $editionid;
}

# major.minor.release taken from config file
$conf{'libxversion'} = $root->getAttribute('version');

my $name = ${$root->getChildrenByTagName('name')}[0];

# this goes in install.rdf which does not accept entities
$conf{'emname'} = $name->getAttribute('long');
$conf{'emnameshort'} = encode_entities($name->getAttribute('short'));
$conf{'emdescription'} = encode_entities($name->getAttribute('description'));
# this goes in definitions.properties which requires entities
$conf{'libxedition'} = encode_entities($name->getAttribute('edition'));

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
my $defaultspreffile = $editionpath . "defaultprefs.xml";
open (DEFPREF, ">$defaultspreffile") || die "Could not write " . $defaultspreffile; 
print DEFPREF $pref->toString(1);
close (DEFPREF);

#
#
#######################################################

$conf{'additionalproperties'} = "";
$conf{'emhomepageURL'} = $httpeditionpath . $editionrelpath . "/libx.html";
$conf{'emupdateURL'} = $httpeditionpath . $editionrelpath . "/update.rdf";
$conf{'xpilocation'} = $httpeditionpath . $editionrelpath . "/libx-" . $localbuild . $editionid . ".xpi";

$conf{'builddate'} = `date +%Y%m%d`;
chomp($conf{'builddate'});

#######################################################

#
# Copy file $src to $dst directory, replacing all occurrences
# of $xxx$ with $conf{'xxx'}.
#
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

my $tmpdir = "tmp2.$$";
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

my $addtoplevelfiles = "install.js install.rdf changelog.txt chrome.manifest";
my $xpifile = $conf{'xpilocation'};
$xpifile =~ s/.*\/([^\/]*)/$1/;         # basename
system("rm $editionpath/$xpifile; " .
       "cd $tmpdir; " .
       "find . -name CVS -type d | xargs /bin/rm -fr ; " .
       "zip -r $editionpath/$xpifile ./chrome " . $addtoplevelfiles) == 0 || die "zip failed";

system("chmod g+w $editionpath/$xpifile") == 0 || die "chmod g+w failed";
system("touch $editionpath/uses_xml_config") == 0 || die "touch failed";
#print "created $xpifile. did not copy update.rdf and makelive.sh\n";
#exit;
############################################################

if ($localbuild eq "") {
    system("cp $tmpdir/update.rdf $editionpath") == 0 || die "could not copy update.rdf";
}

#my $icon = $conf{'emiconURL'};
#$icon =~ s/.*\/([^\/]*)/$1/;         # basename of icon

#####Code to modify Nullsoft install script by adding edition-specific files
sub convertChromeURL {
	my ($url) = shift(@_);
	if(substr($url, 0, 6) eq 'chrome') {	
		$url =~ s!(chrome:?/?/)|(libx/?)!!g; #Normalize path to what NSIS expects
		$url =~ s!/!\\!g; #Replace all UNIX-style path seps with Windows-style
		$url = '$APPDATA\LibX\\' . $url;
	}
	return $url;
}

#Read in text from hand-written nsi file
open (NSIS, "<setup.nsi") || die "Could not open setup.nsi for reading";
my $nsisText = do { local ($/); <NSIS> };      # slurp
close(NSIS);
my %flist = ();
my $eflist = "Auto-generated by xcreateextension.pl\n";
my $dlist = "Auto-generated by xcreateextension.pl\n";

#Build a hash of files and locations
foreach my $afile (@afiles) {
	my $fname = $afile->getAttribute('name');
	my $dir = &convertChromeURL($afile->getAttribute('directory'));
	 
	if(exists $flist{$dir}) {
		push @{$flist{$dir}}, $fname;		
	}
	else {
		$flist{$dir} = [$fname];
	}
}

#Add the install.rdf file
push @{$flist{&convertChromeURL('chrome://')}}, cwd() . "/$tmpdir/install.rdf";

#Build the strings to insert
for my $dir (keys %flist) {
	$eflist = $eflist . "  SetOutPath \"$dir\"\n";
	foreach my $fname (@{$flist{$dir}}) {
		if (substr($fname, 0, 1) ne '/') {
			$fname = '${EDITION_PATH}' . $fname;
		}
		$eflist = $eflist . '   File "' . "$fname\"\n";
		$dlist = $dlist . '  Delete "'. "$dir$fname". "\"\n";
	}
}

#Replace the $editionfiles$ symbol with the string
$nsisText =~ s/\$editionfiles\$/$eflist/;
$nsisText =~ s/\$deleteeditionfiles\$/$dlist/;

#Write the new file
open (NSIS, ">$editionpath" . "setup.nsi") || die "Could not upen $editionpath" . "setup.nsi for writing";
print NSIS $nsisText;
close (NSIS);

my $makensis = `/usr/bin/which makensis 2>/dev/null` || "/opt/nsis-current/Bin/makensis";
chomp ($makensis);
if (-x $makensis) {
    my $env = "-DJS_PATH=../base/chrome/libx/content/libx/";
    $env .= " -DDLL_PATH=./LibXIE/";
    $env .= " -DDLL_URL=$libxiedllpath";
    $env .= " -DLOCALE_PATH=../base/chrome/libx/locale/";
    $env .= " -DLOCALE=en-US";
    $env .= " -DEDITION_PATH=$editionpath";
	 $env .= " -DEDITION_ID=$editionid";
    system ("$makensis $env -V1 -NOCD $editionpath/setup.nsi") == 0 or die "$makensis $env failed.";
} else {
    print "$makensis not found, skipping IE build.\n";
}

system ("/bin/rm -rf $tmpdir");

exit 0;
