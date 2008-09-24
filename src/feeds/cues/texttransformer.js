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
 * Contributor(s): Arif Khokar (aikhokar@cs.vt.edu)
 *
 * ***** END LICENSE BLOCK ***** */

// work-around for non-deterministic cue file execution order
if (undefined == libxEnv.autolink)
    libxEnv.autolink =  { filterProcs: [] };

var autolink = libxEnv.autolink;

/*
 * class: FilterClass
 *
 * A base class for DOM node filters
 */
autolink.filterClass = function () {};

/*
 * function: Test
 *
 * Tests whether a node matches filter criteria.
 *
 */
autolink.filterClass.prototype.test 
= function () 
{ 
    throw new Error("Test not implemented"); 
}

/*
 * class: RegExpFilterClass
 *
 * DOMnode filter that uses regular expressions for filtering. Subclass of
 * FilterClass
 *
 * parameters:
 *
 * filter - a regular expression filter for this object
 *
 */
autolink.regExpFilterClass = function (filter) 
{
    this.filterExpression = filter;
}

autolink.regExpFilterClass.prototype = new autolink.filterClass();
autolink.regExpFilterClass.constructor = autolink.regExpFilterClass;

/*
 * function: Test
 *
 * Tests whether a node matches a regular expressoin filter criteria.
 *
 * parameter:
 *
 * source - text to run filter on
 *
 * precondition:
 *
 * filterExpression is of type RegExp
 *
 */
autolink.regExpFilterClass.prototype.test
 = function(source)
{
    return this.filterExpression.test(source);
}

/*
 * function: GetMatches
 *
 * Applies the filter and returns an array that represents the segmented
 * string where each segment is associated with a flag that indicates whether
 * it matched or not
 *
 * parameters:
 *
 * source - source text to test
 *
 * returns:
 * array of objects
 * - match - boolean value that indicates whether substring is part of match
 * - text  - substring of text
 *
 */
autolink.regExpFilterClass.prototype.getMatches
= function(source)
{
    //Set to 0 to start matching at beginning of string
    this.filterExpression.lastIndex = 0;

    var matchArray = new Array();

    //First test the source to see if it matches at all
    var found = this.test(source);
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

                lastLastIndex = this.filterExpression.lastIndex;

                if (undefined == lastLastIndex)
                    lastLastIndex = match.index;

                match = this.filterExpression.exec(source);
            }

            if (matches)
            {
                subsequentText = source.substring(lastLastIndex);
                if ("" != subsequentText)
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

/*
 * class: ISBNRegExpFilterClass
 *
 * Subclass of RegExpFilter.  The test function performs an additional RegExp
 * test
 *
 * paramters:
 *
 * filter - regular expression used for testing
 *
 */
autolink.isbnRegExpFilterClass = function (filter) 
{
    //Call the base class constructor assigning this object's filterExpression
    //property
    autolink.regExpFilterClass.call(this, filter);
}
autolink.isbnRegExpFilterClass.prototype = new autolink.regExpFilterClass();
autolink.isbnRegExpFilterClass.prototype.constructor = autolink.isbnRegExpFilterClass;

/*
 * function: BaseTest
 *
 * Set to the Test function of the RegExpFilterClass.
 */
autolink.isbnRegExpFilterClass.prototype.baseTest = autolink.regExpFilterClass.prototype.test;

/*
 * function: Test
 *
 * Invokes the RegExpFilterClass base class function Test and then runs its own filter on the source text.
 *
 * parameters:
 *
 * source - text to run filter on
 *
 * returns:
 *
 * - true if base filter matches and this filter doesn't
 * - false otherwise
 */
//Override Test so that we can implement a secondary filter
autolink.isbnRegExpFilterClass.prototype.test
= function(source)
{
    var toReturn = this.baseTest(source);

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

/*
 * class: StringFilterClass
 *
 * Subclass of FilterClass that implements filters using strings
 *
 * parameters:
 *
 * filter - string filter
 *
 */
autolink.stringFilterClass = function (filter) 
{
    this.filterExpression = filter;
}
autolink.stringFilterClass.prototype = new autolink.filterClass();
autolink.stringFilterClass.constructor = autolink.stringFilterClass;

/*
 * function: Test
 *
 * Runs the string filter on the text
 *
 * parameters:
 *
 * source - text to run filter on
 *
 * precondition:
 *
 * filter must be of type string
 */
autolink.stringFilterClass.prototype.test
= function(source)
{
    if (-1 == this.filterExpression.indexOf(source))
        return false;
    else
        return true;
}

/*
 * function: GetMatches
 *
 * Gets matches from text based on filter
 *
 * parameter:
 *
 * source - text to run filter on
 *
 */
autolink.stringFilterClass.prototype.getMatches
= function(source)
{
    throw new Error("GetMatches not implemented");
    //var matchArray = new Array();

    //First test the source to see if it matches at all
    //var found = this.test(source);
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
/*
 * class: NodeProcessorClass
 *
 * Base class for DOM node processing
 */
autolink.nodeProcessorClass = function () {}

/*
 * function: ProcessFunction
 *
 * Takes a DOM node and changes its type (not implemented)
 */
autolink.nodeProcessorClass.prototype.processFunction
= function ()
{
    throw new Error("Process function not implemented");
};

/*
 * class: AnchorNodeProcessorClass
 *
 * Creates an anchor node processor object
 *
 * parameters:
 *
 * process - a function definition that performs further processing on the
 * matched node.
 *
 */
autolink.anchorNodeProcessorClass = function (process) 
{
    this.nodeProcess = process;

    //this.processFunction 
    //    = function (match)
    //    {
    //                };

    this.currentDoc = null;
}

//Subclass from NodeProcessor
autolink.anchorNodeProcessorClass.prototype = new autolink.nodeProcessorClass();

//Set the constructor prototype property to the correct function
autolink.anchorNodeProcessorClass.prototype.constructor = autolink.anchorNodeProcessorClass;
autolink.anchorNodeProcessorClass.prototype.processFunction
= function (match)
{
    //Invoke the BaseProcessFunction
    var anchor = this.baseProcessFunction(match[0]);

    //Now handle further processing
    anchor = this.nodeProcess(match, anchor);

    return anchor;

}

/**
 * Creates the anchor element from a given string
 *
 * @param {string} text text contents of anchor node
 */
autolink.anchorNodeProcessorClass.prototype.baseProcessFunction
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

    anchor.title = "libx-autolink";

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
autolink.textTransformerClass = function (filter, processor) 
{
    this.nodeFilter = filter;
    this.nodeProcessor = processor;

    this.setCurrentDocument
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
 * @returns array of nodes or null
 * 
 * @type Array
 * 
 */
autolink.textTransformerClass.prototype.processNode
= function(node)
{
    processFunctionNullResult = false;
    //Array to store nodes
    nodeArray = new Array();

    //Get the node text
    var nodeText = node.data;

    //Send this text to the filter and see what we get
    var processedText = this.nodeFilter.getMatches(nodeText);

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
            matchedNode = this.nodeProcessor.processFunction(processedText[ctr].results);

            //If the filter returned matches, but the process function rejects the match, then
            //we just return null
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
autolink.textTransformerClass.prototype.skippedElementList 
   = { a:        true, 
       noscript: true,
       head:     true,
       script:   true,
       style:    true,
       textarea: true,
       label:    true,
       select:   true,
       button:   true};

autolink.textTransformerClass.prototype.nodeFilter
= function()
{
    throw new Error("nodeFilter not implemented");
}

autolink.textTransformerClass.prototype.nodeProcessor
= function()
{
    throw new Error("nodeProcessor not implemented");
}
