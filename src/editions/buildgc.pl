#!/usr/bin/perl -w

use strict;
use XML::LibXML;
use HTML::Entities;
use Cwd;

# directory from which files will be bootstrapped
my $bootstrap_url = "http://theta.cs.vt.edu/~rupen/libx2/src/base/bootstrapped/";
# default package url for editions that have none specified
my $default_package_url = "http://theta.cs.vt.edu/~rupen/feedga/analytics";

# directory to which built files are output
my $fs_base_dir = "/home/rupen/public_html/dev-releases/analytics/";
# URL at which build is accessible
my $publish_base_url = "http://theta.cs.vt.edu/~rupen/dev-releases/analytics";

# path to private key file
my $keypath = "/home/rupen/libxprivatekey/libx.pem";

# XXX fix this ridiculous dependency
-d "../base" || die "This script must be run inside libx/src/editions";

# Change this to build, say "libx2-experimental-<edition>.crx",
# If set to non-empty, will suppress creation of updates.xml file
my $localbuild = "rupen-analytics-";

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
    
    ## Unknown -args are fatal
    /^\-/ && (&usage("Unknown option: $_"));
}

# path to update directory
my $updatepath = $fs_base_dir . "gc";

-d $updatepath || &usage("directory $updatepath does not exist.");

#######################################################
my %conf = ();

$conf{'gaaccountid'} = 'UA-29381019-1'; 
$conf{'builddate'} = `date +%Y%m%d`;
chomp($conf{'builddate'});

my $crxname = "libx2-$localbuild$conf{builddate}";
my $crxfile = "";
my $dailyrev = 0;
while(-f $updatepath . "/" . ($crxfile = $crxname . ($dailyrev ? "-" . $dailyrev : "") . ".crx")) {
    $dailyrev++;
}

# use days since epoch for versioning due to chrome's strict versioning rules
$conf{'libxversion'} = "2.0." . int(time/86400) . "." . $dailyrev;
$conf{'emupdateURL'} = $publish_base_url . "gc/updates.xml";
$conf{'crxlocation'} = $publish_base_url . "gc/$crxfile";
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
    "$basedir/crxroot"   	=> "$tmpdir",
    "$basedir/core"      	=> "$tmpdir/core",
    "$basedir/dev"       	=> "$tmpdir/dev",
    "$basedir/popup"     	=> "$tmpdir/popup",
    "$basedir/locale"    	=> "$tmpdir/_locales",
    "$basedir/preferences"  => "$tmpdir/preferences",
    "$basedir/bootstrapped"	=> "$tmpdir/bootstrapped"
);

foreach my $key ( keys %filemap ) {
    my @files = split(/\s+/, `find $key`);
    foreach my $src ( @files ) {
        my $dst = $src;
        print "processing $src to $dst\n";
        $dst =~ s/$key/$filemap{$key}/;
        if (-d $src) {
            # recreate directory
            system("mkdir -p $dst") == 0 || die "$!: cannot mkdir $dst in " . `pwd` . " running as " . `id`;
        } else {
            &copyandreplace($src, $dst);
        }
    }
}

############################################################

my $keyarg = "";
if ($localbuild eq "") {
    $keyarg = "--pack-extension-key=$keypath";
}
system("cd $tmpdir; find . -name CVS -type d | xargs /bin/rm -fr ; " .
       "crxmake --pack-extension=. --extension-output=$updatepath/$crxfile $keyarg") == 0 || die "crxmake failed";
if ($localbuild eq "") {
    system("mv $tmpdir/updates.xml $updatepath/updates.xml") == 0 || die "could not move updates.xml";
}
system("chmod g+w $updatepath/$crxfile") == 0 || die "chmod g+w failed";

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
