// test LibX services
libx.services.crossref.unittests(logger);
libx.services.xisbn.unittests(logger);
libx.services.pubmed.unittests(logger);

logger.write("waiting 4 sec for services tests to complete\n");
java.lang.Thread.sleep(2000);

