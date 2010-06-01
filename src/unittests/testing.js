/**
 * @namespace libx.testing
 */
libx.testing = (function () {

var record = false;
var logging = true; // this can be safely changed according to your preferences
var all_tests = new Array();
var main_thread = null;
var main_group = null;
var cur_test = {
    run     : null,
    libx    : libx,
    thread  : null,
    group   : null,
    parent  : null,
    lock    : false,
    oktorun : false,
    asserts : [ ],
    print   : function (msg) {
        print("         >> "+ msg);
    },
    output  : "",
    timeout : false
};

/**
 * Creates a test environment for running unit tests
 * @private
 */
var UnitTestEnv = libx.core.Class.create({
    // global vars
    failures    : [ ],   // list of failed tests, assertions, usw.
    tests       : 0,     // total number of tests run
    totalsuites : 0,     // number of test suites
    output      : "",    // save all output
    all_tests   : new Array(),

    /**
     * @private
     * logging function used by the cli
     */
    log : function (msg) {
        print(msg);
        this.output += msg;
    },

    /**
     * @constructs
     *
     * Initializes the LibX unit testing environment
     */
    initialize : function () {
        var env = this;
        main_thread = java.lang.Thread.currentThread();
        main_group = main_thread.getThreadGroup();
        main_thread.setName("main");
        cur_test.parent = this;

        // refine logging function so that the test framework can 
        // validate unit test output
        libx.testing.record = function (msg) {
            cur_test.output += msg;
            env.log(msg);
        }

        this.all_tests = all_tests;
        this.totalsuites = this.all_tests.length;

        this.log("\n");
        this.log("LibX Unit Tests\n");
        this.log("------------------------------");
    },
    /**
     * Begins execution of all tests in all test suites
     */
    runAllTests : function () {
        var list = this.all_tests;
        var i = 1;
        for (var suite in list) {
            this.log("\n\n["+ i +"/"+ this.totalsuites +"] ");
            this.log("Running Test Suite: '"+ list[suite].name +"'");
            this.runAllTestsInSuite (list[suite]);
            i++;
        }
    },
    /**
     * Begins execution of all tests in a given test suite. Can be called 
     * by a launcher, or by runAllTests
     */
    runAllTestsInSuite : function (suite) {
        var j = 1;
        for (var test in suite.tests) {
            this.log("\n      ["+ j +"/"+ suite.tests.length +"] ");
            this.log("Unit Test: '"+ suite.funcNames[test] + "'\n");
            this.runSingleTest (suite.tests[test], suite.name, suite.setup, suite.timeouts[test]);
            for (var i in cur_test.asserts) {
                var assert = cur_test.asserts[i];
                if (assert.result == false) {
                    this.failures.push ({
                        "function": suite.funcNames[test],
                        "assertion": assert
                    });
                    this.log("\n        !!! Assertion FAILED : '"+ (assert.type).toLowerCase() +"'");
                    this.log(" --> ("+ assert.msg +")");
                }
                else {
                    this.log("\n            Assertion PASSED : '"+ (assert.type).toLowerCase() +"'");
                }
            }
            this.log("\n");
            cur_test.asserts = [ ];
            j++;
            this.tests++;
        }
    },
    /**
     * Runs and evaluates a single test. Can be called by a launcher, or
     * by runAllTestsInSuite
     */
    runSingleTest : function (func, name, setup, timeout) {
        cur_test.output = "";
        cur_test.timeout = false;
        this.runFunctionAsThread(func, setup);

        // yield to the thread we just created so that it can acquire
        // the test lock before the parent tries; this allows the parent
        // to wait for a specified time, and fail the test if it takes
        // too long
        while (!cur_test.lock) {
            main_thread.yield();
        }
        cur_test.oktorun = true;
        var timed_out = false;
        var time = 0;
        //print("parent waiting on lock\n");
        for (var time = 0; cur_test.lock; time++) {
            if (time / 4 >= timeout) {
                timed_out = true;
                break;
            }
            main_thread.yield();
            main_thread.sleep(250);
        }
        if (timed_out) {
            //print("parent timed out waiting for lock\n");
            cur_test.asserts.push({
                "type"  : "TIMEOUT",
                "result": cur_test.timeout,
                "msg"   : "the function timed out"
            });
        }
        // kill thread
        // http://java.sun.com/javase/6/docs/technotes/guides/concurrency/threadPrimitiveDeprecation.html
        var tmp_group = cur_test.group;
        cur_test.group.stop();
        cur_test.lock = false;
        cur_test.oktorun = false;
        gc();
    },
    /**
     * @private
     * executes a function as a thread, which can be paused or killed on-demand
     * Called from libx.testing.runSingleTest
     */
    runFunctionAsThread : function (func, setup) {
        // wrapper for the unit test function; prepare each test function
        // with a miniature environment
        cur_test.run = function () {
            cur_test.thread.yield();
            cur_test.lock = true;
            cur_test.thread.yield();

            // we can't start until the parent says so, i.e., until it is 
            // ready to wait for the lock
            while(!cur_test.oktorun) {
                cur_test.thread.yield();
            }
            try {
                func(setup ? setup() : undefined);
                //print("thread released lock\n");
                cur_test.lock = false;
            }
            catch (e) {
                if (/InterruptedException/.test(e.toString())) {
                    // if the test thread is sleeping, this exception will
                    // be thrown when trying to interrupt it. This is ok.
                    cur_test.lock = false;
                }
                else {
                    this.parent.log("From the current unit test function: \n");
                    this.parent.log(e.toString());
                    quit();
                }
            }
        };
        cur_test.group = new java.lang.ThreadGroup("unittest");
        cur_test.group.setDaemon(false);
        cur_test.thread = new java.lang.Thread(cur_test.group, new java.lang.Runnable(cur_test));
        (cur_test.thread).start();
    },
    /**
     * @private
     * Called from libx.testing.runAllUnitTests()
     */
    printResults : function () {
        var failures = this.failures;
        this.log("\n\nDONE.\n");
        this.log("------------------------------\n");
        this.log("Tests Run: "+ this.tests +"\n");
        this.log("Failures:  "+ failures.length +"\n");

        this.log("\n");
        if (logging) this.dumpLog();
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
        out.write(this.output);
        out.close();
        println("Logfile written to "+ filename +"\n");
    }
});

// Testing API
return /** @lends libx.testing */ {

    /**
     * Specify whether to record test output in text files. This flag can be 
     * set by the launcher, or manually.
     */
    recording : function (flag) {
        record = flag;
    },
    
    /**
     * default timeout, in seconds, for test functions who don't specify a timeout value
     */
    defaulttimeout : 10,
    /*
     * collection of supporting functions available to users of the unit
     * test suite
     */
    methods : {
        ASSERT_TRUE : function (a, msg) {
            var result;
            if (a === undefined || a == null) result = false;
            else result = (a == true);
            cur_test.asserts.push({
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
            cur_test.asserts.push({
                "type"  : "ASSERT_FALSE",
                "result": result,
                "msg"   : (msg === undefined) ? a +" != false" : msg
            });
            return result;
        },
        ASSERT_UNDEFINED : function (a, msg) {
            var result = a === undefined;
            cur_test.asserts.push({
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
            cur_test.asserts.push({
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
            cur_test.asserts.push({
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
            cur_test.asserts.push({
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
            cur_test.asserts.push({
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
            cur_test.asserts.push({
                type  : "ASSERT_REGEXP_MATCHES",
                result: result || expect,
                msg   : (msg === undefined) ? "regexp "+ a.toSource() +" does not match "+ b : msg
            });
            return result;
        },
        ASSERT_OUTPUT_MATCHES : function (file, logdiff, expect, msg) {
            if (record) {
                try {
                    var fstream = new java.io.FileWriter("tests/output/"+ file);
                    var tofile = new java.io.BufferedWriter(fstream);
                    tofile.write(cur_test.output);   
                    tofile.close();
                    print("\nRecorded test output to file: "+ "test/output/"+ file);
                }
                catch (ex) {
                    print(ex.toString());
                }
            }
            var valid  = readFile("tests/output/"+ file);
            var result = (cur_test.output == valid) || expect;
            if (result === undefined || result == null | valid === undefined || valid == null)
                result = false;
            cur_test.asserts.push({
                type  : "ASSERT_OUTPUT_MATCHES",
                result: result,
                msg   : (msg === undefined) ? "Output does not match text in file 'tests/output/"+ file +"'" : msg
            });
            if (logdiff && !result) {
                var opt = { input: cur_test.output + "\n", output: "diff -u:" };
                runCommand("diff", "-u", "tests/output/"+ file, "-", opt);
            }
        },
        /**
         * cause the current unit test to fail and stop execution
         */
        FAIL : function (msg, expect) {
            cur_test.asserts.push({
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
            if (expect) cur_test.timeout = true;
            cur_test.thread.sleep(timeout * 1000);
        },
        /**
         * expect is a flag that means 'expect failure'
         */
        WAIT_FOR_CONDITION : function (func, timeout, expect, msg) {
            if (expect) cur_test.timeout = true;
            var ticks = Math.floor((timeout * 1000) / 500);
            for (var i = 0; i < ticks; i++) {
                if (func) {
                    cur_test.asserts.push({
                        type  : "WAIT_FOR_CONDITION", result: true,
                    });
                    return true;
                }
                cur_test.thread.sleep(500);
            }
            cur_test.thread.sleep(timeout % 500);
            if (func) return;
            cur_test.asserts.push({
                type  : "WAIT_FOR_CONDITION",
                result: false || expect,
                msg   : (msg === undefined) ? "condition never met" : msg
            });
            return false;
        }
    },

    /**
     * Creates an empty test suite, with a setup function. suiteName must
     * be unique. Each test suite can have only one setup function. The setup
     * function is called prior to EACH test.
     *
     * @param {String} suiteName    Name for the test suite. 
     * @param {Function} setUpFunc  Optional. Reference to the setup function. 
     *
     * @returns {Boolean} Returns false if a suite with this name already exists
     */
    createUnitTestSuite : function (obj) {
        all_tests.push({
            name:     obj.name,
            setup:    obj.setup,
            tests:     [ ],
            funcNames: [ ],
            timeouts:  [ ],
        });
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
    addUnitTest : function (obj) {
        var suiteName   = obj.suiteName;
        var func        = obj.testFunction;
        var funcName    = obj.funcName;
        var timeout     = obj.timeout;
        var fail        = obj.expectFailure;
        var suiteobj    = null;
        for (suite in all_tests) {
            if (all_tests[suite].name == suiteName) {
                suiteobj = all_tests[suite];
            }
        }
        if (suiteobj === null) {
            print("Test Suite '"+ suiteName +"' not found");
            return;
        }
        if (funcName === undefined) funcName = "Unnamed Test Function";
        if (timeout !== undefined && timeout > 0) {
            suiteobj.timeouts.push(timeout);
        }
        else {
            suiteobj.timeouts.push(libx.testing.defaulttimeout);
        }
        suiteobj.tests.push(func);
        suiteobj.funcNames.push(funcName);
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
        var testobj = new UnitTestEnv();
        testobj.runAllTests();
        testobj.printResults();
        quit();
    }
}
})(); // end libx.testing
