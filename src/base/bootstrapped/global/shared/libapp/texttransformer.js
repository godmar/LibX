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

/**
 * A base class for text transformers
 * @class
 */
libx.libapp.TextTransformer = libx.core.Class.create(
    /** @lends libx.libapp.TextTransformer.prototype */{

    /**
     * Transform a text node
     *
     * @param {DOMTextNode}
     * @return {Array|null} nodes with which to replace this text node
     */
    processNode : libx.core.AbstractFunction("libx.libapp.TextTransformer.test"),

    /**
     * Read-only default list of skipped elements.
     *
     * Safe to inherit, but do not change.
     */
    skippedElements : { 
           a:        true, 
           noscript: true,
           head:     true,
           script:   true,
           style:    true,
           textarea: true,
           label:    true,
           select:   true,
           button:   true
    }
});

/**
 * A text transformer based on regular expressions.
 *
 * @class
 */
libx.libapp.RegexpTextTransformer = libx.core.Class.create(libx.libapp.TextTransformer, 
    /** @lends libx.libapp.RegexpTextTransformer.prototype */{
    /**
     * @param {RegExp} filter - a regular expression filter for this object
     */
    initialize : function (filter) {
        this.filterRegExp = filter;
    },

    /**
     * Action to be performed for each regexp match
     * Returns null if no action is to be performed.
     *
     * Returns a new DOMNode if the matched portion shall be replaced.
     *
     * Returns a pair [DOMNode, Function] to replace the matched portion
     * and calls Function subsequently.  Function may assume that the
     * replacement node has been added to the DOM, thus DOMNode.parentNode
     * will be valid.
     *
     * @param {DOMTextNode} node in which match was found
     * @param {String} matched portion
     * @return {DOMNode|null|[DOMNode, Function]} replacement for matched portion
     */
    onMatch : libx.core.AbstractFunction('libx.libapp.RegexpTextTransformer.onMatch'),

    /**
     * Transform a text node based on regular expressions.
     *
     * @param {DOMTextNode}
     * @return {Array|null} nodes with which to replace this text node
     */
    processNode : function (textNode) {
        var self = this;
        var nodeArray = [];
        var nodeText = textNode.data;

        //returns array of matches [ { match : true | false, 
        //  text: <if not matched, unmatched text.  if matched, matched text>
        //  results: <match object if match> } ]
        var processedTextArray = getMatches(nodeText);

        if (processedTextArray.length === 0)
            return null;

        //Processing matches and non-matches
        for (var ctr = 0; ctr < processedTextArray.length; ++ctr) {

            var nextNode = null;

            if ('match' in processedTextArray[ctr]) {
                nextNode = self.onMatch(textNode, processedTextArray[ctr].match);
            }

            // No match, or onmatch rejected this match
            if (nextNode == null) {
                nextNode = textNode.ownerDocument.createTextNode(processedTextArray[ctr].text);
            }

            nodeArray.push(nextNode);
        }

        return nodeArray;

        /*
         * function: getMatches
         *
         * Applies the filter and returns an array that represents the segmented string.
         *
         * parameters:
         *
         * source - source text to test
         *
         * returns:
         * array of objects
         * - match - regular expression match or undefined
         * - text  - corresponding substring of text
         *
         */
        function getMatches (source)
        {
            self.filterRegExp.lastIndex = 0;    // reset regexp

            // First test the source to see if it matches at all
            if (!self.filterRegExp.test(source))
                return [ ];

            self.filterRegExp.lastIndex = 0;

            var matchArray = [];

            var lastLastIndex;
            var match;

            lastLastIndex = 0;

            while ((match = self.filterRegExp.exec (source)) !== null) {

                // add in text to the left of match
                if (lastLastIndex < match.index) {
                    matchArray.push({ text : source.substring(lastLastIndex, match.index) });
                }

                matchArray.push({ text : match[0], match: match });

                if (self.filterRegExp.lastIndex === undefined) {
                    lastLastIndex = match.index;
                } else {
                    lastLastIndex = self.filterRegExp.lastIndex;
                }
            }

            // consider remaining, unmatched text
            if (matchArray.length > 0) {
                var subsequentText = source.substring(lastLastIndex);
                if (subsequentText !== "") {
                    matchArray.push({ text : subsequentText });
                }
            }
            return matchArray;
        }
    }
});

