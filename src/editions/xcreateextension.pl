#!/usr/bin/perl -w

use strict;
use XML::LibXML;
use HTML::Entities;
use Cwd;

# directory from which files will be bootstrapped
my $bootstrap_url = "http://libx.org/libx2/bootstrapped/";
# default package url for editions that have none specified
my $default_package_url = "http://libx.org/libx2/libapps/libxcore";

# directory to which built files are output
my $fs_base_dir = "/home/www/libx.org/releases/";
# URL at which build is accessible
my $publish_base_url = "http://libx.org/releases/";

my $addtoplevelfiles = "install.rdf changelog.txt chrome.manifest";

# directory that contains key3.db
my $keydirectory = "/home/www/libxprivatekey";
my $libxextid = "urn:mozilla:extension:{d75de36c-af0d-4dc2-b63a-0d482d4b9815}";

# from http://hyperstruct.net/projects/spock
my $spockexe = `/usr/bin/which spock 2>/dev/null` || "/opt/spock/spock";
chomp ($spockexe);

# XXX fix this ridiculous dependency
-d "../base" || die "This script must be run inside libx/src/editions";

# Change this to build, say "libx2-experimental-<edition>.xpi",
# If set to non-empty, will suppress creation of update.rdf file
my $localbuild = "";

my $docinputdir = undef;

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
    
    # Generate and package documentation
    if ( /^-doc$/ ) {
        ($#ARGV >= 0) || &usage("-doc requires directory to specify location of documentation");
        $docinputdir= shift @ARGV;
        next;
    }
    
    ## Unknown -args are fatal
    /^\-/ && (&usage("Unknown option: $_"));
}

# path to update directory
my $updatepath = $fs_base_dir . "ff";

-d $updatepath || &usage("directory $updatepath does not exist.");

#######################################################
my %conf = ();

$conf{'builddate'} = `date +%Y%m%d`;
chomp($conf{'builddate'});

my $xpiname = "libx2-$localbuild$conf{builddate}";
my $xpifile = "";
my $dailyrev = 0;
while(-f $updatepath . "/" . ($xpifile = $xpiname . ($dailyrev ? "-" . $dailyrev : "") . ".xpi")) {
    $dailyrev++;
}

$conf{'maxversion'} = "7.0.*";
# use days since epoch for versioning due to chrome's strict versioning rules
$conf{'libxversion'} = "2.0." . int(time/86400) . "." . $dailyrev;
$conf{'emupdateURL'} = $publish_base_url . "ff/update.rdf";
$conf{'xpilocation'} = $publish_base_url . "ff/$xpifile";
$conf{'bootstrapURL'} = $bootstrap_url;
$conf{'defaultpkgURL'} = $default_package_url;
$conf{'libxicon'} = "libx2-16.png";
#######################################################

#
# Copy file $src to $dst directory, replacing all occurrences
# of $xxx$ with $conf{'xxx'}.
#
sub copyandreplace 
{
    my ($src, $dst) = @_;

    # copy files, replacing variables
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

my $basedir = "../base";

my %filemap = (
    "$basedir/xpiroot"   => "$tmpdir",
    "$basedir/core"      => "$tmpdir/chrome/libx/content/libx/core",
    "$basedir/dev"       => "$tmpdir/chrome/libx/content/libx/dev",
    "$basedir/popup"     => "$tmpdir/chrome/libx/content/libx/popup",
    "$basedir/locale"    => "$tmpdir/chrome/libx/locale",
    "$basedir/preferences"=>"$tmpdir/chrome/libx/content/libx/preferences"
);

foreach my $key ( keys %filemap ) {
    my @files = split(/\s+/, `find $key`);
    foreach my $src ( @files ) {
        my $dst = $src;
        $dst =~ s/$key/$filemap{$key}/;
        if (-d $src) {
            # recreate directory
            system("mkdir -p $dst") == 0 || die "$!: cannot mkdir $dst in " . `pwd` . " running as " . `id`;
        } else {
            &copyandreplace($src, $dst);
        }
    }
}

if (defined($docinputdir)) {
    # cmd below assumes that $tmpdir is a relative path
    system ( "(CWD=`pwd`; cd $docinputdir; zip -r \$CWD/$tmpdir/documentation.jar .)" ) == 0 || die "copy of documentation failed";
    $addtoplevelfiles .= " documentation.jar";
}

system("cd $tmpdir; " .
       "find . -name CVS -type d | xargs /bin/rm -fr ; " .
       "zip -r $updatepath/$xpifile ./chrome ./components " . $addtoplevelfiles) == 0 || die "zip failed";

system("chmod g+w $updatepath/$xpifile") == 0 || die "chmod g+w failed";

############################################################

# add hash to and sign update.rdf
if ($localbuild eq "") {
    -x $spockexe || die "$spockexe does not exist or is not executable.";
    system("$spockexe -d $keydirectory -i \"$libxextid\" -f $updatepath/$xpifile"
        . " $tmpdir/update.rdf > $updatepath/update.rdf") == 0
        || die "could not run spock to sign update.rdf: $!";
}

system ("/bin/rm -rf $tmpdir");

exit 0;

sub usage {
    print STDERR "@_\n";
    print STDERR "xcreateextension.pl [-localbuild prefix]\n";
    print STDERR "\n";
    print STDERR " -localbuild     an alternate prefix, such as 'experimental-'\n";
    print STDERR "\n";
    print STDERR "\n";
    exit 1;
}
