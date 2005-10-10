#!/usr/bin/perl -w

my $edition = $ARGV[0];

if (!defined($edition) || ! -d $edition) {
    die "Usage: $0 edition\n";
}

my $copytargetdir = "/Library/WebServer/libx.org/editions";

my %conf = ();
open (H, "<$edition/config") || die ("Can't read $edition/config");
while (<H>) {
    next if (/^#/);
    chomp;
    my ($key, $value) = split(/=/, $_);
    $conf{$key} = $value;
    #print "...$key...=+++" . $conf{$key} . "\n";
}
close(H);

my $d = "tmp";
system("/bin/rm -rf $d");

my @files = split(/\s+/, `find ../base`);
foreach $src (@files) {
    my $dst = $src;
    $dst =~ s/..\/base/tmp/;
    #print "processing $src to $dst\n";
    if (-d $src) {
        # recreate directory
        system("mkdir $dst");
    } else {
        # copy files, replacing variables
        local (*FS);
        open (FS, "<$src") || die;
        my $srctext = do { local ($/); <FS> };
        close (FS);
        foreach $key (keys(%conf)) {
            $srctext =~ s/\$$key\$/$conf{$key}/g;
        }
        open (FD, ">$dst") || die;
        printf FD "%s", $srctext;
        close (FD);
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
    system("cp $edition/$file $d/$files{$file}");
}

my $xpifile = $conf{'xpilocation'};
$xpifile =~ s/.*\/([^\/]*)/$1/;
system("cp tmp/update.rdf $edition");
system("cd tmp; rm ../$edition/$xpifile; find . -name CVS -type dir | xargs /bin/rm -fr ; zip -r ../$edition/$xpifile ./chrome install.rdf changelog.txt");

my $livescript = "$edition/makelive.sh";
open (O, ">$livescript") || die ("Could not write to $livescript");
print O "#!/bin/sh\n";
print O "T=$copytargetdir/$edition\n";
print O "cp $xpifile \$T\n";
print O "cp update.rdf \$T\n";
print O "test -r libx.html && cp libx.html \$T\n";
close (O);
chmod 0755, "$livescript";


