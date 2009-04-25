importPackage (java.io);

// load jsunit stuff
load("jsunit/lib/JsUtil.js");
JsUtil.prototype.include("jsunit/lib/JsUnit.js");

// load libx unittest loader
load("loadlibx.js");

// some constants
var SUITEDIR 	= "testsuites";		// directory containing the test suites
var RESULTSDIR	= "testresults";	// tmp dir containing the test output
var ALLTESTS	= null;				// jsunit object 

/* isTestFile
 * 	name {String}	full path of file to test
 * 	tests to see if a file is likely a test file, judging by the existence of
 * 	the .test.js suffix. returns true if NAME is a test file, false otherwise
 */
function isTestFile (name)
{
	var isfile = false;
	var file = new java.io.File(name);
	if (file != null) {
		isfile = RegExp(/\w+\.test\.js$/).test(name);
	}
	return isfile;
}
/* getLowestDir
 *	name {String} 	full path
 *	returns the lowest directory in the path; useful for extracting the name 
 *	of the test suite from a path
 */
function getLowestDir (name)
{
	var tmpsplit = name.split("/");
	return tmpsplit[tmpsplit.length - 2];
}
/* stripTopDir
 * 	name {String} 	full path
 * 	return the path minus the highest directory; useful for removing the
 * 	implied 'testsuites/' dir
 */
function stripTopDir (name)
{
	var tmpsplit = name.split(/^(\w+)\//);
	return tmpsplit[2];
}
/* readDirTreeIndex
 * reads the index file located in SUITEDIR, parses it into a 2d array, and
 * returns this array. Used for loading in test suites
 */
function readDirTreeIndex ()
{
	var list = new Array();
	var dir = 1;
	try {
		var fin = new BufferedReader(
			FileReader(File(SUITEDIR +"/index")));

		// read the contents of the index file, and create an associative
		// array to relate directories to their contents
		for (var line = fin.readLine(); line != null; line = fin.readLine()) {
			if (dir == 1) {
				dir = line.replaceAll (":", "");
				list[dir] = new Array();
			}
			else if (line != "") {
				list[dir].push(line);
//				println ("list["+dir+"] --> "+list[dir]);
			}
			else if (line == "") dir = 1;
		}
		return list;
	} catch (e) {
		println ("Problem reading index file in "+ SUITEDIR +"/ :: "+ e);
		exit();
	}
}
/* loadTestSuite
 * 	suite {String}	path of suite or filename to load
 * 	if suite is a directory, then recursively load all test.js files and suites;
 * 	if suite is a filename (indicated by ending in test.js) then only load that
 * 	file. If SUITEDIR is passed in, then load all tests. Calls indexDirTree
 */
function loadTestSuite (suite, list)
{
	// load all tests under directory 'suite'
	for (var i in list[suite]) {
		var fullname = suite +"/"+ list[suite][i];
		if (isTestFile (fullname)) {
			println("## TestLauncher: "+ getLowestDir(fullname) +"Test --> " 
				+ stripTopDir(suite));
			loadTestIntoAll (fullname);
		}
		else if (File(fullname).isDirectory()) {
			loadTestSuite(fullname, list);
		}
	}
}
/* loadTestIntoAll
 * includes the test file, and adds the suite to the AllTests list of suites
 * to run
 */
function loadTestIntoAll (test)
{
	JsUtil.prototype.include(test);
	ALLTESTS.addTest(eval(getLowestDir(test) +"TestSuite").prototype.suite());
}
/* include all test suites in SUITEDIR for testing. */
function loadAllTestSuites (list)
{
	var topdir = SUITEDIR + "/";
	for (var i in list[topdir]) {
		loadTestSuite(topdir + list[topdir][i], list);
	}
}
/* include a certain list of tests in SUITEDIR for testing. */
function loadSelectTestSuites (argv, list) 
{
	for (var i = argv.length - 1; i >= 0; i--) {
		if (isTestFile (argv[i])) {
			loadTestIntoAll (argv[i]);
		}
		else loadTestSuite(SUITEDIR + "/" + argv[i], list);
	}
}
function AllTests()
{
    TestSuite.call(this, "AllTests");
}
function AllTests_suite()
{
    ALLTESTS = new AllTests();
	var list = readDirTreeIndex();
	if (args[0] != undefined) {
		println("Test Suites Selected to Run:");
		// we are assuming that the launcher has sanitized the arguments
		loadSelectTestSuites (args, list);
	}
	else {
		println("Running all tests: ");
		loadAllTestSuites(list);
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
