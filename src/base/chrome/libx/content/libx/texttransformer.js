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

if (undefined == libxEnv.autolink)
    libxEnv.autolink = new Object();

//Base class for filters
libxEnv.autolink.FilterClass = function () {};
libxEnv.autolink.FilterClass.prototype.Test 
= function () 
{ 
    throw new Error("Test not implemented"); 
}

libxEnv.autolink.RegExpFilterClass = function (filter) 
{
    this.filterExpression = filter;
}
libxEnv.autolink.RegExpFilterClass.prototype = new libxEnv.autolink.FilterClass();
libxEnv.autolink.RegExpFilterClass.constructor = libxEnv.autolink.RegExpFilterClass;
libxEnv.autolink.RegExpFilterClass.prototype.Test
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
libxEnv.autolink.RegExpFilterClass.prototype.GetMatches
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
libxEnv.autolink.ISBNRegExpFilterClass = function (filter) 
{
    //Call the base class constructor assigning this object's filterExpression
    //property
    libxEnv.autolink.RegExpFilterClass.call(this, filter);
}
libxEnv.autolink.ISBNRegExpFilterClass.prototype = new libxEnv.autolink.RegExpFilterClass();
libxEnv.autolink.ISBNRegExpFilterClass.prototype.constructor = libxEnv.autolink.ISBNRegExpFilterClass;
libxEnv.autolink.ISBNRegExpFilterClass.prototype.BaseTest = libxEnv.autolink.RegExpFilterClass.prototype.Test;

//Override Test so that we can implement a secondary filter
libxEnv.autolink.ISBNRegExpFilterClass.prototype.Test
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

libxEnv.autolink.StringFilterClass = function (filter) 
{
    this.filterExpression = filter;
}
libxEnv.autolink.StringFilterClass.prototype = new libxEnv.autolink.FilterClass();
libxEnv.autolink.StringFilterClass.constructor = libxEnv.autolink.StringFilterClass;
libxEnv.autolink.StringFilterClass.prototype.Test
= function(source)
{
    if (-1 == this.filterExpression.indexOf(source))
        return false;
    else
        return true;
}

libxEnv.autolink.StringFilterClass.prototype.GetMatches
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
libxEnv.autolink.NodeProcessorClass = function () {}
libxEnv.autolink.NodeProcessorClass.prototype.ProcessFunction
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
libxEnv.autolink.AnchorNodeProcessorClass = function (process) 
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
libxEnv.autolink.AnchorNodeProcessorClass.prototype = new libxEnv.autolink.NodeProcessorClass();

//Set the constructor prototype property to the correct function
libxEnv.autolink.AnchorNodeProcessorClass.prototype.constructor = libxEnv.autolink.AnchorNodeProcessorClass;

/**
 * Creates the anchor element from a given string
 *
 * @param {string} text text contents of anchor node
 */
libxEnv.autolink.AnchorNodeProcessorClass.prototype.BaseProcessFunction
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
libxEnv.autolink.TextTransformerClass = function (filter, processor) 
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
libxEnv.autolink.TextTransformerClass.prototype.ProcessNode
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
libxEnv.autolink.TextTransformerClass.prototype.skippedElementList 
   = { a:        true, 
       noscript: true,
       head:     true,
       script:   true,
       style:    true,
       textarea: true,
       label:    true,
       select:   true,
       button:   true};

libxEnv.autolink.TextTransformerClass.prototype.nodeFilter
= function()
{
    throw new Error("nodeFilter not implemented");
}

libxEnv.autolink.TextTransformerClass.prototype.nodeProcessor
= function()
{
    throw new Error("nodeProcessor not implemented");
}
