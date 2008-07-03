/**
  *  Prototype (currently not functial since php script has been changed
  */
libxEnv.libxess = function ( query, type, format )
{
	var queryString = "http://libx.org/libxess/libxess.php?format=" + format + "&id=urn:" + type + ":" + query;
	var xml;
	
	var nsResolver = function( prefix ) {
		var ns = { 
			'marcxml' : 'http://www.loc.gov/MARC21/slim' 
		};
		return ns[prefix] || null;
	}
	this.get = function ()
	{
		xml = libxEnv.getXMLDocument( queryString );
	}
	
	this.getTitle = function ()
	{
		if ( !xml )
			return null;
		var titles = libxEnv.xpath.findNodes( xml, "//marcxml:datafield[@tag='245']/marcxml:subfield", null, nsResolver );
		var theTitle = "";
		for ( var i = 0; i < titles.length; i++ )
		{
			theTitle += titles[i].textContent + " ";
		}
		return theTitle;
	}
	
	this.getHoldings = function ()
	{
		if ( !xml )
			return null;
		var nodes = libxEnv.xpath.findNodes( xml, "//marcxml:datafield[@tag='852']", null, nsResolver);
		var holdings = [];
		for ( var i = 0; i < nodes.length; i++ )
		{
			var children = nodes[i].childNodes;
			var temp = {
				library: children[0].childNodes[0].nodeValue,
				location: children[1].childNodes[0].nodeValue,
				status: children[2].childNodes[0].nodeValue,
				toString: function () {
					return this.library + " status: "  + this.status;
				}
			}
			holdings.push( temp );
		}
		return holdings;
	}

};
