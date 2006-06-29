#!/usr/bin/perl -w

my $edition = $ARGV[0];

if (!defined($edition) || ! -d $edition) {
    die "Usage: $0 edition\n";
}

my $copytargetdir = "/home/www/libx.org/editions";

my %conf = ();

$conf{'builddate'} = `date +%Y%m%d`;
chomp($conf{'builddate'});

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
        $conf{$key} = $value;
    }
    #print "...$key...=+++" . $conf{$key} . "\n";
}
close(H);
$conf{'additionalproperties'} = $addprop;

sub copyandreplace {
    my ($src, $dst) = @_;

    # copy files, replacing variables
    #print "processing $src to $dst\n";
    local (*FS);
    open (FS, "<$src") || die "Could not open $src for reading";
    my $srctext = do { local ($/); <FS> };      # slurp
    close (FS);
    foreach $key (keys(%conf)) {
        $srctext =~ s/\$$key\$/$conf{$key}/g;
    }
    open (FD, ">$dst") || die "Can't open $dst for writing";
    printf FD "%s", $srctext;
    close (FD);
}

my $d = "tmp";
system("/bin/rm -rf $d");

my @files = split(/\s+/, `find ../base`);
foreach $src (@files) {
    my $dst = $src;
    $dst =~ s/..\/base/tmp/;
    if (-d $src) {
        # recreate directory
        system("mkdir $dst");
    } else {
        &copyandreplace($src, $dst);
    }
}

my %files = ();
open (H, "<$edition/files") || die ("Can't read $edition/files");
while (<H>) {
    next if (/^#/ || /^\s*$/);
    chop if (/\r$/);
    my ($fname, $destdir) = split(/\s+/, $_);
    $files{$fname} = $destdir;
    #print "...$fname...=+++" . $files{$fname} . "\n";
}
close(H);

foreach $file (keys(%files)) {
    #system("cp $edition/$file $d/$files{$file}");      don't just copy, replace
    &copyandreplace("$edition/$file", "$d/$files{$file}/$file");
}

my $addtoplevelfiles = "install.rdf changelog.txt chrome.manifest";
my $xpifile = $conf{'xpilocation'};
$xpifile =~ s/.*\/([^\/]*)/$1/;         # basename
system("cp tmp/update.rdf $edition");
system("cd tmp; rm ../$edition/$xpifile; find . -name CVS -type d | xargs /bin/rm -fr ; zip -r ../$edition/$xpifile ./chrome " . $addtoplevelfiles);

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


