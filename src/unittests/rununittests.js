// load the jsunit framework libraries
load("jsunit/lib/JsUtil.js");
JsUtil.prototype.include("jsunit/lib/JsUnit.js");

// load libx unittest loader
load("loadlibx.js");

/* please note that the reference attribute should be a directory containing the
 * reference files that correspond to your individual test cases (add trailing
 * slash)
 * e.g., for PackageVisitorTestSuite.testSuccess() and 
 * reference: "./reference/PackageVisitor", you will need to make sure your
 * reference file is at ./reference/PackageVisitor/testSuccess.ref
 * It's designed this way because in order to keep complexity down, certain
 * assumptions are made. If you do not want a reference file, please set 
 * reference to "none"
 */
var testSuiteList =
{	
	MemCacheTestSuite: {
		jsfile:		"memcache.js",
		reference: 	"none" 
	},
	PackageVisitorTestSuite: {
		jsfile:		"atompub.js",
		reference:	"./reference/PackageVisitor/"
	},
	AtomParserTestSuite: {
		jsfile:		"testatom.js", 
		reference:	"none" 
	},
	TextTransformerTestSuite: { 
		jsfile:		"testtexttransformer.js", 
		reference:	"none"
	}
};
// this list is filled with test suites if the user invokes jsunit with
// arguments specifying which tests they wish to run
var testSuitesToRun = { };
function loadAllTestSuites ()
{
	for (var attribute in testSuiteList) {
		println(attribute +" in "+ testSuiteList[attribute].jsfile);
		println("## TestLauncher: "+ attribute +" --> "
				+ testSuiteList[attribute].reference);
		JsUtil.prototype.include(testSuiteList[attribute].jsfile);
	}
	testSuitesToRun = testSuiteList;
}
function loadSelectTestSuites (argv) 
{
	for (var i = 0; i < argv.length; i++) {
		// TODO: rewrite using indexOf( ... )
		for (var attribute in testSuiteList) {
			if (testSuiteList[attribute].jsfile == argv[i]) {
				println(attribute +" in "+ testSuiteList[attribute].jsfile);
				println("## TestLauncher: "+ attribute +" --> "
					+ testSuiteList[attribute].reference);
				testSuitesToRun[attribute] = testSuiteList[attribute];
				JsUtil.prototype.include(testSuitesToRun[attribute].jsfile);
			}
		}
	}
}
function AllTests()
{
    TestSuite.call(this, "AllTests");
}
function AllTests_suite()
{
    var suite = new AllTests();
	for (var attribute in testSuitesToRun) {
		var testSuite = eval(attribute);
   		suite.addTest(testSuite.prototype.suite());
		//java.lang.Thread.sleep(5000);
	}
    return suite;
}
var argv = [ ];
// if arguments are given to the launcher, then we will only run the tests
// listed in the command-line arguments
if (arguments[0] != undefined) {
	for (var i = 0; i < arguments.length; i++) {
		if (arguments[i].match(/\.js$/)) {
			argv[i] = arguments[i];
		}
		else {
			println("Invalid Argument: Not a javascript file -- "+ arguments[i]);
			exit(1);
		}
	}
	println("Test Suites Selected to Run:");
	loadSelectTestSuites(argv);	
}
else {
	println("Running all tests: ");
	loadAllTestSuites();
}
// begin the test suite
AllTests.prototype = new TestSuite();
AllTests.prototype.suite = AllTests_suite;

// run the tests and print results to console
JsUtil.prototype.quit(TextTestRunner.prototype.main(argv));
