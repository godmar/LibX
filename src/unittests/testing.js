/**
 *
 * @namespace
 */
libx.testing = (function () {

var all_tests = new Array();
var cur_test = {
    run     : null,
    libx    : libx,
    thread  : null,
    parent  : null,
    lock    : false,
    oktorun : false,
    asserts : [ ],
    print   : function (msg) {
        print("         >> "+ msg);
    }
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
    print       : print,
    println     : println,
    all_tests   : new Array(),

    /**
     * @private
     * logging function used by the cli
     */
    log : function (msg) {
        this.print(msg);
        this.output += msg;
    },

    /**
     * @constructs
     *
     * Initializes the LibX unit testing environment
     */
    initialize : function () {
        java.lang.Thread.currentThread().setPriority(10);
        cur_test.parent = this;

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
        if (setup === undefined) {
            this.runFunctionAsThread(func);
        }
        else {
            setup();
            this.runFunctionAsThread(func);
        }
        // yield to the thread we just created so that it can acquire
        // the test lock before the parent tries; this allows the parent
        // to wait for a specified time, and fail the test if it takes
        // too long
        while (!cur_test.lock) {
            java.lang.Thread.currentThread().yield();
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
            java.lang.Thread.currentThread().yield();
            java.lang.Thread.currentThread().sleep(250);
        }
        if (timed_out) {
            //print("parent timed out waiting for lock\n");
            cur_test.asserts.push({
                "type"  : "TIMEOUT",
                "result": false,
                "msg"   : "the function timed out"
            });
        }
        else {
            //print("parent acquired lock\n");
        }
        // kill thread
        // http://java.sun.com/javase/6/docs/technotes/guides/concurrency/threadPrimitiveDeprecation.html
        var tmp_thread = cur_test.thread;
        cur_test.thread = null;
        tmp_thread.interrupt();

        cur_test.lock = false;
        cur_test.oktorun = false;
    },
    /**
     * @private
     * executes a function as a thread, which can be paused or killed on-demand
     * Called from libx.testing.runSingleTest
     */
    runFunctionAsThread : function (func) {
        // wrapper for the unit test function; prepare each test function
        // with a miniature environment
        cur_test.run = function () {
            cur_test.thread.yield();
            cur_test.lock = true;
            cur_test.thread.yield();
            //print("thread acquired lock\n");

            var p = print;
            var pl = println;
            print = function (msg) {
                p("         >> "+ msg);
            }
            println = function (msg) {
                pl("         >> "+ msg);
            }
            // we can't start until the parent says so, i.e., until it is 
            // ready to wait for the lock
            while(!cur_test.oktorun) {
                cur_test.thread.yield();
            }
            try {
                func();
                //print("thread released lock\n");
                cur_test.lock = false;
            }
            catch (e) {
                if (/InterruptedException/.test(e.toString())) {
                    // if the test thread is sleeping, this exception will
                    // be thrown when trying to interrupt it.
                    cur_test.lock = false;
                }
                else {
                    this.parent.log("From the current unit test function: \n");
                    this.parent.log(e);
                }
            }
        };
        cur_test.thread = new java.lang.Thread(new java.lang.Runnable(cur_test));
        cur_test.thread.setPriority(10);
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
    },
});

// Testing API
return /** @lends libx.testing */ {
    
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
            cur_test.asserts.push({
                "type"  : "ASSERT_TRUE",
                "result": (a == true),
                "msg"   : (msg === undefined) ? a +" != true" : msg
            });
        },
        ASSERT_FALSE : function (a, msg) {
            cur_test.asserts.push({
                "type"  : "ASSERT_FALSE",
                "result": (a == false),
                "msg"   : (msg === undefined) ? a +" != false" : msg
            });
        },
        ASSERT_EQUAL : function (a, b, msg) {
            cur_test.asserts.push({
                "type"  : "ASSERT_EQUAL",
                "result": (a == b),
                "msg"   : (msg === undefined) ? a +" != "+ b : msg
            });
        },
        ASSERT_NOT_EQUAL : function (a, b, msg) {
            cur_test.asserts.push({
                "type"  : "ASSERT_NOT_EQUAL",
                "result": (a != b),
                "msg"   : (msg === undefined) ? a +" == "+ b : msg
            });
        },
        ASSERT_NOT_IDENTICAL : function (a, b, msg) {
            cur_test.asserts.push({
                "type"  : "ASSERT_NOT_IDENTICAL",
                "result": (a !== b),
                "msg"   : (msg === undefined) ? a +" === "+ b : msg
            });
        },
        ASSERT_IDENTICAL : function (a, b, msg) {
            cur_test.asserts.push({
                "type"  : "ASSERT_IDENTICAL",
                "result": (a === b),
                "msg"   : (msg === undefined) ? a +" !== "+ b : msg
            });
        },
        ASSERT_REGEXP_MATCHES : function (a, b, msg) {
            cur_test.asserts.push({
                "type"  : "ASSERT_REGEXP_MATCHES",
                "result": (new RegExp(a)).test(b),
                "msg"   : (msg === undefined) ? "regexp "+ a.toSource() +" does not match "+ b : msg
            });
        },
        /**
         * cause the current unit test to fail and stop execution
         */
        FAIL : function (msg) {
            cur_test.asserts.push({
                "type"  : "FAIL",
                "result": false,
                "msg"   : (msg === undefined) ? "unit test triggered FAIL for unspecified reason" : msg
            });
        },
        /**
         * pause for a specified number of milliseconds
         */
        WAIT : function (timeout) {
            cur_test.thread.sleep(timeout * 1000);
        },
        WAIT_FOR_CONDITION : function (func, timeout, msg) {
            var ticks = Math.floor((timeout * 1000) / 500);
            for (var i = 0; i < ticks; i++) {
                if (func) {
                    cur_test.asserts.push({
                        type  : "WAIT_FOR_CONDITION", result: true,
                    });
                    return;
                }
                cur_test.thread.sleep(500);
            }
            cur_test.thread.sleep(timeout % 500);
            if (func) return;
            cur_test.asserts.push({
                type  : "WAIT_FOR_CONDITION",
                result: false,
                msg   : (msg === undefined) ? "condition never met" : msg
            });
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
    createUnitTestSuite : function (suiteName, setUpFunc) {
        all_tests.push({
            name:     suiteName,
            setup:    setUpFunc,
            tests:     [ ],
            funcNames: [ ],
            timeouts:  [ ]
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
        suiteobj.tests.push(func);
        if (funcName === undefined) {
            funcName = "Unnamed Test Function";
        }
        if (timeout !== undefined && timeout > 0) {
            suiteobj.timeouts.push(timeout);
        }
        else {
            suiteobj.timeouts.push(libx.testing.defaulttimeout);
        }
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
    },
    /**
     * prepare unit tests which test the operation of the testing framework
     */
    unittests : function () {
        libx.testing.createUnitTestSuite("test framework");

        libx.testing.addUnitTest({
            suiteName:  "test framework",
            funcName:   "testing wait_for_condition statement (1)",
            testFunction: function () {
                this.print("this test should fail, because the condition will not be met\n");
                libx.testing.methods.WAIT_FOR_CONDITION(
                    (function () { return false; })(), 2
                );
            }
        });
        libx.testing.addUnitTest({
            suiteName:  "test framework",
            funcName:   "testing wait_for_condition statement (2)",
            testFunction: function () {
                this.print("this test should pass, because the condition should be met immediately\n");
                libx.testing.methods.WAIT_FOR_CONDITION(
                    (function () { return true; })(), 1
                );
            }
        });
        libx.testing.addUnitTest({
            suiteName:  "test framework", 
            funcName:   "testing timeout interval and WAIT (1)",
            timeout:    2,
            testFunction:       function () {
                this.print ("waiting 3 sec -- should timeout and fail\n");
                libx.testing.methods.WAIT(3);
                this.print ("we didn't timeout.\n");
            }
        });
        libx.testing.addUnitTest({
            suiteName:  "test framework", 
            funcName:   "testing timeout interval and WAIT (2)",
            timeout:    2,
            testFunction: function () {
                this.print ("waiting 1 sec -- should not timeout\n");
                libx.testing.methods.WAIT(1);
                this.print ("we didn't timeout.\n");
            }
        });
        libx.testing.addUnitTest({
            suiteName:  "test framework",
            funcName:   "test assert statements",
            testFunction: function () {
                libx.testing.methods.ASSERT_TRUE(1);
                libx.testing.methods.ASSERT_TRUE(1 == 1);

                libx.testing.methods.ASSERT_FALSE(0);
                libx.testing.methods.ASSERT_FALSE(2 + 2 == 5);

                libx.testing.methods.ASSERT_EQUAL("abc", "abc");
                libx.testing.methods.ASSERT_EQUAL(true, true);
                libx.testing.methods.ASSERT_EQUAL(3.1415926535, 3.1415926535);

                libx.testing.methods.ASSERT_NOT_EQUAL(3.1415926535, 3.141592653);
                libx.testing.methods.ASSERT_NOT_EQUAL(true, false);

                libx.testing.methods.ASSERT_IDENTICAL(3.1415926535, 3.1415926535);
                libx.testing.methods.ASSERT_IDENTICAL("", "");

                libx.testing.methods.ASSERT_NOT_IDENTICAL("", true);

                libx.testing.methods.ASSERT_REGEXP_MATCHES("(a+)(b+)", "aabbb");
            }
        });


    }
}
})(); // end libx.testing
