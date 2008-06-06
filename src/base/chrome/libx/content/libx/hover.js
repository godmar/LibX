
// Creates a hover box object
// doc is the current document, link is what you will add the hover box to
// and persist is to allow for a persistent link closable only by the user, not timeout
libxEnv.libxHoverBox = function ( doc, link, persist ) {
    this.doc = doc;
    this.linked = link;
    //used for a possible future persistent link
    this.persistent = persist;
    //  ====   methods of object  ====
//  add is used if you aren't specifically building for things like a cue
// if you want to add elements to a tooltip/hoverbox that will be used for
// something else, it is recommended you use this method to allow you
// easier use with that specific tooltip/hoverbox.  You may also use
// the addElement but must make sure you use the correct tooltip/hoverbox
// div
    this.add = function( linkobj )
    {
        libxEnv.addElement(this.menuDiv, linkobj);
    }
// cueHover is an easy method so that to make a tooltip for a cue, its
// clean and concise.  Use this method after initializing the hoverObject
// and everything will be taken care of.
    this.cueHover = function( )
    {
        //  First you must create the element that will have all the
        // monitors associated with it.
        var obj = doc.createElement('a');
        //  Add any objects.  In this case you will just add the title
        // of the original cue to what displays with this, you can change
        // or add more if wanted
        var text = doc.createTextNode(this.linked.title);
        //  You can change more of the attributes of the object ( obj )
        // so that it will display other things or have other behaviors.
        // in this case, the href is taken from the original cue and added
        // to the tooltip/hoverbox element in question.
        obj.href = this.linked.href;
        //  Now the text element is added to the object which will become
        // an element of the tooltip/hover box.
        obj.appendChild(text);
        //  After constructing the element to be added, you hand it off
        // to the addElement method.  This gives you easy access to add
        // and element (obj) to a specific tooltip/hoverbox (this.menuDiv)
        libxEnv.addElement( this.menuDiv, obj );
    }

    this.menuDiv = libxEnv.makeHoverBox(this.doc, this.linked);
}


// Initializer function to initialize the timeout and the hover object
libxEnv.hoverInit = function ()
{
    // give space to be used to store tooltip/hoverbox attributes
    libxEnv.HoverObject = new Object();
    // delay for how quickly the tooltip/hoverbox will disappear
    // on mouseout
    libxEnv.HoverObject.disappeardelay = 250;

}

// A method to an element to the menu
// the menu is the object, and the linkObj is the element to be added
libxEnv.addElement = function(object, linkObj)
{
    //  set mouse over to clear any hiding of the menu
    // this case takes care of the possibility of leaving the dropdown
    // part and coming back
    linkObj.onmouseover = function() { libxEnv.clearhidemenu(); };
    //  Makes the entire dropdown disspear in case of being clicked on
    linkObj.onclick = function() { libxEnv.hidemenu(linkObj); };
    //  adds the linkobj to the tooltip/hoverbox
    object.appendChild( linkObj );
}

// A way to initially make the hover box and bringing in the stylesheet for
// use by the box to allow easy modifications
libxEnv.makeHoverBox = function(doc, linkObj)
{
    // add style sheet to the page for use in building the tooltip/hoverbox
    if(doc.createStyleSheet) 
    {
        doc.createStyleSheet('chrome://libx/skin/hover.css');
    }
    else 
    {
        var newSS = doc.createElement('link');
        newSS.rel='stylesheet';
        newSS.href= "chrome://libx/skin/hover.css";
        libxEnv.xpath.findSingleXML( doc, "//head").appendChild(newSS);
    }
    // create the div to be used by the script that will act as the
    // container for all drop down menus. 
    var hoverDiv = doc.createElement('div');

    linkObj.setAttribute('hover', "hover_over");
    hoverDiv.id = 'hovermenu';

    hoverDiv.className = "hoverdiv";

    linkObj.onmouseover = function() { libxEnv.dropMenu(linkObj, hoverDiv); };

    var outside = libxEnv.xpath.findSingleXML(doc, "//body");
    outside.appendChild(hoverDiv);

    linkObj.id = 'hoverdiv';
    return hoverDiv;
}

// Function to pop the menu and prepare the closing of the menu
libxEnv.dropMenu = function (object, ele)
{
    libxEnv.clearhidemenu();
	ele.style.visibility = "visible";
    ele.display = "block";
    var dropmenuID = "hovermenu";
    
    ele.onmouseover = function() { libxEnv.clearhidemenu(); };
    
    ele.onmouseout = function() { libxEnv.hidemenu(ele); };
    object.onmouseout = function() { libxEnv.hidemenu(ele); };
    ele.onclick = function() { libxEnv.hidemenu(ele); };
    
    var totaloffset = object.offsetLeft;
    var parentElement = object.offsetParent;
    while ( parentElement != null)
    {
        totaloffset = totaloffset + parentElement.offsetLeft;
        parentElement = parentElement.offsetParent;
    }
    ele.style.left = totaloffset + 'px';
    totaloffset = object.offsetTop;
    parentElement = object.offsetParent;
    while (parentElement != null)
    {
        totaloffset = totaloffset + parentElement.offsetTop;
        parentElement = parentElement.offsetParent;
    }
    ele.style.top = totaloffset + object.offsetHeight + 'px';
}

// This function will hide the ele passed into it
libxEnv.hidemenu = function (ele)
{
    libxEnv.HoverObject.toHide = ele;
    var str_to ="var ele = libxEnv.HoverObject.toHide; ele.style.visibility='hidden';";
    libxEnv.HoverObject.delayhide = setTimeout(str_to,libxEnv.HoverObject.disappeardelay); //hide menu
}

// This function will clear the currently planned hiding
libxEnv.clearhidemenu = function ()
{
    clearTimeout(libxEnv.HoverObject.delayhide);
}

