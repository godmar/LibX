#!/usr/bin/perl -w

use JSON;

use File::Spec::Functions qw(rel2abs);
use File::Basename;
my $curdir = dirname(rel2abs($0));

my @files = `find $curdir -type f -regex '.*/hash_.*'`;

my %filemap = ( 'files' => {} );
foreach my $file ( @files ) {
    $file =~ m/^$curdir\/(.*)\s+/;
    my $hash = `sha1sum $file`;
    $file = $1;
    $hash =~ m/^(.*?)\s+/;
    if ($file ne "genhash.pl" && $file ne "updates.json" && $file ne ".htaccess") {
       $filemap{"files"}{$file}{'hash'} = $1;
    }
}

open(UPDATES, ">$curdir/updates.json");
print UPDATES JSON::to_json(\%filemap) . "\n";
close(UPDATES);
