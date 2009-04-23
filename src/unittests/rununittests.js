// load the jsunit framework libraries
load("jsunit/lib/JsUtil.js");
JsUtil.prototype.include("jsunit/lib/JsUnit.js");

// load libx unittest loader
load("loadlibx.js");

var SUITEDIR 	= "testsuites";
var RESULTSDIR	= "testresults";
var ALLTESTS	= null;

// some utility functions
function isTestFile (name)
{
	return RegExp(/\w+\.test\.js$/).test(name);
}
function isRefFile (name)
{
	return RegExp(/\w+\.ref$/).test(name);
}
function isDir (name)	/* probably */
{
	return !isRefFile(name) && !isTestFile(name);
}
function getLowestDir (name)
{
	var tmpsplit = name.split("/");
	return tmpsplit[tmpsplit.length - 2];
}
function getFileFromPath (name)
{
	var tmpsplit = name.split("/");
	return tmpsplit[tmpsplit.length - 1];
}
function stripTopDir (name)
{
	var tmpsplit = name.split(/^(\w+)\//);
	return tmpsplit[2];
}

/* suite {String}	path of suite or filename to load
 * if suite is a directory, then recursively load all test.js files and suites;
 * if suite is a filename (indicated by ending in test.js) then only load that
 * file. If SUITEDIR is passed in, then load all tests
 */
function loadTestSuite (suite)
{
	if (isTestFile(suite)) {
		loadTestIntoAll (suite);
		return 0;
	}
	var files = new java.io.File(suite).list();
	for (var i = files.length - 1; i >= 0; i--) {
		if (isDir(files[i])) {
			// if a directory is found, then continue recursing
			loadTestSuite(suite + "/" + files[i]);
		}
		else if (isTestFile(files[i])) {
			println("## TestLauncher: "+ getFileFromPath(suite) + "Test --> " 
				+ stripTopDir(suite));
		
			loadTestIntoAll ((suite + "/" + files[i]));
		}
		/* else do nothing, ignore */
	}
}
function loadTestIntoAll (test)
{
	JsUtil.prototype.include(test);
	ALLTESTS.addTest(eval(getLowestDir(test) +"TestSuite").prototype.suite());
}
/* include all test suites in SUITEDIR for testing. */
function loadAllTestSuites ()
{
	loadTestSuite(SUITEDIR);
}
/* include a certain list of tests in SUITEDIR for testing. */
function loadSelectTestSuites (argv) 
{
	for (var i = argv.length - 1; i >= 0; i--) {
		loadTestSuite(SUITEDIR + "/" + argv[i]);
	}
}
function AllTests()
{
    TestSuite.call(this, "AllTests");
}
function AllTests_suite()
{
    ALLTESTS = new AllTests();
	if (args[0] != undefined) {
		println("Test Suites Selected to Run:");
		// we are assuming that the launcher has sanitized the arguments
		loadSelectTestSuites (args);
	}
	else {
		println("Running all tests: ");
		loadAllTestSuites();
	}
    return ALLTESTS;
}
println ("## SUITEDIR: "+SUITEDIR+"/");
println ("## RESULTSDIR: "+RESULTSDIR+"/");

var args = arguments;
//
// begin the test suite
AllTests.prototype = new TestSuite();
AllTests.prototype.suite = AllTests_suite;

// run the tests and print results to console
JsUtil.prototype.quit(TextTestRunner.prototype.main(arguments));
