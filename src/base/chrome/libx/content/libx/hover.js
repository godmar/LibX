
// gives an object to keep track of a hoverDiv getting ready to dissapear
function hoverObject()
{
    this.disappeardelay
    this.delayhide;
    this.toHide;
}
// Creates a hover box object
// doc is the current document, link is what you will add the hover box to
// and persist is to allow for a persistent link closable only by the user, not timeout
function libxHoverBox( doc, link, persist )
{
    this.doc = doc;
    this.linked = link;
    //used for a possible future persistent link
    this.persistent = persist;
    // methods of object
    this.add = function( linkobj )
    {
        addElement(this.menuDiv, linkobj);
    }
    this.cueHover = function( _title )
    {
        var obj = doc.createElement('a');
        var text = doc.createTextNode('Search ISBN');
        obj.href = this.linked.href;
        obj.appendChild(text);
        addElement( this.menuDiv, obj );
        var obj2 = doc.createElement('a');
        var text2 = doc.createTextNode('Search by Title');
        obj2.appendChild(text2);
        addElement( this.menuDiv, obj2 );
    }

    this.menuDiv = makeHoverBox(this.doc, this.linked);
}


// Initializer function to initialize the timeout and the hover object
function hoverInit()
{
    libxEnv.HoverObject = new hoverObject();
    libxEnv.HoverObject.disappeardelay = 250;
	
}

// A method to an element to the menu
// the menu is the object, and the linkObj is the element to be added
function addElement(object, linkObj)
{
	
    linkObj.onmouseover = function() { clearhidemenu(doc); };
    linkObj.onclick = function() { hidemenu(doc); };
    object.appendChild( linkObj );
}

// A way to initially make the hover box and bringing in the stylesheet for
// user by the box to allow easy modifications
function makeHoverBox(doc, linkObj)
{
    if(doc.createStyleSheet) 
    {
        doc.createStyleSheet('http://server/stylesheet.css');
    }
    else 
    {
        var styles = "@import url(' chrome://libx/skin/hover.css ');";
        var newSS = doc.createElement('link');
        newSS.rel='stylesheet';
        newSS.href='data:text/css,'+escape(styles);
        doc.getElementsByTagName("head")[0].appendChild(newSS);
    }
    var hoverDiv = doc.createElement('div');

    linkObj.setAttribute('hover', "hover_over");
    hoverDiv.id = 'hovermenu';

    hoverDiv.className = "hoverdiv";

    linkObj.onmouseover = function() { dropMenu(linkObj, hoverDiv); };

    var outside = libxEnv.xpath.findSingle(doc, "//body");
    outside.appendChild(hoverDiv);

    linkObj.id = 'hoverdiv';

    var object = doc.getElementById("hover123");
    return hoverDiv;
}

// Function to pop the menu and prepare the closing of the menu
function dropMenu(object, ele)
{
    ele.style.visibility = "visible";
    ele.display = "block";
    var dropmenuID = "hovermenu";
    ele.onmouseover = function() { clearhidemenu(); };
    ele.onmouseout = function() { hidemenu(ele); };
    object.onmouseout = function() { hidemenu(ele); };
    ele.onclick = function() { ele.style.visibility='hidden'; };
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
function hidemenu(ele)
{
    libxEnv.HoverObject.toHide = ele;
    var str_to ="var ele = libxEnv.HoverObject.toHide; ele.style.visibility='hidden';";
    libxEnv.HoverObject.delayhide = setTimeout(str_to,libxEnv.HoverObject.disappeardelay) //hide menu
}

// This function will clear the currently planned hiding
function clearhidemenu()
{
    if (libxEnv.HoverObject.delayhide != "undefined")
        clearTimeout(libxEnv.HoverObject.delayhide)
}

