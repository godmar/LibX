/**
 * @namespace libx.testing
 */
libx.testing = (function () {

var recordingMode = false;
var dumpLogAtEnd = false; // this can be safely changed according to your preferences

var Test = libx.core.Class.create({
    initialize : function (funcName, testFunction, options) {
        this.timeout = false;
        this.lock = false;
        this.oktorun = false;
        this.asserts = [ ];

        this.funcName = funcName;
        this.testFunction = testFunction;

        this.expectFailure = options != null && options.expectFailure;
        this.timeoutValue = options != null && options.timeout || libx.testing.defaulttimeout;
    },
    /**
     * Log output to console.  
     * Such output can be recorded, and tested against earlier output.
     */
    log : function (msg) {
        this.output += msg;
    },
    /**
     * A URL where the files in this directory can be accessed.
     */
    baseUrl : libx.testsetup.baseUrl,

    /**
     * Path where LibX source files reside.
     */
    basePath : "../base/",

    /**
     * Runs and evaluates a single test. Can be called by a launcher, or
     * by runAllTestsInSuite
     */
    runTest : function (testsuite, env) {
        this.output = "";    // save current tests's output
        this.timeout = false;
        var threadGroup = this.runFunctionAsThread(testsuite, env);
        var thisThread = java.lang.Thread.currentThread();

        // XXX FIX THIS
        // yield to the thread we just created so that it can acquire
        // the test lock before the parent tries; this allows the parent
        // to wait for a specified time, and fail the test if it takes
        // too long
        while (!this.lock) {
            thisThread.yield();
        }
        this.oktorun = true;
        var timed_out = false;
        var time = 0;
        //print("parent waiting on lock\n");
        for (var time = 0; this.lock; time++) {
            if (time / 4 >= this.timeoutValue) {
                timed_out = true;
                break;
            }
            thisThread.sleep(250);
        }
        if (timed_out) {
            //print("parent timed out waiting for lock\n");
            this.asserts.push({
                "type"  : "TIMEOUT",
                "result": this.timeout,
                "msg"   : "the function timed out"
            });
        }
        // kill thread
        // http://java.sun.com/javase/6/docs/technotes/guides/concurrency/threadPrimitiveDeprecation.html
        threadGroup.stop();
        this.lock = false;
        this.oktorun = false;
        gc();
    },
    /**
     * @private
     * executes a function as a thread, which can be paused or killed on-demand
     * Called from runTest
     */
    runFunctionAsThread : function (testsuite, env) {
        var self = this;

        // wrapper for the unit test function; prepare each test function
        // with a miniature environment
        this.run = function () {
            self.lock = true;

            // we can't start until the parent says so, i.e., until it is 
            // ready to wait for the lock
            while(!this.oktorun) {
                java.lang.Thread.currentThread().yield();
            }
            try {
                self.testFunction('setup' in testsuite ? testsuite.setup() : undefined);
                env.log(this.output);
                //print("thread released lock\n");
                self.lock = false;
            }
            catch (e) {
                if (/InterruptedException/.test(e.toString())) {
                    // if the test thread is sleeping, this exception will
                    // be thrown when trying to interrupt it. This is ok.
                    self.lock = false;
                }
                else {
                    env.log("From the current unit test function: \n");
                    env.log(e.toString());
                    quit();
                }
            }
        };
        var group = new java.lang.ThreadGroup("unittest");
        group.setDaemon(false);

        var thread = new java.lang.Thread(group, new java.lang.Runnable(this));
        thread.start();
        return group;
    },
    /*
     * collection of supporting functions available to users of the unit
     * test suite
     */
    ASSERT_TRUE : function (a, msg) {
        var result;
        if (a === undefined || a == null) result = false;
        else result = (a == true);
        this.asserts.push({
            "type"  : "ASSERT_TRUE",
            "result": result,
            "msg"   : (msg === undefined) ? a +" != true" : msg
        });
        return result;
    },
    ASSERT_FALSE : function (a, msg) {
        var result;
        if (a === undefined || a == null) result = false;
        else result = (a == false);
        this.asserts.push({
            "type"  : "ASSERT_FALSE",
            "result": result,
            "msg"   : (msg === undefined) ? a +" != false" : msg
        });
        return result;
    },
    ASSERT_UNDEFINED : function (a, msg) {
        var result = a === undefined;
        this.asserts.push({
            "type"  : "ASSERT_UNDEFINED",
            "result": result,
            "msg"   : (msg === undefined) ? a +" not undefined" : msg
        });
        return result;
    },
    ASSERT_EQUAL : function (a, b, msg) {
        var result;
        if (a === undefined || a == null) result = false;
        result = (a == b);
        this.asserts.push({
            "type"  : "ASSERT_EQUAL",
            "result": result,
            "msg"   : (msg === undefined) ? a +" != "+ b : msg
        });
        return result;
    },
    ASSERT_NOT_EQUAL : function (a, b, msg) {
        var result;
        if (a === undefined || a == null) result = false;
        else result = (a != b);
        this.asserts.push({
            "type"  : "ASSERT_NOT_EQUAL",
            "result": result,
            "msg"   : (msg === undefined) ? a +" == "+ b : msg
        });
        return result;
    },
    ASSERT_NOT_IDENTICAL : function (a, b, msg) {
        var result;
        if (a === undefined || a == null) result = false;
        else result = (a !== b);
        this.asserts.push({
            type  : "ASSERT_NOT_IDENTICAL",
            result: result,
            msg   : (msg === undefined) ? a +" === "+ b : msg
        });
        return result;
    },
    ASSERT_IDENTICAL : function (a, b, msg) {
        var result;
        if (a === undefined || a == null) result = false;
        else result = (a === b);
        this.asserts.push({
            type  : "ASSERT_IDENTICAL",
            result: result,
            msg   : (msg === undefined) ? a +" !== "+ b : msg
        });
        return result;
    },
    ASSERT_REGEXP_MATCHES : function (a, b, expect, msg) {
        var result;
        if (a === undefined || a == null) result = false;
        else result = (a.test(b));
        this.asserts.push({
            type  : "ASSERT_REGEXP_MATCHES",
            result: result || expect,
            msg   : (msg === undefined) ? "regexp "+ a.toSource() +" does not match "+ b : msg
        });
        return result;
    },
    ASSERT_OUTPUT_MATCHES : function (logdiff, expect, msg) {
        var file = encodeURIComponent(this.funcName) + ".expected";
        if (recordingMode) {
            try {
                var fstream = new java.io.FileWriter("tests/output/"+ file);
                var tofile = new java.io.BufferedWriter(fstream);
                tofile.write(this.output);
                tofile.close();
                this.log("\nRecorded test output to file: "+ "test/output/"+ file);
            }
            catch (ex) {
                this.log(ex.toString());
            }
        }
        var valid  = readFile("tests/output/"+ file);
        var result = (this.output == valid) || expect;
        if (result === undefined || result == null | valid === undefined || valid == null)
            result = false;
        this.asserts.push({
            type  : "ASSERT_OUTPUT_MATCHES",
            result: result,
            msg   : (msg === undefined) ? "Output does not match text in file 'tests/output/"+ file +"'" : msg
        });
        if (logdiff && !result) {
            var opt = { input: this.output + "\n", output: "diff -u:" };
            runCommand("diff", "-u", "tests/output/"+ file, "-", opt);
        }
    },
    /**
     * cause the current unit test to fail and stop execution
     */
    FAIL : function (msg, expect) {
        this.asserts.push({
            "type"  : "FAIL",
            "result": !expect,
            "msg"   : (msg === undefined) ? "unit test triggered FAIL for unspecified reason" : msg
        });
        return false;
    },
    /**
     * pause for a specified number of milliseconds
     */
    WAIT : function (timeout, expect) {
        if (expect) this.timeout = true;
        Envjs.wait(timeout * 1000); 
        // java.lang.Thread.currentThread().sleep(timeout * 1000);
    },
    /**
     * expect is a flag that means 'expect failure'
     */
    WAIT_FOR_CONDITION : function (func, timeout, expect, msg) {
        if (expect) this.timeout = true;
        var ticks = Math.floor((timeout * 1000) / 500);
        for (var i = 0; i < ticks; i++) {
            if (func) {
                this.asserts.push({
                    type  : "WAIT_FOR_CONDITION", result: true,
                });
                return true;
            }
            this.WAIT(0.5, false);
        }
        this.WAIT((timeout % 500)/1000.0, false);
        if (func) return;
        this.asserts.push({
            type  : "WAIT_FOR_CONDITION",
            result: false || expect,
            msg   : (msg === undefined) ? "condition never met" : msg
        });
        return false;
    },
});

var TestSuite = libx.core.Class.create({
    /**
     * @constructs
     *
     * Initializes a test suite object 
     *
     * @param {String} name    Name for the test suite. 
     * @param {Function} setup  Optional. Reference to the setup function. 
     */
    initialize : function (name, setup) {
        this.name = name;
        this.setup = setup;
        this.tests = { };   // map test name to test
    },
    /**
    * adds a single test function to a test suite
    *
    * @param {String}   suiteName   
    *   Name of the test suite to add the function
    * @param {Function} testFunction        
    *   Reference to the test function. The success 
    *   of the test is determined by the return value of the function, OR the 
    *   match of its output with the reference output. (it'd be nice if
    *   everyone started their test case function names with "test")
    * @param {String} funcName      
    *   A description of the function that contains
    *   the test code so it can be easily identified in the test output
    * @param {Number}   timeout
    *   Number of seconds to timeout if the test should fail sooner or later
    *   due to timeout; if func is not done executing by this time, the test
    *   fails.
    */
    addUnitTest : function (testName, testFunction, options) {
        if (testName === undefined)
            throw "Must provide test name";

        if (testName in this.tests)
            throw "Test with name " + testName + " already exists";

        return this.tests[testName] = new Test(testName, testFunction, options);
    },
    /**
     * Begins execution of all tests in a given test suite. Can be called 
     * by a launcher, or by runAllTests
     */
    runAllTests: function (env) {
        var j = 1;
        var nTests = 0;
        for (var testName in this.tests)
            nTests++;

        for (var testName in this.tests) {
            var test = this.tests[testName];
            env.log("\n      ["+ j +"/"+ nTests + "] ");
            env.log("Unit Test: '"+ test.funcName + "'\n");
            test.runTest (this, env);
            for (var i in test.asserts) {
                var assert = test.asserts[i];
                if (assert.result == false) {
                    env.failures.push ({
                        "function": test.funcName,
                        "assertion": assert
                    });
                    env.log("\n        !!! Assertion FAILED : '"+ (assert.type).toLowerCase() +"'");
                    env.log(" --> ("+ assert.msg +")");
                }
                else {
                    env.log("\n            Assertion PASSED : '"+ (assert.type).toLowerCase() +"'");
                }
            }
            env.log("\n");
            env.numTests++;
            j++;
        }
    },
});

/**
 * Creates a test environment for running unit tests
 * @private
 */
var UnitTestEnv = libx.core.Class.create({
    // global vars
    allOutput      : "",    // save all output

    /**
     * @private
     * logging function used by the cli
     */
    log : function (msg) {
        print(msg);
        this.allOutput += msg;
    },

    /**
     * @constructs
     *
     * Initializes the LibX unit testing environment
     */
    initialize : function (testsuites) {
        this.testsuites = testsuites;

        this.numTests = 0;      // number of tests run
        this.failures = [ ];    // list of failed tests, assertions, usw.
        var main_thread = java.lang.Thread.currentThread();
        main_thread.setName("main");

        // refine logging function so that the test framework can 
        // validate unit test output
        this.log("\n");
        this.log("LibX Unit Tests\n");
        this.log("------------------------------");
    },
    /**
     * Begins execution of all tests in all test suites
     */
    runAllTests : function () {
        var list = this.testsuites;
        var totalsuites = 0;
        for (var suite in list)
            totalsuites++;

        var i = 1;
        for (var suite in list) {
            this.log("\n\n["+ i +"/"+ totalsuites +"] ");
            this.log("Running Test Suite: '"+ list[suite].name +"'");
            list[suite].runAllTests(this);
            i++;
        }
    },
    /**
     * @private
     * Called from libx.testing.runAllUnitTests()
     */
    printResults : function () {
        var failures = this.failures;
        this.log("\n\nDONE.\n");
        this.log("------------------------------\n");
        this.log("Tests Run: "+ this.numTests +"\n");
        this.log("Failures:  "+ failures.length +"\n");

        this.log("\n");
        if (dumpLogAtEnd) this.dumpLog();
    },
    /**
     * @private
     * Called from printResults. Writes the log contents to file.
     */
    dumpLog : function () {
        var d = new Date();
        var filename = "testlog_"+ d.getTime() +".txt";
        var fstream = new java.io.FileWriter(filename);
        var out = new java.io.BufferedWriter(fstream);
        out.write(this.allOutput);
        out.close();
        println("Logfile written to "+ filename +"\n");
    }
});

// Testing API
return /** @lends libx.testing */ {
    testsuites  : { },   // map test suite name to test suite

    /**
     * Specify whether to record test output in text files. This flag can be 
     * set by the launcher, or manually.
     */
    setRecordingMode : function (_recordingMode) {
        recordingMode = _recordingMode;
    },
    
    /**
     * default timeout, in seconds, for test functions who don't specify a timeout value
     */
    defaulttimeout : 10,
    /**
     * Creates an empty test suite, with a setup function. suiteName must
     * be unique. Each test suite can have only one setup function. The setup
     * function is called prior to EACH test.
     * If a test suite by that name already exists, it is returned.
     *
     * @param {String} suiteName    Name for the test suite. 
     * @param {Function} setUpFunc  Optional. Reference to the setup function. 
     *
     * @returns {TestSuite} Returns new test suite
     */
    createUnitTestSuite : function (suiteName, setUpFunc) {
        if (suiteName in this.testsuites)
            return this.testsuites[suiteName];

        return this.testsuites[suiteName] = new TestSuite(suiteName, setUpFunc);
    },
    /**
     * Executes all unit test suites, with the help of a 'test_env'
     * object. This object contains all test framework methods, as well as
     * information about the environment in which the tests are executed. 
     * This object will be passed from a launcher written specifically to 
     * run tests using this custom framework.
     *
     * @returns {Boolean} True if everything went ok; false indicates that one
     *  or more errors occured, which may mean that the test results might not
     *  be accurate.
     */
    runAllUnitTests : function () {
        var env = new UnitTestEnv(this.testsuites);
        env.runAllTests();
        env.printResults();
        quit();
    }
}
})(); // end libx.testing
