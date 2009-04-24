// load the unit testing framework
load("../lib/JsUtil.js");
eval(JsUtil.prototype.include("../lib/JsUnit.js"));

// load the files we want to run tests on
eval(JsUtil.prototype.include("SimpleTest.js"));

function protoTest()
{
	TestSuite.call (this, "AllTests");
}
function protoTest_suite()
{
	var suite = new protoTest();
	suite.addTest(SimpleTestSuite.prototype.suite());
	return suite;
}
protoTest.prototype = new TestSuite();
protoTest.prototype.suite = protoTest_suite;

var args;
if (this.arguments)
	args = arguments;
else
	args = new Array();

var result = TextTestRunner.prototype.main( args );
JsUtil.prototype.quit( result );


