#!/usr/bin/perl -w

use JSON;
use File::Basename;

chdir dirname($0);
my @files = `find -type f ! -regex '.*/CVS/.*' ! -name .htaccess ! -name updates.json ! -name genhash.pl ! -name .cvsignore ! -name README`;

my %filemap = ( 'files' => {} );
foreach my $file ( @files ) {
    $file =~ m/^(\.\/)?(.*)\s+/;
    $file = $2;
    my $hash;
    (-B $file && ($hash = `base64 -w0 $file | sha1sum`)) || ($hash = `sha1sum $file`);
    $hash =~ m/^(.*?)\s+/;
    $filemap{"files"}{$file}{'hash'} = $1;
}

open(MYFILE, '>updates.json');
print MYFILE JSON::to_json(\%filemap);
close(MYFILE);
