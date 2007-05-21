
// Creates a hover box object
// doc is the current document, link is what you will add the hover box to
// and persist is to allow for a persistent link closable only by the user, not timeout
libxEnv.libxHoverBox = function ( doc, link, persist ) {
    this.doc = doc;
    this.linked = link;
    //used for a possible future persistent link
    this.persistent = persist;
    // methods of object
    this.add = function( linkobj )
    {
        libxEnv.addElement(this.menuDiv, linkobj);
    }
    this.cueHover = function( _title )
    {
        var obj = doc.createElement('a');
        var text = doc.createTextNode('Search ISBN');
        obj.href = this.linked.href;
        obj.appendChild(text);
        libxEnv.addElement( this.menuDiv, obj );
        var obj2 = doc.createElement('a');
        var text2 = doc.createTextNode('Search by Title');
        obj2.appendChild(text2);
        libxEnv.addElement( this.menuDiv, obj2 );
    }

    this.menuDiv = libxEnv.makeHoverBox(this.doc, this.linked);
}


// Initializer function to initialize the timeout and the hover object
libxEnv.hoverInit = function ()
{
    libxEnv.HoverObject = new Object();
    libxEnv.HoverObject.disappeardelay = 250;

}

// A method to an element to the menu
// the menu is the object, and the linkObj is the element to be added
libxEnv.addElement = function(object, linkObj)
{
	
    linkObj.onmouseover = function() { libxEnv.clearhidemenu(); };
    linkObj.onclick = function() { libxEnv.hidemenu(linkObj); };
    object.appendChild( linkObj );
}

// A way to initially make the hover box and bringing in the stylesheet for
// user by the box to allow easy modifications
libxEnv.makeHoverBox = function(doc, linkObj)
{
    if(doc.createStyleSheet) 
    {
        doc.createStyleSheet('chrome://libx/skin/hover.css');
    }
    else 
    {
        var newSS = doc.createElement('link');
        newSS.rel='stylesheet';
        newSS.href= "chrome://libx/skin/hover.css";
        libxEnv.xpath.findSingle( doc, "//head").appendChild(newSS);
    }
    var hoverDiv = doc.createElement('div');

    linkObj.setAttribute('hover', "hover_over");
    hoverDiv.id = 'hovermenu';

    hoverDiv.className = "hoverdiv";

    linkObj.onmouseover = function() { libxEnv.dropMenu(linkObj, hoverDiv); };

    var outside = libxEnv.xpath.findSingle(doc, "//body");
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
    ele.style.left = totaloffset;
    totaloffset = object.offsetTop;
    parentElement = object.offsetParent;
    while (parentElement != null)
    {
        totaloffset = totaloffset + parentElement.offsetTop;
        parentElement = parentElement.offsetParent;
    }
    ele.style.top = totaloffset + object.offsetHeight;
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