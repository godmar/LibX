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
# http URL to directory containing LibXIE dll files
my $libxiedllurl="http://libx.org/libx/src/editions/LibXIE";

# local path to directory containing LibXIE dll files
my $libxiedllpath="./LibXIE";
-d $libxiedllpath || die "DLL directory $libxiedllpath does not exist";

# directory that contains key3.db
my $keydirectory = "/home/www/libxprivatekey";
my $libxextid = "urn:mozilla:extension:{d75de36c-af0d-4dc2-b63a-0d482d4b9815}";

# from http://hyperstruct.net/projects/spock
my $spockexe = `/usr/bin/which spock 2>/dev/null` || "/opt/spock/spock";
chomp ($spockexe);
my $makensis = `/usr/bin/which makensis 2>/dev/null` || "/opt/nsis-current/Bin/makensis";
chomp ($makensis);

# XXX fix this ridiculous dependency
-d "../base" || die "This script must be run inside libx/src/editions";

# Change this to build, say "libx-experimental-<edition>.xpi"
# If set to non-empty, will suppress creation of update.rdf file
# my $localbuild = "experimental-";
my $localbuild = "";

# "Boolean" that determines whether setup.nsi will be a full install (all files
# bundled) or a partial installed (files needed are downloaded)
my $ieFullInstall = undef;

# process cmdline args
# this loop courtesy of Pat Tullmann, 1997 
while ($_ = $ARGV[0]) {
    last if /^--$/;  # allow "--" to stop option arg parsing
    last if /^[^-]/; # end on first non-switch

    shift @ARGV; # eat the option

    ## -h for usage
    /^-h$/ && do {(&usage("Help:")); next;};

    ## -localbuild to set a prefix
    if (/^-localbuild$/) {
        ($#ARGV >= 0) || &usage("-localbuild requires prefix");
        $localbuild = shift @ARGV;
        next;
    }

    # add more cmdline arguments here...

    #parameter to generate full IE installer
    if (/^-ie_full_installer$/) {
        $ieFullInstall = "true";
        next;
    }
    
    ## Unknown -args are fatal
    /^\-/ && (&usage("Unknown option: $_"));
}

&usage("config directory not specified") if !defined($ARGV[0]); 

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

-d $editionpath || &usage("directory $editionpath does not exist.");

my $config = $editionpath . "$config_xml";
if (! -r $config) {
    die "$config does not exist.";
}
print "Edition path is " . $editionpath . "\n";

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

# this goes in install.rdf so must escape HTML entities
$conf{'emname'} = encode_entities($name->getAttribute('long'));
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
# Default preferences are determined by
# attr contextmenuoptions for catalogs
# attr includeincontextmenu for catalogs/xisbn
# attr includeincontextmenu for OpenURL resolvers
# attr magicsearchincontextmenu for options
#
# These attributes may not exist, or may exist on only same
# catalogs.
#
my $pref = XML::LibXML::Document->new();

# Step 0.  Create <preferences><contextmenu></contextmenu><preferences>

my $prefroot = $pref->createElement('preferences');
$pref->setDocumentElement($prefroot);
my $prefcmenu = $pref->createElement('contextmenu');
$prefroot->appendChild($prefcmenu);

# does this catalog support option X?
sub hasOption {
    my ($cat0, $type) = @_;
    my $opt = $cat0->getAttribute('options');
    return (";" . $opt . ";") =~ m/;$type;/;
}

# create <elemtype name=@name type=@type> entry
sub makeElementNameType {
    my ($elemtype, $name, $type) = @_;
    my $elem = $pref->createElement($elemtype);
    $elem->setAttribute('name', $name);
    $elem->setAttribute('type', $type);
    return $elem;
}

# create <catalog name=@name type=@type> entry
sub makeCatalogEntry {
    my ($cat0, $type) = @_;
    return makeElementNameType('catalog', $cat0->getAttribute('name'), $type);
}

# create <openurl name=@name type=@type> entry
sub makeOpenURLEntry {
    my ($openurl0, $type) = @_;
    return makeElementNameType('openurl', $openurl0->getAttribute('name'), $type);
}

# retrieve configuration
my @catalogs = $root->findnodes('//catalogs/*');
my @openurls = $root->findnodes('//openurl/resolver');
my @proxies = $root->findnodes('//proxy/*');
my @magicsearchoption = $root->findnodes('//option[@key=\'magicsearchincontextmenu\']');

my $cat0 = $catalogs[0];

# Step 1.  Create <general>
my $default = $pref->createElement('general');
$prefcmenu->appendChild($default);

foreach my $catalog (@catalogs) {
    my $ctxtoptions = $catalog->getAttribute("contextmenuoptions");
    next if !(defined($ctxtoptions));
    foreach my $copt (split(/;/, $ctxtoptions)) {
        # exclude ISBN
        $default->appendChild(makeCatalogEntry($catalog, $copt)) if ($copt ne "i" && hasOption($catalog, $copt));
    }
}

# fallback
if (!$default->hasChildNodes() && $cat0) {
    # enable Keyword, Title, Author by default for general
    $default->appendChild(makeCatalogEntry($cat0, 'Y')) if (hasOption($cat0, 'Y'));
    $default->appendChild(makeCatalogEntry($cat0, 't')) if (hasOption($cat0, 't'));
    $default->appendChild(makeCatalogEntry($cat0, 'a')) if (hasOption($cat0, 'a'));
    if (!$default->hasChildNodes()) {
        # catalog has neither Y, t, or a - take the first option in this case
        my @opts = split(/;/, $cat0->getAttribute('options'));
        $default->appendChild(makeCatalogEntry($cat0, $opts[0]));
    }
}

# enable magic button unless turned off
if (!(@magicsearchoption) || $magicsearchoption[0]->getAttribute('value') eq "true") {
    $default->appendChild(makeElementNameType('scholar', 'Google Scholar', 'magicsearch'));
}

# Step 2.  Create <isbn>, <issn>, <pmid>, and <doi> together
my $isbn = $pref->createElement('isbn');
$prefcmenu->appendChild($isbn);
my $issn = $pref->createElement('issn');
$prefcmenu->appendChild($issn);
my $doi = $pref->createElement('doi');
$prefcmenu->appendChild($doi);
my $pmid = $pref->createElement('pmid');
$prefcmenu->appendChild($pmid);

# all openurl resolvers appear in ISSN, DOI, and PMID preferences
foreach my $openurl (@openurls) {
    my $icim = $openurl->getAttribute('includeincontextmenu');
    next if (defined($icim) && $icim eq "false");

    $issn->appendChild(makeOpenURLEntry($openurl, 'i'));
    $doi->appendChild(makeOpenURLEntry($openurl, 'doi'));
    $pmid->appendChild(makeOpenURLEntry($openurl, 'pmid'));
}

# all catalogs with 'i' appear in ISBN + ISSN
# if xisbn child does not have includeincontextmenu set to false also include all children
foreach my $catalog (@catalogs) {
    my $ctxtoptions = $catalog->getAttribute("contextmenuoptions");
    if (hasOption($catalog, 'i') && (!defined($ctxtoptions) || ";$ctxtoptions;" =~ m/;i;/)) {
        $isbn->appendChild(makeCatalogEntry($catalog, 'i'));
        $issn->appendChild(makeCatalogEntry($catalog, 'i'));
    }

    if ($catalog->findnodes('xisbn') && !$catalog->findnodes('xisbn[@includeincontextmenu = "false"]')) {
        $isbn->appendChild(makeCatalogEntry($catalog, 'xisbn'));
    }
}

# Step 3.  Create <proxy>
my $proxycat = $pref->createElement('proxy');
$prefcmenu->appendChild($proxycat);

foreach my $proxy (@proxies) {
    my $icim = $proxy->getAttribute('includeincontextmenu');
    next if (defined($icim) && $icim eq "false");

    $proxycat->appendChild(makeElementNameType('proxy', $proxy->getAttribute('name'), 'enabled'));
}
# for testing
#print $pref->toString(1);
#exit;

# write preferences to file
my $defaultspreffile = $editionpath . "defaultprefs.xml";
open (DEFPREF, ">$defaultspreffile") || die "Could not write " . $defaultspreffile; 
print DEFPREF $pref->toString(1);
close (DEFPREF);

#
#
#######################################################

$conf{'additionalproperties'} = "";     # legacy
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

    # ignore empty entries (they occur if people click and then do not upload.)
    next if ($file eq "");

    my $subvars = $f->getAttribute('substitutevars');
    if (defined($subvars) && $subvars eq "true") {
        &copyandreplace("$editionpath/$file", "$tmpdir/$dir/$file");
    } else {
        system("cp \"$editionpath/$file\" \"$tmpdir/$dir/$file\"") == 0 || die "Cannot copy $editionpath/$file $tmpdir/$dir/$file";
    }
}

my $addtoplevelfiles = "install.js install.rdf changelog.txt chrome.manifest";
my $xpifile = $conf{'xpilocation'};
$xpifile =~ s/.*\/([^\/]*)/$1/;         # basename
system("rm $editionpath$xpifile; " .
       "cd $tmpdir; " .
       "find . -name CVS -type d | xargs /bin/rm -fr ; " .
       "zip -r $editionpath/$xpifile ./chrome " . $addtoplevelfiles) == 0 || die "zip failed";

system("chmod g+w $editionpath/$xpifile") == 0 || die "chmod g+w failed";
system("touch $editionpath/uses_xml_config") == 0 || die "touch failed";
#print "created $xpifile. did not copy update.rdf and makelive.sh\n";
#exit;
############################################################

# add hash to and sign update.rdf
if ($localbuild eq "") {
    -x $spockexe || die "$spockexe does not exist or is not executable.";
    system("$spockexe -d $keydirectory -i \"$libxextid\" -f $editionpath$xpifile"
        . " $tmpdir/update.rdf > $editionpath/update.rdf") == 0
        || die "could not run spock to sign update.rdf: $!";
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
my $eflist = "# Auto-generated by xcreateextension.pl\n";
my $dlist = "# Auto-generated by xcreateextension.pl\n";

#functions to generate parts of setup.nsi script

# Generates a string used when creating the Nullsoft install script that will
# handle bundling JavaScript files in the installer.
#
# @param string path and name of file to retrieve information from
#
# @returns string
sub generateJavaScriptFileList {

    #handle parameter
    my $filePath = $_[0];

    open (FILE_LIST, "<$filePath") || die "Could not open $filePath for reading";
    my @jsFileList = <FILE_LIST>;
    close (FILE_LIST);

    my $catalogPrefix = "<catalog>";
    my $jsFilePrefix = '  File ';
    my $jsPathPrefix = '${JS_PATH}';
    my $productStorePrefix = '  SetOutPath "${PRODUCT_DATA_STORE}\content';
    my $productDataContent = $productStorePrefix . '"';
    my $productDataCatalog = $productStorePrefix . '\catalogs' . '"';
    my $jsFiles = "# Auto-generated by xcreateextension.pl\n";
    my $prefixSwitch = 'none';

    $jsFiles .= $productDataContent . "\n";
    $jsFiles .= $jsFilePrefix . '"' . $jsPathPrefix . 'filelist.txt"' . "\n";

    foreach my $jsFile (@jsFileList) {
        # Remove new line
        $jsFile =~ s/\n//;

        # Check whether the string contains a label <.*>
        if ($jsFile =~ /$catalogPrefix/) {
            if ('catalog' ne $prefixSwitch) {
                $prefixSwitch = 'catalog';
                $jsFiles .= $productDataCatalog . "\n";
            }
            #Remove the prefix
            $jsFile =~ s/$catalogPrefix(.*)/$1/;
            $jsFiles .= $jsFilePrefix . '"' . $jsPathPrefix . "catalogs/" 
                        . $jsFile . '"' . "\n";
        }
        else {
            if ('catalog' eq $prefixSwitch) {
                $jsFiles .= $productDataContent . "\n";
                $prefixSwitch = 'none';
            }
            $jsFiles .= $jsFilePrefix . '"' . $jsPathPrefix . $jsFile . '"' . "\n";
        }
    }

    return $jsFiles; 
}

# Generates a string used when creating the Nullsoft install script that will
# bundle all .dlls and other installers.
#
# @param array list of .dll files to include
# @param array list of paths for resource file
#
# @returns string
sub generateCoreScript {
    #handle reference parameters
    my $ieCoreFileList = $_[0];
    my $ieResourcePathList = $_[1];

    my $corelist = "# Auto-generated by xcreateextension.pl\n";

    #prefix for core files
    my $corePrefix = '  File "${DLL_PATH}';

    foreach my $coreFile (@{$ieCoreFileList}) {
        $corelist .= $corePrefix . $coreFile . '"' . "\n";
    }

    #Handle installation of msxml6.dll
    $corelist .= '  File "${DLL_PATH}msxml6.msi"' . "\n";
    $corelist .= "  nsExec::ExecToLog 'msiexec /quiet /i " . 
                 '"msxml6.msi"' . "'\n\n";

     my $setOutPath = '  SetOutPath "$INSTDIR\\';
     my $ieResourceFile = 'LibXIE.resources.dll';

     #handle resource file statements
     foreach my $resourcePath (@{$ieResourcePathList}) {
         $corelist .= $setOutPath . $resourcePath . '"' . "\n";
         $corelist .= $corePrefix . $resourcePath . '/' . 
                      $ieResourceFile . '"' . "\n";
     }

     return $corelist;
}

# Generates a string used when creating the Nullsoft install script that will
# download .dll files and other installers
#
# @param array list of .dll files to download
# @param array list of paths for resource file
#
# @returns string
sub generateDownloadScript {
    #handle reference parameters
    my $ieCoreFileList = $_[0];
    my $ieResourcePathList = $_[1];

    my $downloadlist = "# Auto-generated by xcreateextension.pl\n";

    #handle MSXML6
    $downloadlist .=
    '  IfFileExists "$SYSDIR\msxml6.dll" +6' . "\n" .
    '  Push "$TEMP"' . "\n" .
    '  Push "msxml6.msi"' . "\n" .
    '  Call getDependency # Download installer to temp dir' . "\n" .
    '  nsExec::ExecToLog ' . "'msiexec /quiet /i " . '"$TEMP\msxml6.msi"' . 
    "' # Install\n" .
    '  Delete "$TEMP\msxml6.msi" # Clean up' . "\n\n";

    my $pushInst = '  Push "$INSTDIR"';
    my $callDep = '  Call getDependency';
    my $callRes = '  Call getResource';
    my $ieResourceFile = 'LibXIE.resources.dll';

    foreach my $coreFile (@{$ieCoreFileList}) {
        $downloadlist .= $pushInst . "\n";
        $downloadlist .= '  Push "' . $coreFile . '"' . "\n";
        $downloadlist .= $callDep . "\n\n";
    }


    foreach my $resourcePath (@{$ieResourcePathList}) {
        $downloadlist .= $pushInst . "\n";
        $downloadlist .= '  Push "' . $resourcePath . '"' . "\n";
        $downloadlist .= '  Push "' . $ieResourceFile . '"' . "\n";
        $downloadlist .= $callRes . "\n\n";
    }
    return $downloadlist;
}



#List of .dll and other files used in setup.nsi (maybe these could be added to
#config.xml?)
my @ieCoreFileList = ('ActivScp.dll',
                      'Interop.SHDocVw.dll',
                      'Interop.MSXML2.dll',
                      'Microsoft.mshtml.dll',
                      'stdole.dll',
                      'GACMeUp.exe');

my @ieResourcePathList = ('en-US', 'ja');

#Need references to pass into the generate(Core|Download)Script functions
my $ieCoreRef = \@ieCoreFileList;
my $ieResourceRef = \@ieResourcePathList;

#Strings to insert into setup.nsi (only one of them will contain text depending
#on whether $ieFullInstall is defined or not)
my $coreScript = "";
my $downloadScript = "";

if ($ieFullInstall) {
    $coreScript = &generateCoreScript($ieCoreRef, $ieResourceRef);
}
else {
    $downloadScript = &generateDownloadScript($ieCoreRef, $ieResourceRef);
}

#String that contains list of JavaScript files (and the file list file) to bundle
#in the installer
my $jFileList = "";
my $listFilePath = "../base/chrome/libx/content/libx/";
my $listFileName = "filelist.txt";
my $listFile = $listFilePath . $listFileName;

$jFileList = &generateJavaScriptFileList($listFile);

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
		my $pname = $fname;
		if (substr($fname, 0, 1) ne '/') {
			$pname = '${EDITION_PATH}' . $fname;
		}
		else {
			$fname = substr($fname, rindex($fname, '/') + 1);
		}
		$eflist = $eflist . '   File "' . "$pname\"\n";
		$dlist = $dlist . '  Delete "'. "$dir$fname". "\"\n";
	}
}

#Replace the $editionfiles$ symbol with the string
$nsisText =~ s/\$editionfiles\$/$eflist/;
$nsisText =~ s/\$deleteeditionfiles\$/$dlist/;
$nsisText =~ s/\$localbuild\$/$localbuild/;
$nsisText =~ s/\$fullinstall\$/$coreScript/;
$nsisText =~ s/\$downloadinstall\$/$downloadScript/;
$nsisText =~ s/\$javascriptfiles\$/$jFileList/;

#Write the new file
open (NSIS, ">$editionpath" . "setup.nsi") || die "Could not upen $editionpath" . "setup.nsi for writing";
print NSIS $nsisText;
close (NSIS);

if (-x $makensis) {
    my $env = "-DJS_PATH=$tmpdir/chrome/libx/content/libx/";
    $env .= " -DDLL_PATH=$libxiedllpath/";
    $env .= " -DDLL_URL=$libxiedllurl";
    $env .= " -DLOCALE_PATH=$tmpdir/chrome/libx/locale/";
    $env .= " -DLOCALE=en-US";
    $env .= " -DEDITION_PATH=$editionpath";
    $env .= " -DEDITION_ID=$editionid";
    system ("$makensis $env -V1 -NOCD ${editionpath}setup.nsi") == 0 or die "$makensis $env failed.";
} else {
    print "$makensis not found, skipping IE build.\n";
}

system ("/bin/rm -rf $tmpdir");

exit 0;

sub usage {
    print STDERR "@_\n";
    print STDERR "xcreateextension.pl [-ie_full_installer] [-localbuild prefix] config_directory\n";
    print STDERR "\n";
    print STDERR " config_directory denotes the directory containing the files\n"
                ." for the revision (including config.xml and all bundled files).\n";
    print STDERR "\n";
    print STDERR " -localbuild     an alternate prefix, such as 'experimental-'\n";
    print STDERR "\n";
    print STDERR " -ie_full_installer    generate a version of setup.nsi that bundles all\n"; 
    print STDERR "                       necessary files\n";
    print STDERR "\n";
    exit 1;
}
