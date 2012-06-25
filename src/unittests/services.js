load("../base/bootstrapped/global/shared/services/xisbn.js");
// test LibX services
libx.services.crossref.unittests(libx.log);
libx.services.xisbn.unittests(libx.log);
libx.services.pubmed.unittests(libx.log);

libx.log.write("waiting 4 sec for services tests to complete\n");
java.lang.Thread.sleep(4000);

