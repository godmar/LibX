#!/usr/bin/perl -w

my $edition = $ARGV[0];

if (!defined($edition) || ! -d $edition) {
    die "Usage: $0 edition\n";
}

my $copytargetdir = "/Library/WebServer/libx.org/editions";

my %conf = ();

$conf{'builddate'} = `date +%Y%m%d`;
chomp($conf{'builddate'});

open (H, "<$edition/config") || die ("Can't read $edition/config");
while (<H>) {
    next if (/^#/ || /^\s*$/);
    chomp;
    my ($key, $value) = split(/=/, $_, 2);
    $conf{$key} = $value;
    #print "...$key...=+++" . $conf{$key} . "\n";
}
close(H);

sub copyandreplace {
    my ($src, $dst) = @_;

    # copy files, replacing variables
    #print "processing $src to $dst\n";
    local (*FS);
    open (FS, "<$src") || die;
    my $srctext = do { local ($/); <FS> };
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
    next if (/^#/);
    my ($fname, $destdir) = split(/\s+/, $_);
    $files{$fname} = $destdir;
    #print "...$fname...=+++" . $files{$fname} . "\n";
}
close(H);

foreach $file (keys(%files)) {
    #system("cp $edition/$file $d/$files{$file}");      don't just copy, replace
    &copyandreplace("$edition/$file", "$d/$files{$file}/$file");
}

my $xpifile = $conf{'xpilocation'};
$xpifile =~ s/.*\/([^\/]*)/$1/;
system("cp tmp/update.rdf $edition");
system("cd tmp; rm ../$edition/$xpifile; find . -name CVS -type dir | xargs /bin/rm -fr ; zip -r ../$edition/$xpifile ./chrome install.rdf changelog.txt");

my $livescript = "$edition/makelive.sh";
open (O, ">$livescript") || die ("Could not write to $livescript");
print O "#!/bin/sh\n";
print O "T=$copytargetdir/$edition\n";
print O "test -d \$T || (echo \"This works only on a machine where \$T exists\"; exit)\n";
print O "cp $xpifile \$T\n";
print O "cp update.rdf \$T\n";
print O "test -r libx.html && cp libx.html \$T\n";
close (O);
chmod 0755, "$livescript";


