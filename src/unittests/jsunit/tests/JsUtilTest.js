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

function ErrorTest( name )
{
    TestCase.call( this, name );
}
function ErrorTest_testAttributes()
{
    if( Error.prototype.testable )
    {
        var err = new Error( "my message" );
        this.assertEquals( "Error", err.name );
        this.assertEquals( "my message", err.message );
    }
}
function ErrorTest_testCtorAsFunction()
{
    if( Error.prototype.testable )
    {
        var err = Error( "my message" );
        this.assertTrue( err instanceof Error );
        this.assertEquals( "Error", err.name );
        this.assertEquals( "my message", err.message );
    }
}
ErrorTest.prototype = new TestCase();
ErrorTest.glue();


function JsUnitErrorTest( name )
{
    TestCase.call( this, name );
}
function JsUnitErrorTest_testAttributes()
{
    var err = new JsUnitError( "my message" );
    this.assertEquals( "JsUnitError", err.name );
    this.assertEquals( "my message", err.message );
    err = new JsUnitError();
    this.assertEquals( "", err.message );
}
function JsUnitErrorTest_testToString()
{
    var err = new JsUnitError( "my message" );
    this.assertEquals( "JsUnitError: my message", err.toString());
}
JsUnitErrorTest.prototype = new TestCase();
JsUnitErrorTest.glue();


function InterfaceDefinitionErrorTest( name )
{
    TestCase.call( this, name );
}
function InterfaceDefinitionErrorTest_testAttributes()
{
    var err = new InterfaceDefinitionError( "my message" );
    this.assertEquals( "InterfaceDefinitionError", err.name );
    this.assertEquals( "my message", err.message );
}
InterfaceDefinitionErrorTest.prototype = new TestCase();
InterfaceDefinitionErrorTest.glue();


function FunctionGluingErrorTest( name )
{
    TestCase.call( this, name );
}
function FunctionGluingErrorTest_testAttributes()
{
    var err = new FunctionGluingError( "my message" );
    this.assertEquals( "FunctionGluingError", err.name );
    this.assertEquals( "my message", err.message );
}
FunctionGluingErrorTest.prototype = new TestCase();
FunctionGluingErrorTest.glue();


function FunctionTest( name )
{
    TestCase.call( this, name );
}
function FunctionTest_testFulfills()
{
    function MyInterface1() {}
    MyInterface1.prototype.if1 = function() {}

    function MyInterface2() {}
    MyInterface2.prototype.if2 = function() {}
    
    function MyInterface2Ex() {}
    MyInterface2Ex.prototype = new MyInterface2();
    MyInterface2Ex.prototype.if3 = function() {}

    function F() {}
    F.prototype.m1 = "member";

    this.assertNotNull( F.fulfills );
    var err = null;
    try { F.fulfills( 1 ); } catch( ex ) { err = ex; }
    this.assertEquals( "InterfaceDefinitionError", err.name );
    err = null;
    try { F.fulfills( new F()); } catch( ex ) { err = ex; }
    this.assertEquals( "InterfaceDefinitionError", err.name );
    err = null;
    try { F.fulfills( F ); } catch( ex ) { err = ex; }
    this.assertEquals( "InterfaceDefinitionError", err.name );
    err = null;
    try { F.fulfills( MyInterface1 ); } catch( ex ) { err = ex; }
    this.assertEquals( "InterfaceDefinitionError", err.name );
    F.prototype.if1 = function() {}
    F.prototype.if2 = function() {}
    F.fulfills( MyInterface1 ); 
    F.fulfills( MyInterface1, MyInterface2 ); 
    
    function G() {}
    G.prototype = new F();
    G.prototype.if3 = function() {}

    G.fulfills( MyInterface1, MyInterface2Ex ); 
}
function FunctionTest_testGlue()
{
    this.assertUndefined( FunctionTestGlue.prototype.a );
    FunctionTestGlue.glue();
    this.assertEquals( "function", typeof( FunctionTestGlue.prototype.a ));
    
    FunctionTestGlue.x = new Object();
    FunctionTestGlue.x.FunctionTestGlueA_a = function() {};
    FunctionTestGlueA.glue( FunctionTestGlue.x );
    this.assertEquals( "function", typeof( FunctionTestGlueA.prototype.a ));

    var err = null;
    FunctionTestGlue.y = function () {};
    try { FunctionTestGlue.y.glue(); } catch( ex ) { err = ex; }
    this.assertEquals( "FunctionGluingError", err.name );

    FunctionTestGlue.z = new Object();
    FunctionTestGlue.z.FunctionTestGlueZ_11 = function() {};
    try { FunctionTestGlueZ.glue( FunctionTestGlue.z ); } catch( ex ) { err = ex; }
    this.assertEquals( "FunctionGluingError", err.name );
}
FunctionTest.prototype = new TestCase();
FunctionTest.glue();
function FunctionTestGlue() {}
function FunctionTestGlue_a() {}
function FunctionTestGlueA() {}
function FunctionTestGlueZ() {}


function ArrayTest( name )
{
    TestCase.call( this, name );
}
function ArrayTest_testPop()
{
    this.assertEquals( 4, [1,2,3,4].pop());
    var a = new Array( 1, 2, 3, 4, 5 );
    this.assertEquals( 5, a.pop());
    this.assertEquals( 4, a.length );
    a[2] = undefined;
    this.assertEquals( 4, a.pop());
    this.assertEquals( 3, a.length );
    this.assertUndefined( a.pop());
    this.assertEquals( 2, a.pop());
    this.assertEquals( 1, a.pop());
    this.assertUndefined( a.pop());
}
function ArrayTest_testPush()
{
    this.assertEquals( 4, [1,2,3].push( 4 ));
    var a = new Array();
    this.assertEquals( 3, a.push( 1, 2, 3 ));
    this.assertEquals( 3, a.length );
    this.assertEquals( 3, a.push());
    this.assertEquals( 3, a.length );
    this.assertEquals( 4, a.push( 4 ));
    this.assertEquals( 4, a.length );
    this.assertEquals( "1,2,3,4", a.toString());
}
ArrayTest.prototype = new TestCase();
ArrayTest.glue();


function StringTest( name )
{
    TestCase.call( this, name );
}
function StringTest_testTrim()
{
    this.assertEquals( "abc", "bbbabcbbb".trim( "b" ));
    var s = new String( "abc" );
    this.assertEquals( "abc", s.trim());
    s = " abc \t ";
    this.assertEquals( "abc", s.trim());
    this.assertEquals( " abc \t ", s );
    s = "123abc456";
    this.assertEquals( "abc", s.trim( "0123456789" ));
    this.assertEquals( "123abc456", s );
    s = "bbbabcbbb";
    this.assertEquals( "abc", s.trim( "b" ));
    this.assertEquals( "bbbabcbbb", s );
}
StringTest.prototype = new TestCase();
StringTest.glue();


function CallStackTest( name )
{
    TestCase.call( this, name );
}
function CallStackTest_testCtor()
{
    if( JsUtil.prototype.hasCallStackSupport )
    {
        var cs = this.f0().getStack();
        cs = this.f12().getStack();
        this.assertEquals( 10, cs.length );
        this.assertMatches( /^f9\(.*\)$/, cs.pop());
        cs = this.f12(13).getStack();
        this.assertMatches( /^f12\(.*\)$/, cs.pop());
        cs = this.f4().getStack();
        this.assertMatches( /^f4\(.*\)$/, cs[4] );
        this.assertMatches( /^CallStackTest_testCtor\(.*\)$/, cs[5] );
    }
}
function CallStackTest_testFill()
{
    if( JsUtil.prototype.hasCallStackSupport )
    {
        this.f0 = function f0( d ) { this.cs.fill(d); }

        this.cs = new CallStack();
        this.f12(13);
        this.assertMatches( /^f12\(.*\)$/, this.cs.getStack().pop());
        this.f0();
        this.assertMatches( /^f0\(.*\)$/, this.cs.getStack()[0] );
    }
}
function CallStackTest_testGetStack()
{
    if( JsUtil.prototype.hasCallStackSupport )
    {
        var cs = this.f12(13);
        this.assertEquals( 13, cs.getStack().length );
        cs = this.f0();
        this.assertEquals( 10, cs.getStack().length );
    }
}
function CallStackTest_testToString()
{
    if( JsUtil.prototype.hasCallStackSupport )
    {
        var cs = this.f4().toString().replace( /\n/g, "|" );
        this.assertTrue( cs.indexOf( "f5" ) == -1 );
        this.assertTrue( cs.indexOf( "f4" ) >= 0 );
        this.assertTrue( cs.indexOf( "testToString" ) >= 0 );
    }
}
CallStackTest.prototype = new TestCase();
CallStackTest.glue();
CallStackTest.prototype.ctor = CallStackTest;
CallStackTest.prototype.f0 = function f0(d) { return new CallStack(d); }
CallStackTest.prototype.f1 = function f1(d) { return this.f0(d); }
CallStackTest.prototype.f2 = function f2(d) { return this.f1(d); }
CallStackTest.prototype.f3 = function f3(d) { return this.f2(d); }
CallStackTest.prototype.f4 = function f4(d) { return this.f3(d); }
CallStackTest.prototype.f5 = function f5(d) { return this.f4(d); }
CallStackTest.prototype.f6 = function f6(d) { return this.f5(d); }
CallStackTest.prototype.f7 = function f7(d) { return this.f6(d); }
CallStackTest.prototype.f8 = function f8(d) { return this.f7(d); }
CallStackTest.prototype.f9 = function f9(d) { return this.f8(d); }
CallStackTest.prototype.f10 = function f10(d) { return this.f9(d); }
CallStackTest.prototype.f11 = function f11(d) { return this.f10(d); }
CallStackTest.prototype.f12 = function f12(d) { return this.f11(d); }


function PrinterWriterErrorTest( name )
{
    TestCase.call( this, name );
}
function PrinterWriterErrorTest_testAttributes()
{
    var err = new PrinterWriterError( "my message" );
    this.assertEquals( "PrinterWriterError", err.name );
    this.assertEquals( "my message", err.message );
}
PrinterWriterErrorTest.prototype = new TestCase();
PrinterWriterErrorTest.glue();


function PrinterWriterTest( name )
{
    TestCase.call( this, name );
}
function PrinterWriterTest_setUp()
{
    this.mWriter = new PrinterWriter();
    this.mWriter.mLastLine = "";
    this.mWriter._flush = function( str )
    {
        this.mLastLine = str;
    }
    this.mWriter.toString = function()
    {
        return this.mLastLine;
    }
}
function PrinterWriterTest_tearDown()
{
    delete this.mWriter;
}
function PrinterWriterTest_testClose()
{
    this.assertFalse( this.mWriter.mClosed );
    this.mWriter.close();
    this.assertTrue( this.mWriter.mClosed );
}
function PrinterWriterTest_testFlush()
{
    this.assertSame( "", this.mWriter.toString());
    this.mWriter.print( "Test it" );
    this.assertSame( "", this.mWriter.toString());
    this.mWriter.flush();
    this.assertEquals( "Test it\n", this.mWriter.toString());
    this.mWriter.close();
    var err = null;
    try { this.mWriter.flush(); } catch( ex ) { err = ex; }
    this.assertEquals( "PrinterWriterError", err.name );
}
function PrinterWriterTest_testPrint()
{
    this.mWriter.print( "Test it" );
    this.assertSame( "", this.mWriter.toString());
    this.assertEquals( "Test it", this.mWriter.mBuffer );
    this.mWriter.flush();
    this.assertEquals( "Test it\n", this.mWriter.toString());
    this.mWriter.print();
    this.mWriter.print( null );
    this.assertEquals( "Test it\n", this.mWriter.toString());
    this.mWriter.close();
    var err = null;
    try { this.mWriter.print( "again" ); } catch( ex ) { err = ex; }
    this.assertEquals( "PrinterWriterError", err.name );
}
function PrinterWriterTest_testPrintln()
{
    this.assertSame( "", this.mWriter.toString());
    this.mWriter.println( "Test it" );
    this.assertEquals( "Test it\n", this.mWriter.toString());
}
PrinterWriterTest.prototype = new TestCase();
PrinterWriterTest.glue();


function SystemWriterTest( name )
{
    TestCase.call( this, name );
}
function SystemWriterTest_testClose()
{
    var writer = new SystemWriter();
    writer._flush = function() {}
    this.assertFalse( writer.mClosed );
    writer.close();
    this.assertFalse( writer.mClosed );
}
SystemWriterTest.prototype = new TestCase();
SystemWriterTest.glue();


function StringWriterTest( name )
{
    TestCase.call( this, name );
}
function StringWriterTest_testGet()
{
    var writer = new StringWriter();
    this.assertFalse( writer.mClosed );
    writer.print( "Js" );
    writer.println( "Unit" );
    writer.print( "rocks!" );
    this.assertEquals( "JsUnit\nrocks!\n", writer.get());
    this.assertTrue( writer.mClosed );
}
StringWriterTest.prototype = new TestCase();
StringWriterTest.glue();


function HTMLWriterFilterTest( name )
{
    TestCase.call( this, name );
}
function HTMLWriterFilterTest_testFlush()
{
    var filter = new HTMLWriterFilter();
    filter.println( "Hello & Co. Test if \"5 < 6\" and \'6 > 5\' ..." );
    var str = filter.getWriter().get();
    this.assertMatches( /&amp;/, str );
    this.assertMatches( /&lt;/, str );
    this.assertMatches( /&gt;/, str );
    this.assertMatches( /&quot;/, str );
    this.assertMatches( /&apos;/, str );
    this.assertMatches( /<br>$/, str );
}
function HTMLWriterFilterTest_testGetWriter()
{
    var writer = new PrinterWriter();
    var filter = new HTMLWriterFilter( writer );
    this.assertSame( writer, filter.getWriter());
}
function HTMLWriterFilterTest_testSetWriter()
{
    var filter = new HTMLWriterFilter();
    this.assertTrue( filter.getWriter() instanceof StringWriter );
    var writer = new PrinterWriter();
    filter.setWriter( writer );
    this.assertSame( writer, filter.getWriter());
}
HTMLWriterFilterTest.prototype = new TestCase();
HTMLWriterFilterTest.glue();


function JsUtilTestSuite()
{
    TestSuite.call( this, "JsUtilTest" );
    this.addTestSuite( CallStackTest );
    this.addTestSuite( ArrayTest );
    this.addTestSuite( StringTest );
    this.addTestSuite( ErrorTest );
    this.addTestSuite( JsUnitErrorTest );
    this.addTestSuite( InterfaceDefinitionErrorTest );
    this.addTestSuite( FunctionGluingErrorTest );
    this.addTestSuite( FunctionTest );
    this.addTestSuite( PrinterWriterErrorTest );
    this.addTestSuite( PrinterWriterTest );
    this.addTestSuite( SystemWriterTest );
    this.addTestSuite( StringWriterTest );
    this.addTestSuite( HTMLWriterFilterTest );
}
JsUtilTestSuite.prototype = new TestSuite();
JsUtilTestSuite.prototype.suite = function (){ return new JsUtilTestSuite(); }

