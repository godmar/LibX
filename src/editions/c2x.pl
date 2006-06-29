#!/usr/bin/perl -w
#
# This scripts converts a config file to an XML file
#

use strict;
use XML::LibXML;

my $dtd_url = "http://libx.org/xml/libxconfig.dtd";

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

my $dtd = $doc->createInternalSubset("edition", undef, $dtd_url);

#libxedition=Virginia Tech Edition
#emname=LibX Virginia Tech
my $inst1 = $config{'libxedition'};
$inst1 =~ s/ Edition$//;
my $inst2 = $config{'emname'};
$inst2 =~ s/^LibX //;
if ($inst1 ne $inst2) {
    print STDERR "warning: inconsistent libxedition/emname: " . $inst1 . "/" . $inst2 . "\n";
}

#emnameshort=LibX VT
my $emnameshort = $config{'emnameshort'};
my $institution = $inst2;

my $e = $doc->createElement('name');
$e->setAttribute('short', $emnameshort);
$e->setAttribute('institution', $institution);

#$adaptedby=
my $adaptedby = $config{'$adaptedby'};
$e->setAttribute('adaptedby', $adaptedby) if (defined($adaptedby) && $adaptedby ne "");
$root->appendChild($e);

#$link1.label=VT University Libraries
#$link1.url=http://www.lib.vt.edu/
my $links = $doc->createElement('links');
$root->appendChild($links);
for (my $i = 1; ; $i++) {
    my $url = '$link' . $i . '.url';
    last if (!defined($config{$url}));
    $e = $doc->createElement('url');
    $e->setAttribute('href', $config{$url});
    $e->setAttribute('label', $config{'$link' . $i . '.label'});
    $links->appendChild($e);
}

my $catalogs = $doc->createElement('catalogs');
$root->appendChild($catalogs);

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
    &addproperty($e, $config{'$' . $catprefix . 'millenium.searchform'}, 'searchform');
    &addproperty($e, $config{'$' . $catprefix . 'millenium.sort'}, 'sort');
    &addproperty($e, $config{'$' . $catprefix . 'millenium.advancedcode'}, 'advancedcode');

    &addproperty($e, $config{'$' . $catprefix . 'aleph.localbase'}, 'localbase');
    &addproperty($e, $config{'$' . $catprefix . 'aleph.title'}, 'title');
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

    &addproperty($e, $config{'$' . $catprefix . 'voyager.advancedsearchforissn'}, 'advancedsearchforissn');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.searchBy'}, 'searchby');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.ssLibHash'}, 'sslibhash');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.catIDs'}, 'catids');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.catGroupIDs'}, 'catgroupids');
    &addproperty($e, $config{'$' . $catprefix . 'centralsearch.dbIDList'}, 'dbidlist');

    $catalogs->appendChild($e);
    $catprefix = 'catalog' . $c++ . '.';
}

#$cues.use.xisbn=true
my $xisbn = $doc->createElement('xisbn');
if (defined($config{'$cues.use.xisbn'})) {
    &addproperty($xisbn, $config{'$cues.use.xisbn'}, 'cues');
}

#$catalog.xisbn.oai=oai:bookmarks.oclc.org:library.mit.edu
&addproperty($xisbn, $config{'$catalog.xisbn.oai'}, 'oai');

#$catalog.xisbn.opacid=aleph4
&addproperty($xisbn, $config{'$catalog.xisbn.opacid'}, 'opacid');

$root->appendChild($xisbn);

#openurltype=sersol
my $oresolvers = $doc->createElement('openurl');
$root->appendChild($oresolvers);
my $otype = $config{'$openurl.type'};
if ($otype) {
    my $openurl = $doc->createElement('resolver');
    &addproperty($openurl, $otype, 'type');
    &addproperty($openurl, $config{'$openurl.url'}, 'url');
    &addproperty($openurl, $config{'$openurl.sid'}, 'sid');
    &addproperty($openurl, $config{'$openurl.name'}, 'name');
    &addproperty($openurl, $config{'$openurl.image'}, 'image');
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
&addoption($options, $config{'$libx.rewritescholarpage'}, 'rewritescholar');
&addoption($options, $config{'$libx.supportcoins'}, 'supportcoins');
&addoption($options, $config{'$libx.sersolisbnfix'}, 'sersolisbnfix');
&addoption($options, $config{'$libx.autolink'}, 'autolink');
&addoption($options, $config{'$libx.disablescholar'}, 'disablescholar');
&addoption($options, $config{'$dumb.scholar.button'}, 'dumb.scholar.button'); 
&addoption($options, $config{'$suppress.scholar.display'}, 'suppress.scholar.display');
&addoption($options, $config{'$scholarmiss.url'}, 'scholarmiss.url');
&addoption($options, $config{'$send.origdata.withopenurl'}, 'send.origdata.withopenurl');

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

#emiconURL=chrome://libx/skin/virginiatech.ico
my $icon = $config{'emiconURL'};
# do not basename
# $icon =~ s/.*\/([^\/]*)$/$1/;
&addoption($options, $icon, 'icon');

#logoURL=chrome://libx/skin/shield50.gif
my $logo = $config{'logoURL'};
# do not basename
# $logo =~ s/.*\/([^\/]*)$/$1/ if ($logo =~ /chrome:/);
&addoption($options, $logo, 'logo');

#emdescription=Toolbar for Virginia Tech library users
my $emdescription = $config{'emdescription'};
if ($emdescription !~ /Toolbar for $institution Library users/i) {
    print STDERR "warning: inconsistent $emdescription\n" 
}

# check those for consistency
#emhomepageURL=http://www.libx.org/editions/vt/libx.html
#emupdateURL=http://www.libx.org/editions/vt/update.rdf
#xpilocation=http://www.libx.org/editions/vt/libx-vt.xpi

# finally, output
print $doc->toString(1);        # 1 means format

# libxxml examples
#   my $text = XML::LibXML::Text->new("whatever");
