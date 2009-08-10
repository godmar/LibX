load("loadlibx.js");

libx.testing.createUnitTestSuite("libx.collections");
libx.testing.addUnitTest("libx.collections", libx.utils.collections.unittests, "Linked List");

libx.testing.createUnitTestSuite("libx.services");
libx.testing.addUnitTest("libx.services", libx.services.crossref.unittests, "getDOIMetadata");
libx.testing.addUnitTest("libx.services", libx.services.pubmed.unittests, "getPubmedMetadata");
libx.testing.addUnitTest("libx.services", libx.services.xisbn.unittests, "getIS{X}NMetadata");

// load some test functions that are separate from the libx core code


libx.testing.runAllUnitTests();
