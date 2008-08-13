//Base class for filters
function Filter() {}
Filter.prototype.Test 
= function () 
{ 
    throw new Error("Test not implemented"); 
}

function RegExpFilter(filter) 
{
    this.filterExpression = filter;
}
RegExpFilter.prototype = new Filter();
RegExpFilter.constructor = RegExpFilter;
RegExpFilter.prototype.Test
 = function(source)
{
    return this.filterExpression.test(source);
}

/**
 * Applies the filter and returns an array that represents the segmented
 * string where each segment is associated with a flag that indicates whether
 * it matched or not
 *
 * @param {string} source text to test
 * @returns Array of objects that contain flags associated with substrings of
 * text
 * @type {Array}
 */
RegExpFilter.prototype.GetMatches
= function(source)
{
    //Set to 0 to start matching at beginning of string
    this.filterExpression.lastIndex = 0;

    var matchArray = new Array();

    //First test the source to see if it matches at all
    var found = this.Test(source);
    this.filterExpression.lastIndex = 0;

    matches = false;

    if (found)
    {
        //Check if the global flag is set.  If it is, this loop is necessary.
        //Otherwise, just execute it once.
        if (this.filterExpression.global)
        {
            lastLastIndex = 0;

            match = this.filterExpression.exec(source);

            while (null != match)
            //for (match = null, lastLastIndex = 0; (match = this.filterExpression.exec(source));)
            {
                matches = true;

                previousText = source.substring(lastLastIndex, match.index);

                if ("" != previousText)
                {
                    previousObj = { match : false, text : previousText };

                    matchArray.push(previousObj);
                }

                //The results member holds the original array returned by RegExp.exec
                matchedObj = { match: true, text : match[0], results: match };

                matchArray.push(matchedObj);

                lastLastIndex = match.lastIndex;

                match = this.filterExpression.exec(source);
            }

            if (matches)
            {
                subsequentText = source.substring(lastLastIndex);
                if ("" != previousText)
                {
                    subsequentObj = { match: false, text : subsequentText };
                    matchArray.push(subsequentObj);
                }
            }
        }
        else
        {
            match = this.filterExpression.exec(source);

            previousText = source.substring(0, match.index);

            subsequentText = source.substring(match.index + match[0].length);

            if ("" != previousText)
                matchArray.push({ match: false, text: previousText});

            matchArray.push({ match: true, text: match[0], results: match});

            if ("" != subsequentText)
                matchArray.push({ match: false, text: subsequentText});
        }
    }
    return matchArray;
}

//Subclass of RegExpFilter.  The test function performs an additional RegExp
//test
function ISBNRegExpFilter (filter) 
{
    //Call the base class constructor assigning this object's filterExpression
    //property
    RegExpFilter.call(this, filter);
}
ISBNRegExpFilter.prototype = new RegExpFilter();
ISBNRegExpFilter.prototype.constructor = ISBNRegExpFilter;
ISBNRegExpFilter.prototype.BaseTest = RegExpFilter.prototype.Test;

//Override Test so that we can implement a secondary filter
ISBNRegExpFilter.prototype.Test
= function(source)
{
    var toReturn = this.BaseTest(source);

    //We want to check whether the source matches with a US phone number
    if (toReturn)
    {
        var phoneRegExp = /\d{3}-\d{3}-?\d{4}/ig;

        var phoneMatch = phoneRegExp.test(source);

        if (phoneMatch)
            toReturn = false;
    }
    return toReturn;
}

function StringFilter(filter) 
{
    this.filterExpression = filter;
}
StringFilter.prototype = new Filter();
StringFilter.constructor = StringFilter;
StringFilter.prototype.Test
= function(source)
{
    if (-1 == this.filterExpression.indexOf(source))
        return false;
    else
        return true;
}

StringFilter.prototype.GetMatches
= function(source)
{
    throw new Error("GetMatches not implemented");
    //var matchArray = new Array();

    //First test the source to see if it matches at all
    //var found = this.Test(source);
    //var startIndex = 0;
    //var index = 0;

    //if (found)
    //{
    //    while (index < index + source.length
    //           || -1 != index)
    //    {
    //        startIndex = index;
    //        index = source.indexOf(filterExpression, startIndex);

    //        beforeString = "";

    //        if (0 < index)
    //            beforeString = source.substring(0, index);

    //        matchString = filterExpression;

    //        if ("" != beforeString)
    //            matchArray.push(match : false, text : beforeString);

    //        matchArray.push(match : true, text : matchString);
    //    }

    //    //Now get the remaining text at the end
    //    if (startIndex < index - 1)
    //    {
    //        afterString = source.substring(startIndex, index);
    //        matchArray.push(match : false, text : afterString);
    //    }
    //}
}


//Implementation of node processing.  Takes input (what matched the
//filter) and modifies it
function NodeProcessor() {}
NodeProcessor.prototype.ProcessFunction
= function ()
{
    throw new Error("Process function not implemented");
};

/**
 * @constructor Creates an anchor node processor object
 *
 * @param {Function} process - a function definition that performs
 * further processing on the matched node.
 */
function AnchorNodeProcessor(process) 
{
    this.NodeProcess = process;

    this.ProcessFunction 
        = function (match)
        {
            //Invoke the BaseProcessFunction
            var anchor = this.BaseProcessFunction(match[0]);

            //Now handle further processing
            anchor = this.NodeProcess(match, anchor);

            return anchor;
        };

    this.currentDoc = null;
}

//Subclass from NodeProcessor
AnchorNodeProcessor.prototype = new NodeProcessor();

//Set the constructor prototype property to the correct function
AnchorNodeProcessor.prototype.constructor = AnchorNodeProcessor;

/**
 * Creates the anchor element from a given string
 *
 * @param {string} text text contents of anchor node
 */
AnchorNodeProcessor.prototype.BaseProcessFunction
= function(text)
{
    var anchor = this.currentDoc.createElement("A");
    var anchorText = this.currentDoc.createTextNode(text);
    anchor.appendChild(anchorText);

    //Also apply the style
    anchor.style.borderBottom 
        = libxEnv.getUnicharPref("libx.autolinkstyle", 
                                 libxEnv.options.autolinkstyle);

    //Set the class name
    anchor.className = "libx-autolink";

    return anchor;
};

//=============================================================================
//=============================================================================
//=============================================================================

/**
 * @constructor Handles processing of text nodes for purposes such as "autolinking."
 *
 * @parameter processor - handles processing node
 * @parameter filter - handles filtering node
 */
function TextTransformer(filter, processor) 
{
    this.nodeFilter = filter;
    this.nodeProcessor = processor;

    this.SetCurrentDocument
        = function(currentDoc)
        {
            this.currentDoc = currentDoc;
            this.nodeProcessor.currentDoc = currentDoc;
        }
}

/**
 * Handles text node processing.  Takes a text node and makes
 * modifications.
 *
 * @param {DOMnode} text node to process
 *
 * @returns null or Parent node
 * 
 * @type Object 
 * 
 */
TextTransformer.prototype.ProcessNode
= function(node)
{
    processFunctionNullResult = false;
    //Array to store nodes
    nodeArray = new Array();

    //Get the node text
    var nodeText = node.data;

    //Send this text to the filter and see what we get
    var processedText = this.nodeFilter.GetMatches(nodeText);

    //If there are no matches, then just return
    if (0 == processedText.length)
        return null;

    //Otherwise, handle processing matches and non-matches
    for (ctr = 0; ctr < processedText.length; ++ctr)
    {
        //If this is a non-match, just create a text node
        if (false == processedText[ctr].match)
        {
            unmatchedNode = this.currentDoc.createTextNode(processedText[ctr].text);
            nodeArray.push(unmatchedNode);
        }
        //If this is a match, handle further processing of node
        else if (true == processedText[ctr].match)
        {
            matchedNode = this.nodeProcessor.ProcessFunction(processedText[ctr].results);

            if (null == matchedNode)
            {
                processFunctionNullResult = true;
                break;
            }

            nodeArray.push(matchedNode);
        }
    }

    if (true == processFunctionNullResult)
    {
        //Discard results
        nodeArray = null;
    }
    return nodeArray;
}

//A list of element names to be skipped by the transformer
TextTransformer.prototype.skippedElementList 
   = { a:        true, 
       noscript: true,
       head:     true,
       script:   true,
       style:    true,
       textarea: true,
       label:    true,
       select:   true,
       button:   true};

TextTransformer.prototype.nodeFilter
= function()
{
    throw new Error("nodeFilter not implemented");
}

TextTransformer.prototype.nodeProcessor
= function()
{
    throw new Error("nodeProcessor not implemented");
}
