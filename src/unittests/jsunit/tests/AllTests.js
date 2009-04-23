/*
JsUnit - a JUnit port for JavaScript
Copyright (C) 1999,2000,2001,2002,2003,2006 Joerg Schaible

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var hasExceptions = "false";
var exceptionsWorking = "false";
var i;

function throwEx()
{
    throw new Object();
}
function testEx()
{
    var me = this;
    try { hasExceptions = "true"; new throwEx(); } 
    catch( ex ) { exceptionsWorking = this == me; }
}
new testEx();

if( !this.JsUtil )
{
    if( this.WScript )
    {
        var fso = new ActiveXObject( "Scripting.FileSystemObject" );
        var file = fso.OpenTextFile( "../lib/JsUtil.js", 1 );
        var all = file.ReadAll();
        file.Close();
        eval( all );
    }
    else
        load( "../lib/JsUtil.js" );
}
if( !JsUtil.prototype.isBrowser )
{
    var writer = JsUtil.prototype.getSystemWriter();
    /*
    // o = this.Environment;
    o = this;
    writer.println( "Object: " + o );
    for( i in o )
        writer.println( " i is " + i );
    JsUtil.prototype.quit(0);
    */
    writer.println( "\nJavaScript compatibility:" );
    writer.println( "\thas exceptions: " + hasExceptions );
    writer.println( "\texceptions working: " + exceptionsWorking );

    writer.println( "\nJavaScript engine detection:" );
    for( i in JsUtil.prototype )
        if( typeof JsUtil.prototype[i] != "function" && i.match( /^(is|has)/ ))
            writer.println( "\t" + i + ": " + JsUtil.prototype[i] );

    writer.println( "\nJsUnit Test Suite:\n" );
}
if( exceptionsWorking )
{
    eval( JsUtil.prototype.include( "../lib/JsUnit.js" ));
    eval( JsUtil.prototype.include( "JsUtilTest.js" ));
    eval( JsUtil.prototype.include( "JsUnitTest.js" ));

    function AllTests()
    {
        TestSuite.call( this, "AllTests" );
    }
    function AllTests_suite()
    {
        var suite = new AllTests();
        suite.addTest( JsUtilTestSuite.prototype.suite());
        suite.addTest( JsUnitTestSuite.prototype.suite());
        return suite;
    }
    AllTests.prototype = new TestSuite();
    AllTests.prototype.suite = AllTests_suite;
}
if( JsUtil.prototype.isShell )
{
    if( !exceptionsWorking )
    {
        writer.println( "\tSorry, exceptions not working!\n" );
        JsUtil.prototype.quit( -1 );
    }
    var args;
    if( this.WScript )
    {
        args = new Array();
        for( i = 0; i < WScript.Arguments.Count(); ++i )
            args[i] = WScript.Arguments( i );
    }
    else if( this.arguments )
        args = arguments;
    else
        args = new Array();
        
    var result = TextTestRunner.prototype.main( args );
    JsUtil.prototype.quit( result );
}

