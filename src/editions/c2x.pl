#!/usr/bin/perl -w
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

my $doc = XML::LibXML::Document->new();
my $root = $doc->createElement('edition');
$doc->setDocumentElement($root);
$root->setAttribute('id', $edition);
if (defined($config{'libxversion'})) {
    $root->setAttribute('version', $config{'libxversion'});
} else {
    $root->setAttribute('version', "1.1");
}

my $afiles = $doc->createElement('additionalfiles');

my $dtd = $doc->createInternalSubset("edition", undef, $dtd_url);

#emnameshort=LibX VT
my $emnameshort = $config{'emnameshort'};

my $e = $doc->createElement('name');
$e->setAttribute('short', $config{'emnameshort'});
$e->setAttribute('long', $config{'emname'});
$e->setAttribute('edition', $config{'libxedition'});
$e->setAttribute('description', $config{'emdescription'});

# find redirect target in edition live page and add as "localhomepage"
# attribute
if (open (HTACC, "<" . $installdir . "/" . $edition . "/.htaccess")) {
    while (<HTACC>) {
        # Redirect /editions/vt/libx.html http://www.lib.vt.edu/services/libX/libX.php
        if (/^Redirect\s+\/editions\/$edition\/libx.html\s+(.*)$/) {
            $e->setAttribute('localhomepage', $1);
            last;
        }
    }
    close (HTACC);
}
#####

#$adaptedby=
my $adaptedby = $config{'$adaptedby'};
$e->setAttribute('adaptedby', $adaptedby) if (defined($adaptedby) && $adaptedby ne "");
$root->appendChild($e);

#$link1.label=VT University Libraries
#$link1.url=http://www.lib.vt.edu/
my $links = $doc->createElement('links');
$root->appendChild($links);
for (my $i = 1; ; $i++) {
    my $label = '$link' . $i . '.label';
    last if (!defined($config{$label}));
    $e = $doc->createElement('url');
    $e->setAttribute('label', $config{$label});
    my $url = '$link' . $i . '.url';
    $e->setAttribute('href', $config{$url}) if defined($config{$url});
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

sub addimagefile() {
    my ($url) = @_;
    if (defined($url)) {
        &addfile($url, "chrome:\/\/libx\/skin\/(.*)", 'chrome/libx/skin/libx');
    }
}

sub addproperty() {
    my ($e, $ckey, $xmlkey) = @_;
    $e->setAttribute($xmlkey, $ckey) if (defined($ckey));
}

sub addoption() {
    my ($e, $ckey, $xmlkey) = @_;
    return if (!defined($ckey));
    my $t = $doc->createElement('option');
    $t->setAttribute('key', $xmlkey);
    $t->setAttribute('value', $ckey);
    $e->appendChild($t);
}

my $catprefix = "";
my $c = 1;
while (1) {
    #$catalog.type=millenium
    my $ctype = $config{'$' . $catprefix . 'catalog.type'};
    last if (!defined($ctype));
    my $e = $doc->createElement($ctype);

    &addproperty($e, $config{'$' . $catprefix . 'catalog.name'}, 'name');
    &addproperty($e, $config{'$' . $catprefix . 'catalog.url'}, 'url');
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

    &addproperty($e, $config{'$' . $catprefix . 'sirsi.sort'}, 'sort');

    &addproperty($e, $config{'$' . $catprefix . 'voyager.advancedsearchforissn'}, 'advancedsearchforissn');
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
    &addproperty($xisbn, $config{'$' . $catprefix . 'catalog.xisbn.oai'}, 'oai');

    #$catalog.xisbn.opacid=aleph4
    &addproperty($xisbn, $config{'$' . $catprefix . 'catalog.xisbn.opacid'}, 'opacid');

    if ($xisbn->getAttributes() > 0) {
        $e->appendChild($xisbn);
    }
    $catalogs->appendChild($e);
    $catprefix = 'catalog' . $c++ . '.';
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

    $catalogs->appendChild($e);
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
    &addproperty($openurl, $config{'$openurl.name'}, 'name');
    &addproperty($openurl, $config{'$openurl.image'}, 'image');
    &addimagefile($openurl->getAttribute('image'));
    &addproperty($openurl, $config{'$openurl.version'}, 'version');
    &addproperty($openurl, $config{'$openurl.searchlabel'}, 'searchlabel');
    &addproperty($openurl, $config{'$openurl.dontshowintoolbar'}, 'dontshowintoolbar');
    &addproperty($openurl, $config{'$openurl.options'}, 'options');
    &addproperty($openurl, $config{'$openurl.autolinkissn'}, 'autolinkissn');
    $oresolvers->appendChild($openurl);
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
    &addproperty($e, $config{$olab}, 'label');
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
