#!/usr/bin/perl -w

print <<EOF;

As of 7/10/2007, this script is no longer being maintained.
All config files hosted on libx.org have been converted, and subsequent
changes will not be retroactively be added to the config files.

See http://libx.org/editionbuilder for our edition builder that allows
anybody to make and maintain an edition.

EOF
exit 1;

#
# This scripts converts a config file to an XML file
#

use strict;
use XML::LibXML;

my $dtd_url = "http://libx.org/xml/libxconfig.dtd";
my $installdir = "/home/www/libx.org/editions";

my $edition = $ARGV[0];
my %config = ();
open (F, "<$edition/config") || die "can't open $edition/config";
while (<F>) {
    chomp;
    next if (/^\s*$/ || /^#.*$/);       # skip empty lines & comments
    $config{$1} = $2 if (/^([^=]+)=([^\r\n]*)\s*$/);
}
close (F);

my %oai = ();
open (OAILIST, "<oaitobaseurl.txt") || die "cannot open oaitobaseurl.txt: $!";
while (<OAILIST>) {
    chomp;
    my @line = split (/\t/);
    $oai{$line[0]} = $line[2];
}
close (OAILIST);

my $doc = XML::LibXML::Document->new();
my $root = $doc->createElement('edition');

#
# The property, if defined, is in XML.
#
sub addproperty() {
    my ($node, $ckey, $xmlkey) = @_;
    $node->setAttribute($xmlkey, $ckey) if (defined($ckey));
}

sub addpropertyEntities() {
    my ($node, $ckey, $xmlkey) = @_;
    if (defined($ckey)) {
        my $parser = XML::LibXML->new();
        my $fakedoc = $parser->parse_string('<root ' . $xmlkey . '="' . $ckey . '" />');
        my $fakeroot = $fakedoc->getDocumentElement;
        my $fakeattr = $fakeroot->getAttributeNode($xmlkey);
        $fakeroot->removeAttributeNode($fakeattr);
        $node->setAttributeNode($fakeattr);
    }
}

$doc->setDocumentElement($root);
my $tedition = $edition;
$tedition =~ s/\.\d+//;
$root->setAttribute('id', $tedition);
if (defined($config{'libxversion'})) {
    $root->setAttribute('version', $config{'libxversion'});
} else {
    $root->setAttribute('version', "1.1");
}

my $afiles = $doc->createElement('additionalfiles');

my $dtd = $doc->createInternalSubset("edition", undef, $dtd_url);

#emnameshort=LibX VT

my $e = $doc->createElement('name');
&addpropertyEntities($e, $config{'emnameshort'}, 'short');
&addpropertyEntities($e, $config{'emname'}, 'long');
&addpropertyEntities($e, $config{'libxedition'}, 'edition');
&addpropertyEntities($e, $config{'emdescription'}, 'description');

#$adaptedby=
my $adaptedby = $config{'$adaptedby'};
&addpropertyEntities($e, $adaptedby, 'adaptedby') if (defined($adaptedby) && $adaptedby ne "");
$root->appendChild($e);

#$link1.label=VT University Libraries
#$link1.url=http://www.lib.vt.edu/
my $links = $doc->createElement('links');
$root->appendChild($links);
for (my $i = 1; ; $i++) {
    my $label = '$link' . $i . '.label';
    last if (!defined($config{$label}));
    $e = $doc->createElement('url');
    &addpropertyEntities($e, $config{$label}, 'label');
    my $url = '$link' . $i . '.url';
    &addproperty($e, $config{$url}, 'href') if defined($config{$url});
    $links->appendChild($e);
}

my $catalogs = $doc->createElement('catalogs');
$root->appendChild($catalogs);

sub addfile() {
    my ($url, $regexp, $targetdir) = @_;
    if (defined($url) && $url =~ /$regexp/) {
        my $f = $doc->createElement('file');
        $f->setAttribute('name', $1);
        $f->setAttribute('directory', $targetdir);
        $afiles->appendChild($f);
    }
}
&addfile('config.xml', "(.*)", 'chrome/libx/content/libx');
&addfile('defaultprefs.xml', "(.*)", 'chrome/libx/content/libx');

sub addimagefile() {
    my ($url) = @_;
    if (defined($url)) {
        &addfile($url, "chrome:\/\/libx\/skin\/(.*)", 'chrome/libx/skin/libx');
    }
}

sub addoption() {
    my ($e, $ckey, $xmlkey) = @_;
    return if (!defined($ckey));
    my $t = $doc->createElement('option');
    &addproperty($t, $xmlkey, 'key');
    &addproperty($t, $ckey, 'value');
    $e->appendChild($t);
}

my $catprefix = "";
my $c = 1;
while (1) {
    #$catalog.type=millenium
    my $ctype = $config{'$' . $catprefix . 'catalog.type'};
    last if (!defined($ctype));
    my $e = $doc->createElement($ctype);

    &addpropertyEntities($e, $config{'$' . $catprefix . 'catalog.name'}, 'name');
    &addproperty($e, $config{'$' . $catprefix . 'catalog.url'}, 'url');
    # if not given, add correct default options.
    if ($ctype eq "sfx" || $ctype eq "sersol") {
        &addproperty($e, "jt;i", 'options');
    } elsif ($ctype ne "bookmarklet" && $ctype ne "centralsearch") {
        &addproperty($e, "Y;t;a;d;i;c", 'options');
    }
    # replace override default options if options are given.
    &addproperty($e, $config{'$' . $catprefix . 'catalog.options'}, 'options');
    &addproperty($e, $config{'$' . $catprefix . 'catalog.urlregexp'}, 'urlregexp');
    &addproperty($e, $config{'$' . $catprefix . 'catalog.sid'}, 'sid');
    &addproperty($e, $config{'$' . $catprefix . 'catalog.searchscope'}, 'searchscope');
    &addproperty($e, $config{'$' . $catprefix . 'millenium.keywordcode'}, 'keywordcode');
    &addproperty($e, $config{'$' . $catprefix . 'millenium.journaltitlecode'}, 'journaltitlecode');
    &addproperty($e, $config{'$' . $catprefix . 'millenium.searchform'}, 'searchform');
    &addproperty($e, $config{'$' . $catprefix . 'millenium.sort'}, 'sort');
    &addproperty($e, $config{'$' . $catprefix . 'millenium.advancedcode'}, 'advancedcode');

    &addproperty($e, $config{'$' . $catprefix . 'aleph.localbase'}, 'localbase');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.title'}, 'title');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.journaltitle'}, 'journaltitle');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.author'}, 'author');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.keyword'}, 'keyword');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.subject'}, 'subject');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.issn'}, 'issn');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.isbn'}, 'isbn');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.callno'}, 'callno');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.findfunc'}, 'findfunc');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.scanfunc'}, 'scanfunc');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.advfindfunc'}, 'advfindfunc');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.scan.index.list'}, 'scanindexlist');

    &addproperty($e, $config{'$' . $catprefix . 'horizon.isbn'}, 'isbn');
    &addproperty($e, $config{'$' . $catprefix . 'horizon.issn'}, 'issn');
    &addproperty($e, $config{'$' . $catprefix . 'horizon.callno'}, 'callno');
    &addproperty($e, $config{'$' . $catprefix . 'horizon.author'}, 'author');
    &addproperty($e, $config{'$' . $catprefix . 'horizon.keyword'}, 'keyword');
    &addproperty($e, $config{'$' . $catprefix . 'horizon.subject'}, 'subject');
    &addproperty($e, $config{'$' . $catprefix . 'horizon.title'}, 'title');
    &addproperty($e, $config{'$' . $catprefix . 'horizon.journaltitle'}, 'journaltitle');
    &addproperty($e, $config{'$' . $catprefix . 'horizon.profile'}, 'profile');

    &addproperty($e, $config{'$' . $catprefix . 'sirsi.sort'}, 'sort');
    &addproperty($e, $config{'$' . $catprefix . 'sirsi.path'}, 'path');
    &addproperty($e, $config{'$' . $catprefix . 'sirsi.searchscope'}, 'searchscope');

    &addproperty($e, $config{'$' . $catprefix . 'voyager.advancedsearchforissn'}, 'advancedsearchforissn');
    &addproperty($e, $config{'$' . $catprefix . 'voyager.keyword'}, 'keyword');
    &addproperty($e, $config{'$' . $catprefix . 'voyager.count'}, 'count');
    &addproperty($e, $config{'$' . $catprefix . 'voyager.relevanceranking'}, 'relevanceranking');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.searchBy'}, 'searchby');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.ssLibHash'}, 'sslibhash');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.catIDs'}, 'catids');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.catGroupIDs'}, 'catgroupids');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.dbIDList'}, 'dbidlist');

    #$cues.use.xisbn=true
    my $xisbn = $doc->createElement('xisbn');
    if (defined($config{'$' . $catprefix . 'cues.use.xisbn'})) {
        &addproperty($xisbn, $config{'$' . $catprefix . 'cues.use.xisbn'}, 'cues');
    }

    #$catalog.xisbn.oai=oai:bookmarks.oclc.org:library.mit.edu
    my $xisbnoai = $config{'$' . $catprefix . 'catalog.xisbn.oai'};
    if (defined ($xisbnoai)) {
        my $res_id = $oai{$xisbnoai};
        if (!defined($res_id)) {
            print STDERR "OAI: " . $xisbnoai . " not found\n.";
        }
        &addproperty($xisbn, $res_id, 'res_id');
    }

    #$catalog.xisbn.opacid=aleph4
    &addproperty($xisbn, $config{'$' . $catprefix . 'catalog.xisbn.opacid'}, 'opacid');

    if ($xisbn->getAttributes() > 0) {
        $e->appendChild($xisbn);
    }
    $catalogs->appendChild($e);
    $catprefix = 'catalog' . $c++ . '.';
}

#openurltype=sersol
my $oresolvers = $doc->createElement('openurl');
$root->appendChild($oresolvers);
my $otype = $config{'$openurl.type'};
if ($otype) {
    my $openurl = $doc->createElement('resolver');
    &addproperty($openurl, $otype, 'type');
    &addproperty($openurl, $config{'$openurl.url'}, 'url');
    &addproperty($openurl, $config{'$openurl.sid'}, 'sid');
    &addproperty($openurl, $config{'$openurl.xrefsid'}, 'xrefsid');
    &addproperty($openurl, $config{'$openurl.pmidsid'}, 'pmidsid');
    &addpropertyEntities($openurl, $config{'$openurl.name'}, 'name');
    &addproperty($openurl, $config{'$openurl.image'}, 'image');
    &addimagefile($openurl->getAttribute('image'));
    &addproperty($openurl, $config{'$openurl.version'}, 'version');

    my $dontshowintoolbar = $config{'$openurl.dontshowintoolbar'};
    if (!defined($dontshowintoolbar) || $dontshowintoolbar eq 'false') {
        my $e = $doc->createElement("openurlresolver");
        &addpropertyEntities($e, $config{'$openurl.name'}, 'name');
        &addpropertyEntities($e, $config{'$openurl.searchlabel'}, 'name');
        &addproperty($e, 'jt;i', 'options');
        &addproperty($e, $config{'$openurl.options'}, 'options');
        &addproperty($e, '0', 'resolvernum' );
        $catalogs->appendChild($e);
    }
    &addproperty($openurl, $config{'$openurl.autolinkissn'}, 'autolinkissn');
    $oresolvers->appendChild($openurl);
}

#
# if scholar is not disabled, add a catalog entry for it.
#
my $disablescholar = $config{'$libx.disablescholar'};
if (!defined($disablescholar) || $disablescholar ne 'true') {
    my $e = $doc->createElement("scholar");
    # Google told us to use this label and no other for trademark reasons
    &addproperty($e, 'Google Scholar', 'name');
    # add addproperty calls for other properties here as needed...
    &addproperty($e, 'http://scholar.google.com', 'url' );
    &addproperty($e, 'Y;at;jt;a', 'options' );

    $catalogs->appendChild($e);
}

my $proxies = $doc->createElement('proxy');
$root->appendChild($proxies);
#proxytype=ezproxy
my $ptype = $config{'$proxy.type'};
if ($ptype) {
    my $proxy = $doc->createElement($ptype);
    #proxyurl=http://ezproxy.lib.vt.edu:8080/login?url=%S
    &addproperty($proxy, $config{'$proxy.url'}, 'url');
    #proxyname=EZProxy
    &addproperty($proxy, $config{'$proxy.name'}, 'name');
    &addproperty($proxy, $config{'$proxy.urlcheckpassword'}, 'urlcheckpassword');
    $proxies->appendChild($proxy);
}

my $options = $doc->createElement('options');
$root->appendChild($options);
&addoption($options, $config{'$libx.rewritescholarpage'}, 'rewritescholarpage');
&addoption($options, $config{'$libx.supportcoins'}, 'supportcoins');
&addoption($options, $config{'$libx.sersolisbnfix'}, 'sersolisbnfix');
&addoption($options, $config{'$libx.autolink'}, 'autolink');
&addoption($options, $config{'$libx.autolinkstyle'}, 'autolinkstyle');
# we no longer keep this as an option - see above.
# &addoption($options, $config{'$libx.disablescholar'}, 'disablescholar');
&addoption($options, $config{'$suppress.scholar.display'}, 'suppressscholardisplay');
&addoption($options, $config{'$scholarmiss.url'}, 'scholarmissurl');
&addoption($options, $config{'$send.origdata.withopenurl'}, 'sendorigdatawithopenurl');

my $soptions = $doc->createElement('searchoptions');
for (my $i = 1; ; $i++) {
    my $oval = '$libx.searchoption' . $i . '.value';
    my $olab = '$libx.searchoption' . $i . '.label';
    last if (!defined($config{$oval}));
    $e = $doc->createElement('searchoption');
    &addproperty($e, $config{$oval}, 'value');
    &addpropertyEntities($e, $config{$olab}, 'label');
    $soptions->appendChild($e);
}
$root->appendChild($soptions);

$root->appendChild($afiles);

#emiconURL=chrome://libx/skin/virginiatech.ico
my $icon = $config{'emiconURL'};
# do not basename
# $icon =~ s/.*\/([^\/]*)$/$1/;
&addoption($options, $icon, 'icon');
&addimagefile($icon);

#logoURL=chrome://libx/skin/shield50.gif
my $logo = $config{'logoURL'};
# do not basename
# $logo =~ s/.*\/([^\/]*)$/$1/ if ($logo =~ /chrome:/);
&addoption($options, $logo, 'logo');
&addimagefile($logo);

# check those for consistency
#emhomepageURL=http://www.libx.org/editions/vt/libx.html
#emupdateURL=http://www.libx.org/editions/vt/update.rdf
#xpilocation=http://www.libx.org/editions/vt/libx-vt.xpi

# finally, output
print $doc->toString(1);        # 1 means format

# libxxml examples
#   my $text = XML::LibXML::Text->new("whatever");
