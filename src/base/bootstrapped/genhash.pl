#!/usr/bin/perl -w

use JSON;

my @files = `find -type f ! -regex '.*/CVS/.*' | xargs sha1sum`;

my %filemap = ( 'files' => {} );
foreach my $file ( @files ) {
    $file =~ m/^(.*?)\s+\*\.\/(.*?)$/;
    if ($2 ne "hashes.json" && $2 ne ".htaccess") {
       $filemap{"files"}{$2}{'hash'} = $1;
    }
}

print JSON::to_json(\%filemap);
