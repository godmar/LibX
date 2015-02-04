
So, you've just checked out the LibX repository for the first time.
How to get started.

Read hints in SETUP.md to install necessary packages.

After cloning a fresh repository, some setup is required.

+ We must build the getlibx.js file, which is the
  compressed code of LibX for use in client-side web pages.
  To do this, run

    ./uglify.sh > getlibx.js

    (requires node installed).

    This will create 'getlibx.js', which is a compressed file with all LibX JavaScript code.
    It's only needed when running LibX through a website.


+ Cd into bootstrapped and run
    
    ./genhash.pl

    This should create a file updates.json there

+ Now visiting

    http://[your host]/[your libx base]/src/libappdisplay/index.php?pkg=http://libx.org/libx2/libapps/libxcore
    should work, like this one:
    http://theta.cs.vt.edu/~gback/libx/src/libappdisplay/index.php?pkg=http://libx.org/libx2/libapps/libxcore

+ Now change ../editions/readconfigxml.php ; change true to false and set libx2base.

  Now this should work:

    http://theta.cs.vt.edu/~gback/libx/src/editions/downloadlibx2.php?edition=vt

  or, respectively

    http://localhost/~abigail/libx/src/editions/downloadlibx2.php?edition=vt

+ Now you can test (most of) the base LibX without having LibX installed, straight from a webpage.
  We refer to this as 'client-side' mode, short 'cs' - if you see directories 'cs' in the code,
  those contain the platform-specific code for this. (ff - Firefox extension, gc - Chrome extension)
  Just remember that you must rerun uglify.sh every time since the above .php pages include the
  code from there.

  
