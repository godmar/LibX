
var suite = libx.testing.createUnitTestSuite("Tests for preferences",
    function () {
        libx.preferences.initialize();
        /* nothing */
        return 0;
    });

suite.addUnitTest("Test preferences 1",
    function () {
        var resourceUrl = this.baseUrl + "tests/resources/";
        var file1 = resourceUrl + "pref.xml";
        
        // initialize browser preferences
        libx.preferences.load ( {
            filename : file1,
            overwrite : false,
            base : "libx.prefs"
        } );  
        
        this.WAIT(3);
        
        // test preferences loaded from XML
        this.ASSERT_EQUAL(libx.preferences.get("libx.prefs.browser.displaypref")._type, "choice");
        this.ASSERT_UNDEFINED(libx.preferences.get("libx.prefs.invalid_preference"));
        this.ASSERT_TRUE(libx.preferences.getValue("libx.prefs.browser.autolinking", false));
        this.ASSERT_FALSE(libx.preferences.getValue("libx.prefs.browser.invalid_preference", false));
        var b = libx.preferences.get("libx.prefs.browser");
        println("b.autolinking=" + b.autolinking);
        println("b.getValue=" + b.autolinking);
        
        // test dynamically created preferences
        var prefs = libx.preferences.get("libx.prefs");
        var prefObj = prefs._addCategory({ _name: "http://libx.org/made/up/libapp/feed", _layout: "groups" });
        var cat = prefObj._addCategory({ _name: "cat1", _layout: "groups" });
        
        // boolean preference
        var pref1 = cat._addPreference({ _name: "pref1", _type: "boolean" });
        pref1._setValue(false);
        println("cat1.pref1=" + pref1.toString());
        
        // single choice preference
        var pref2 = cat._addPreference({ _name: "pref2", _type: "choice" });
        pref2._addItem({ _type: "string", _value: "item1" });
        pref2._addItem({ _type: "string", _value: "item2" });
        pref2._addItem({ _type: "string", _value: "item3" });
        this.ASSERT_TRUE(pref2._setValue("item1"));
        this.ASSERT_TRUE(pref2._setValue("item3"));
        println("cat1.pref2=" + pref2.toString());
        
        // multi choice preference
        var pref3 = cat._addPreference({ _name: "pref3", _type: "multichoice" });
        pref3._addItem({ _type: "string", _value: "item1" });
        pref3._addItem({ _type: "string", _value: "item2" });
        pref3._addItem({ _type: "string", _value: "item3" });
        pref3._addItem({ _type: "string", _value: "to_be_removed" });
        this.ASSERT_TRUE(pref3._setValue(["item1", "item3"]));
        this.ASSERT_TRUE(pref3._removeItem("to_be_removed"));
        println("cat1.pref3=" + pref3.toString());
        
        println(prefObj.toXML());
        
        //TODO: add test for save/load
       
    },
    { timeout: 30 }
);
