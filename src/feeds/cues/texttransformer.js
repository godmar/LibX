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
autolink.filterClass.prototype.test = function () 
{ 
    throw new Error("Test not implemented"); 
};

/*
 * class: regExpFilterClass
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
};

//Subclass regExpFilterClass from filterClass
autolink.regExpFilterClass.prototype = new autolink.filterClass();

/*
 * function: test
 *
 * Tests whether a node matches a regular expression filter criteria.
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
autolink.regExpFilterClass.prototype.test = function (source)
{
    return this.filterExpression.test(source);
};

/*
 * function: getMatches
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
 * - text  - corresponding substring of text
 *
 */
autolink.regExpFilterClass.prototype.getMatches = function (source)
{
    //Set to 0 to start matching at beginning of string
    this.filterExpression.lastIndex = 0;

    var matchArray = [];

    //First test the source to see if it matches at all
    var found = this.test(source);
    this.filterExpression.lastIndex = 0;

    var matches = false;

    var lastLastIndex;
    var match;
    var previousText;
    var previousObj;
    var matchedObj;
    var subsequentText;

    if (found)
    {
        //Check if the global flag is set.  If it is, this loop is necessary.
        //Otherwise, just execute it once.
        if (this.filterExpression.global)
        {
            lastLastIndex = 0;

            match = this.filterExpression.exec(source);

            while (match !== null)
            {
                matches = true;

                previousText = source.substring(lastLastIndex, match.index);

                if (previousText !== "")
                {
                    previousObj = { match : false, text : previousText };

                    matchArray.push(previousObj);
                }

                //The results member holds the original array returned by RegExp.exec
                matchedObj = { match: true, text : match[0], results: match };

                matchArray.push(matchedObj);

                lastLastIndex = this.filterExpression.lastIndex;

                if (lastLastIndex === undefined)
                {
                    lastLastIndex = match.index;
                }

                match = this.filterExpression.exec(source);
            }

            if (matches)
            {
                subsequentText = source.substring(lastLastIndex);
                if (subsequentText !== "")
                {
                    var subsequentObj = { match: false, text : subsequentText };
                    matchArray.push(subsequentObj);
                }
            }
        }
        else
        {
            match = this.filterExpression.exec(source);

            previousText = source.substring(0, match.index);

            subsequentText = source.substring(match.index + match[0].length);

            if (previousText !== "")
            {
                matchArray.push({ match : false, text : previousText});
            }

            matchArray.push({ match : true, text : match[0], results : match});

            if (subsequentText !== "")
            {
                matchArray.push({ match: false, text: subsequentText});
            }
        }
    }
    return matchArray;
};

/*
 * class: isbnRegExpFilterClass
 *
 * Subclass of regExpFilter.  The test function performs an additional RegExp
 * test
 *
 * parameters:
 *
 * filter - regular expression used for testing
 *
 */
autolink.isbnRegExpFilterClass = function (filter) 
{
    if (!(filter instanceof RegExp))
    {
        throw ("filter must be an instance of the RegExp object");
    }

    //Call the base class constructor assigning this object's filterExpression
    //property
    autolink.regExpFilterClass.call(this, filter);
};

//Subclass isbnRegExpFilterClass from regExpFilterClass
autolink.isbnRegExpFilterClass.prototype = new autolink.regExpFilterClass();

/*
 * function: test
 *
 * Invokes the regExpFilterClass base class function test and then runs its own
 * filter on the source text.
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
autolink.isbnRegExpFilterClass.prototype.test = function (source)
{
    //Call the base class' test function
    var toReturn = autolink.regExpFilterClass.prototype.test.call(this, source);

    //We want to check whether the source matches with a US phone number
    if (toReturn)
    {
        var phoneRegExp = /\d{3}-\d{3}-?\d{4}/ig;

        var phoneMatch = phoneRegExp.test(source);

        if (phoneMatch)
        {
            toReturn = false;
        }
    }
    return toReturn;
};

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
    if (typeof filter !== "string" && !(filter instanceof String))
    {
        throw ("filter must be an instance of String or of type string");
    }

    this.filterExpression = filter;
};

autolink.stringFilterClass.prototype = new autolink.filterClass();

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
autolink.stringFilterClass.prototype.test = function (source)
{
    var toReturn = true;

    if (this.filterExpression.indexOf === -1)
    {
        toReturn = false;
    }

    return toReturn;
};

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
autolink.stringFilterClass.prototype.getMatches = function (source)
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
};

/*
 * class: NodeProcessorClass
 *
 * Base class for DOM node processing
 */
autolink.nodeProcessorClass = function () {};

/*
 * function: processFunction
 *
 * abstract method (meant to be implemented in subclasses)
 */
autolink.nodeProcessorClass.prototype.processFunction = function (currentDoc, match)
{
    throw new Error("nodeProcessorClass.processFunction not implemented");
};

/*
 * function: baseProcessFunction
 *
 * abstract method (meant to be implemented in subclasses)
 */
autolink.nodeProcessorClass.prototype.baseProcessFunction = function ()
{
    throw new Error("nodeProcessorClass.baseProcessFunction not implemented");
};

/*
 * function: customProcessFunction
 *
 * abstract method (meant to be implemented in subclasses)
 */
autolink.nodeProcessorClass.prototype.customProcessFunction = function () {};

/*
 * class: anchorNodeProcessorClass
 *
 * Creates an anchor node processor object
 *
 * parameters:
 *
 * process - a optional function definition that performs further processing on
 * the matched node.  See <anchorNodeProcessorClass.baseProcessFunction> for
 * what's done before <anchorNodeProcessorClass.customProcessFunction> is invoked.
 *
 */
autolink.anchorNodeProcessorClass = function (process) 
{
    //We don't want to set this.customProcessFunction to undefined
    if (process !== undefined)
    {
        this.customProcessFunction = process;
    }
};

//Subclass from NodeProcessor
autolink.anchorNodeProcessorClass.prototype = new autolink.nodeProcessorClass();

/*
 * function: processFunction
 *
 * calls the baseProcessFunction and customProcessFunction for this object
 * instance
 *
 * parameters:
 * match - string of text to process
 *
 * returns:
 * anchor DOM node
 *
 */
autolink.anchorNodeProcessorClass.prototype.processFunction = function (currentDoc, match)
{
    //Invoke the BaseProcessFunction
    var anchor = this.baseProcessFunction(currentDoc, match[0]);

    //Now handle further processing
    anchor = this.customProcessFunction(match, anchor);

    return anchor;
};


/*
 * function: baseProcessFunction
 *
 * Handles creating an anchor node from text and setting
 * a few basic attributes to default values
 *
 * parameters: 
 * text - text contents of anchor node
 *
 */
autolink.anchorNodeProcessorClass.prototype.baseProcessFunction = function (currentDoc, text)
{
    var anchor = currentDoc.createElement("A");
    var anchorText = currentDoc.createTextNode(text);
    anchor.appendChild(anchorText);

    //Also apply the style
    anchor.style.borderBottom 
        = libxEnv.getUnicharPref("libx.autolinkstyle", 
                                 libxEnv.options.autolinkstyle);

    //Set the class name
    anchor.className = "libx-autolink";

    //Set the default title
    anchor.title = "libx-autolink";

    return anchor;
};

/**
 * class: textTransformerClass
 *
 * Handles processing of text nodes for purposes such as "autolinking."
 *
 * parameters:
 * processor - handles processing node
 * filter    - handles filtering node
 */
autolink.textTransformerClass = function (transformer)
{
    this.nodeFilter = transformer.filter;
    this.nodeProcessor = transformer.processor;
};

/**
 * function: processNode
 * 
 * Handles text node processing.  Takes a text node and makes
 * modifications.
 *
 * parameters:
 *
 * node - DOM text node to process
 *
 * returns: 
 *
 * array of nodes or null
 */
autolink.textTransformerClass.prototype.processNode = function (node)
{
    var nodeArray = [];
    var nodeText = node.data;
    var currentDoc = node.ownerDocument;

    //returns array of matches [ { match : true | false, 
    //  text: <if not matched, unmatched text.  if matched, matched text>
    //  results: <match object if match> } ]
    var processedTextArray = this.nodeFilter.getMatches(nodeText);

    if (processedTextArray.length === 0)
    {
        return null;
    }

    //Processing matches and non-matches
    for (var ctr = 0; ctr < processedTextArray.length; ++ctr)
    {
        var nextNode = null;

        //If this is a match, handle further processing of node
        if (processedTextArray[ctr].match)
        {
            nextNode = this.nodeProcessor.processFunction(currentDoc, processedTextArray[ctr].results);

            //If the process function rejects this match, we create a text node
            //and try again with the next match (if any)
            if (nextNode === null)
            {
                nextNode = currentDoc.createTextNode(processedTextArray[ctr].text);
            }
        }
        //If this is a non-match, just create a text node
        else
        {
            nextNode = currentDoc.createTextNode(processedTextArray[ctr].text);
        }

        nodeArray.push(nextNode);
    }

    return nodeArray;
};

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
       button:   true
     };
