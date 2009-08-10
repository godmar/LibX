/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is LibX Firefox Extension.
 *
 * The Initial Developer of the Original Code is Annette Bailey (libx.org@gmail.com)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer and Virginia Tech. All Rights Reserved.
 *
 * Contributor(s): Travis Webb ( abshnasko@gmail.com )
 *
 * ***** END LICENSE BLOCK ***** */

/**
 *
 * @namespace
 */
libx.testing = (function () {

var asserts = [ ];  // list of assertions for a current function
var env     = null; // browser environment; env.js?
var output  = [ ];

/**
 * Creates a test environment for running unit tests
 * @private
 */
var UnitTestEnv = libx.core.Class.create({
    // global vars
    print   : 0,    // logging function
    failures: [ ],  // list of failed tests, assertions, usw.
    tests   : 0,    // total number of tests run
    suites  : 0,    // number of test suites

    /**
     * @constructs
     *
     * Initializes the LibX unit testing environment
     */
    initialize : function (browserTestEnv, ostream) {
        // redefine logger so that we can easily capture test output
        libx.log = {
            write : this.write
        };
        this.suites = libx.testing.unittests.length;
        this.env = browserTestEnv;
        this.print = ostream;
        this.print("\n");
        this.print("LibX Unit Tests\n");
        this.print("------------------------------");
    },
    /**
     * Begins execution of all tests in all test suites
     */
    runAllTests : function () {
        var list = libx.testing.unittests;
        var i = 1;
        for (var suite in list) {
            this.print("\n\n["+ i +"/"+ this.suites +"] ");
            this.print("Running Test Suite: '"+ list[suite].name +"'\n");
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
            this.print("\t["+ j +"/" + suite.tests.length +"] ");
            this.print("Unit Test: "+ suite.funcNames[test] + "\n");
            this.runSingleTest (suite.tests[test], suite.name, suite.setup);
            // check assertions
            for (i in asserts) {
                if (asserts[i].result == false) {
                    this.failures.push ({
                        "function": suite.funcNames[test],
                        "assertion": asserts[i]
                    });
                    this.print("\t!!! Assertion Failed in function "+ suite.funcNames[test] +": ");
                    this.print(asserts[i].type +" --> ("+ asserts[i].msg +")\n");
                }
                else {
                    this.print("OK\n");
                }
            }
            j++;
            this.tests++;
        }
    },
    /**
     * Runs and evaluates a single test. Can be called by a launcher, or
     * by runAllTestsInSuite
     */
    runSingleTest : function (func, name, setup) {
        asserts = [ ];
        output = [ ];
        if (setup === undefined) {
            func(libx.log);
        }
        else {
            setup();
            func(libx.log);
        }
        if (output.length > 0) {
            this.print(" >>>>>>>>>>>>>> ");
            this.print(output.join("\n >>>>>>>>>>>>>> "));
        }
        // TODO: check debugs and output
    },
    /**
     * @private
     * Called from libx.testing.runAllUnitTests()
     */
    printResults : function () {
        var failures = this.failures;
        this.print("\n\nDONE.\n");
        this.print("------------------------------\n");
        this.print("Tests Run: "+ this.tests +"\n");
        this.print("Failures:  "+ failures.length +"\n");

        this.print("\n");
    },
    /**
     * Override libx.log.write so that test framework can capture the output
     */
    write : function (msg) {
        output.push(msg);
    }
});

var UnitTestMethods = {
    WAIT : function () {
        // TODO: implement
    },
    ASSERT_TRUE : function (a, msg) {
        asserts.push({
            "type" :    "ASSERT_TRUE",
            "result" :  (a == true),
            "msg" :     (msg === undefined) ? a +" != true" : msg
        });
    },
    ASSERT_EQUALS : function (a, b, msg) {
        asserts.push({
            "type" :    "ASSERT_EQUALS",
            "result" :  (a == b),
            "msg" :     (msg === undefined) ? a +" != "+ b : msg
        });
    },
    ASSERT_IDENTICAL : function (a, b, msg) {
        asserts.push({
            "type" :    "ASSERT_IDENTICAL",
            "result" :  (a === b),
            "msg" :     (msg === undefined) ? a +" !== "+ b : msg
        });
    },
    ASSERT_LT : function (a, b, msg) {
        asserts.push({
            "type" :    "ASSERT_LT",
            "result" :  (a < b),
            "msg" :     (msg === undefined) ? a +" >= "+ b : msg
        });
    },
    ASSERT_GT : function (a, b, msg) {
        asserts.push({
            "type" :    "ASSERT_GT",
            "result" :  (a > b),
            "msg" :     (msg === undefined) ? a +" <= "+ b : msg
        });
    },
    ASSERT_LTE : function (a, b, msg) {
        asserts.push({
            "type" :    "ASSERT_LTE",
            "result" :  (a <= b),
            "msg" :     (msg === undefined) ? a +" > "+ b : msg
        });
    },
    ASSERT_GTE : function (a, b, msg) {
        asserts.push({
            "type" :    "ASSERT_GTE",
            "result" :  (a >= b),
            "msg" :     (msg === undefined) ? a +" < "+ b : msg
        });
    },
    ASSERT_REGEXP_MATCHES : function (a, b, msg) {
        // TODO: implement
        asserts.push({
            "type" :    "ASSERT_REGEXP_MATCHES",
            "result" :  null, // XXX
            "msg" :     (msg === undefined) ? "regexp does not match "+ b : msg
        });
    },
    ASSERT_OUTPUT_EQUALS : function (a) {
        asserts.push({
            "type" :    "ASSERT_OUTPUT_EQUALS",
            "result" :  false,//(a == output.join()),
            "msg" :     (msg === undefined) ? "output does not equal "+ a : msg
        });
    },
    PRINT : function (msg) {
        output.push(msg);
    },
    BREAKPOINT : function (msg) {
        // TODO: implement
        // pause until user chooses to continue testing
    },
    DEBUG : function (msg) {
        debug.push(msg);
    },
    DIE : function (msg) {
        // TODO: implement
    },
    BROWSER_ENV : function () {
        // TODO: implement
        return 0; // env
    }
};

// Testing API
return /** @lends libx.testing */ {
    
    methods : UnitTestMethods,
    // contains list of test suite objects
    unittests : new Array(),
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
        libx.testing.unittests.push({
            "name":     suiteName,
            "setup":    setUpFunc,
            "tests":    [ ],
            "funcNames":[ ]
        });
    },
    /**
    * adds a single test function to a test suite
    *
    * @param {String}   suiteName   Name of the test suite to add the function
    * @param {Function} func        Reference to the test function. The success 
    *   of the test is determined by the return value of the function, OR the 
    *   match of its output with the reference output. (it'd be nice if
    *   everyone started their test case function names with "test")
    * @param {String} funcName      A description of the function that contains
    *   the test code so it can be easily identified in the test output
    *                               
    */
    addUnitTest : function (suiteName, func, funcName) {
        var suiteobj;
        for (suite in libx.testing.unittests) {
            if (libx.testing.unittests[suite].name == suiteName) {
                suiteobj = libx.testing.unittests[suite];
            }
        }
        suiteobj.tests.push(func);
        if (funcName === undefined) {
            funcName = "Anonymous Function";
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
        var testobj = new UnitTestEnv(null, eval("print"));
        testobj.runAllTests();
        testobj.printResults();
    }
}
})();
