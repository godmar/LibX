var disappeardelay;
var hover_obj;

var persistent;
// gives an object to keep track of a hover_div getting ready to dissapear
function hover_object()
{
	this.delayhide;
	this.to_hide;
}
// Creates a hover box object
// doc is the current document, link is what you will add the hover box to
// and persist is to allow for a persistent link closable only by the user, not timeout
function LibXHoverBox( doc, link, persist )
{
	this.doc = doc;
	this.linked = link;
	
	//used for a possible future persistent link
	this.persistent = persist;
	// methods of object
	this.add = function( linkobj )
	{
		add_element(this.menu_div, linkobj);
		
	}
	
	//this.hover_menu = make_hover_box(doc, link_obj );
	this.menu_div = make_hover_box(this.doc, this.linked);
}


// Initializer function to initialize the timeout and the hover object
function hover_init()
{
	hover_obj = new hover_object();
	disappeardelay = 250;
}

// A method to an element to the menu
// the menu is the object, and the link_obj is the element to be added
function add_element(object, link_obj)
{
	link_obj.onmouseover = function() { clearhidemenu(doc); };
	link_obj.onclick = function() { hidemenu(doc); };
	object.appendChild( link_obj );
}

// A way to initially make the hover box and bringing in the stylesheet for
// user by the box to allow easy modifications
function make_hover_box(doc, link_obj)
{
	if(doc.createStyleSheet) 
	{
		doc.createStyleSheet('http://server/stylesheet.css');
	}
	else 
	{
		var styles = "@import url(' chrome://libx/skin/hover.css ');";
		var newSS=doc.createElement('link');
		newSS.rel='stylesheet';
		newSS.href='data:text/css,'+escape(styles);
		doc.getElementsByTagName("head")[0].appendChild(newSS);
	}
	var hover_div = doc.createElement('div');

    link_obj.setAttribute('hover', "hover_over");
    hover_div.id = 'hovermenu';

    hover_div.className = "hoverdiv";

    link_obj.onmouseover = function() { pop_it(link_obj, hover_div); };

    var outside = libxEnv.xpath.findSingle(doc, "//body");
    outside.appendChild(hover_div);

    link_obj.id = 'hoverdiv';

	var object = doc.getElementById("hover123");
	return hover_div;
}

// Function to pop the menu and prepare the closing of the menu
function pop_it(object, ele)
{
    ele.style.visibility = "visible";
	ele.display = "block";
	var dropmenuID = "hovermenu";

	ele.onmouseover = function() { clearhidemenu(); };
	ele.onmouseout = function() { hidemenu(ele); };
	object.onmouseout = function() { hidemenu(ele); };
	
	var totaloffset = object.offsetLeft;
	var parentElement = object.offsetParent;
	while (	parentElement != null)
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
	hover_obj.to_hide = ele;
	var str_to ="var ele = hover_obj.to_hide; ele.style.visibility='hidden';";
	hover_obj.delayhide = setTimeout(str_to,disappeardelay) //hide menu
}

// This function will clear the currently planned hiding
function clearhidemenu()
{
	if (hover_obj.delayhide != "undefined")
		clearTimeout(hover_obj.delayhide)
}


function ajaxMakeRequest(url_to, doc)
{
	var request;
	if( window.XMLHttpRequest )
	{
		request = new XMLHttpRequest();
		if( request.overrideMimeType )
		{
			request.overrideMimeType('text/xml');
		}
	}

	if (!request) 
	{
		alert('Giving up :( Cannot create an XMLHTTP instance');
    	return false;
	}
	request.onreadystatechange = function() { ajaxCheck(doc, request, /(\d+) results found/ , /No matches found/ ); };
	var object = doc.getElementById("hoverdiv");
	request.open('GET', object.href, true);
	request.send(null);
	
}

function ajaxCheck(doc, _request, regex, regex_2 )
{
}

