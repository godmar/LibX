#!/usr/bin/perl -w

use JSON;

#my @files = `find -type f ! -regex '.*/CVS/.*' | xargs sha1sum`;
my @files = `find -type f ! -regex '.*/CVS/.*'`;

my %filemap = ( 'files' => {} );
foreach my $file ( @files ) {
    $file =~ m/^(\.\/)?(.*)\s+/;
    $file = $2;
    my $hash = `sha1sum $file`;
    $hash =~ m/^(.*?)\s+/;
    if ($file ne "genhash.pl" && $file ne "updates.json" && $file ne ".htaccess") {
       $filemap{"files"}{$file}{'hash'} = $1;
    }
}

print JSON::to_json(\%filemap);
