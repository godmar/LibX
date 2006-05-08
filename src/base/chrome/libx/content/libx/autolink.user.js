/*
 * This code is partially taken from Jesse Ruderman's autolink GM script; 
 * see below for License and Acknowledgement
 *
 * Changes made: 
 * Rewrote DFS search using stack.
 * Fixed recursive Textnode insertion bug.
 */
function libxAutoLink(window, document, filters, rightaway) {

// ==UserScript==
// @name          AutoLink
// @namespace     http://www.squarefree.com/userscripts
// @description   Turns plain text URLs, email addresses, bug numbers, ISBNs, and US phone numbers into links. You can add new filters if you know how to use JavaScript regular expressions.
// ==/UserScript==

/*

  Included filters:

    * Plain text link
    * Email address
    * Bug number (links to bugzilla.mozilla.org)
    * Bug number with comment number
    * ISBN (links to Amazon)
    * US Phone number (creates a callto: link for Skype)

  Features:

    * You can add new filters if you know how to use JavaScript regular expressions.
    * Works even on pages with dynamic content, such as Gmail.
    * Avoids slowing down Firefox.  (Calls setTimeout after working for a while.)
    * Avoids creating self-links.

  Warnings:

    * This triggers a memory leak bug in Firefox (bug 241518).
    * This triggers a dataloss bug in Firefox when editing long Wikipedia pages (bug 315997)

  Author: Jesse Ruderman - http://www.squarefree.com/

  Test page: http://www.squarefree.com/userscripts/test-pages/autolink-test.html

  License: MPL, GPL, LGPL.

  Version history:

    2005-05-25 00:30: Fixed a bug where inserting a leaf made AutoLink re-examine 
                      the entire document from that leaf on.  This slowed down
                      the DHTML at http://www.tiddlywiki.com/, for example.

    2005-05-23 00:20: Use better ISBN regexp from Phil Ringnalda.
                      Exclude "Invite foo@bar.com to Gmail" fake links on Gmail.

    2005-05-22 05:30: Make skipping work correctly.

    2005-05-22 05:00: Use fewer deprecated features of regular expressions.  See
                        http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:RegExp and
                        http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Deprecated_Features

    2005-05-22 01:00: Initial release. See http://www.squarefree.com/2005/05/22/autolink/.

*/


// const timeBefore = new Date();


/***********************************
 *             Filters             *
 ***********************************/

/*

  I encourage you to create new filters in your copy of AutoLink. 

  Filters have three fields:

   * name (string)
       Used for tooltip on created links, e.g. "Link added by AutoLink filter: Plain Text Links".
       Used for class attribute of created links, e.g. "autolink autolink-plain-text-links".

   * regexp (regular expression)
       The entire text matching the regular expression will be linked.
       Must be global (/g).
       May be case-insensitive (/i).

   * href (function)
       Arguments: |match|, an output of regexp.exec.  (May also treat RegExp.leftContext, etc. as inputs.)
       Returns: The URL to be used for a link, or |null| to cancel link creation.
       Must not use filter.regexp, but may use other regular expressions.
    
  This regular expression reference might be useful:
  http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:RegExp
  
  If multiple filters match a string, the first filter will win.

*/


/*
const filters = [
  {
    name: "Plain text link",
    regexp: /https?\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!]/g,
    href: function(match) { return match[0]; }
  },
  {
    name: "Email address",
    regexp: /[a-z0-9_\-+=.]+@[a-z0-9\-]+(\.[a-z0-9-]+)+/ig,
    href: function(match) { return "mailto:" + match[0]; }
  },
  {
    name: "Bug number with comment number",
    regexp: /bug \#?(\d+) comment \#?(\d+)/ig,
    href: function(match) { return "https://bugzilla.mozilla.org/show_bug.cgi?id=" + match[1] + "#c" + match[2]; }
  },
  {
    name: "Bug number",
    regexp: /bug \#?(\d+)/ig,
    href: function(match) { return "https://bugzilla.mozilla.org/show_bug.cgi?id=" + match[1]; }
  },
  {
    name: "ISBN --> Amazon",
    regexp: /ISBN( number)?:? \#?((\d(-)?){9}[\dx])/ig,
    href: function(match) { return "http://www.amazon.com/exec/obidos/ASIN/" + alphanumerics(match[2]); }
  },
  {
    name: "US phone number --> Skype",
    regexp: /((\(\d{3}\)[\s-]?)|(\d{3}(\s|-)))\d{3}[\s-]\d{4}/g,
    href: function(match) { return "callto:+1 " + digits(match[0]); }
  }
];


/***********************************
 *  Helper functions for filters   *
 ***********************************/

function digits(s)
{
  return s.replace(/[^0-9]/g, "");
}

function alphanumerics(s)
{
  return s.replace(/[^0-9a-z]/ig, "");
}


/***********************************
 *           Link styling          *
 ***********************************/
    
/*

  You can make links generated by AutoLink look different from normal links
  by editing styleLink below and/or by setting up user style sheet rules.
  
  Example: on squarefree.com, make autolinked plain text links orange. (Firefox trunk only.)
  
    @-moz-document domain(squarefree.com) { 
      .autolink-plain-text-link { color: orange ! important; }
    }
      
*/

function styleLink(a, filter)
{
  //a.style.borderBottom = "1px solid orange";
  a.style.borderBottom = nsPreferences.getLocalizedUnicharPref(
                "libx.autolinkstyle", "1px dotted");
}

/***********************************
 *      When and where to run      *
 ***********************************/

var moddingDOM = false;

function init(rightaway)
{
  document.addEventListener("DOMNodeInserted", nodeInserted, false);
  if (rightaway)
    go(document.body);
  else
    window.setTimeout(go, 100, document.body);
}

// This makes it work at Gmail.
// 20% performance penalty on a plain text file with a link on almost every line.
// Tiny performance penalty on pages with few automatically added links.
function nodeInserted(e)
{
  // our own modifications should not trigger this.
  // (we dont want our regular expression objects getting confused)
  // (we want better control over when we recurse)
  
  //GM_log("Inserted: " + e.target);
  
  if (!moddingDOM && e.target.nodeType != 3)
    go(e.target);
}


/***********************************
 *          DOM traversal          *
 ***********************************/


/*

  This script uses manual DOM traversal, in an iterative way without a stack!
  -- original code was broken, fixed to use a stack.

  Advantages of snapshot XPath:
    * Much less code
    * 20-40% faster
    * May be possible to get another speed boost by including the regexp in the XPath expression - http://www.developer.com/xml/article.php/10929_3344421_3
    * All the cool people are using it
  
  Advantages of manual DOM traversal:
    * Lets us stop+continue (snapshot xpath doesn't let us)
    * Lets us modify DOM in strange ways without worrying.
    * Easier to control which elements we recurse into.

*/


// Ignore all children of these elements.
const skippedElements = { 
  a:        true, // keeps us from screwing with existing links. keeps us from recursing to death :)
  noscript: true, // noscript has uninterpreted, unshown text children; dont waste time+sanity there.
  head:     true,
  script:   true,
  style:    true,
  textarea: true,
  label:    true,
  select:   true,
  button:   true
}

const gmail = (window.location.host == "mail.google.com");

function skipChildren(node)
{
  if (node.tagName)  // !
  {
    if (skippedElements[node.tagName.toLowerCase()]) {
      return true;
    }
    
    if (gmail) {
      if (node.className == "ac") // gmail autocomplete (fake dropdown)
        return true;
      if (node.className == "ilc sxs") // invite foo to gmail (fake link/button)
        return true;
    }
  }

  return false;
}


function go(traversalRoot)
{
  var m;
  
  // Ensure we are not already in a forbidden element.
  for (m = traversalRoot; m != undefined; m = m.parentNode) {
    if (!m || skipChildren(m)) {
      return;
    }
  }

  // work around bug, or in case previous user scripts did crazy stuff
  traversalRoot.normalize();

  // this part rewritten from original scripts to use 
  // more straightforward stack-based DFS
  function dolinkify(dfs_stack) {
    var maxcnt = 25;    // do 25 nodes at a time
    var cnt = 0;
    var q;
    while (cnt++ < maxcnt && dfs_stack.length > 0) {
      var n = dfs_stack.pop();
      if (n.nodeType == 3) {    // text node
        if ((q = runFiltersOnTextNode(n))) {
          // if there were changes, run filters again on the nodes returned
          dfs_stack = dfs_stack.concat(q);
        }
        continue;
      }
      if (skipChildren(n))
        continue;

      for (var i = 0; i < n.childNodes.length; i++)
        dfs_stack.push(n.childNodes.item(i));
    }
    if (dfs_stack.length > 0) { 
      // continue in 20ms
      setTimeout(dolinkify, 20, dfs_stack);
    }
  }
  dolinkify([traversalRoot]);
}

/***********************************
 *         Running filters         *
 ***********************************/

// runFiltersOnTextNode
// Return: node at which to continue traversal, or |null| to mean no changes were made.

function runFiltersOnTextNode(node)
{
  // Too many variables.  Good hint that I need to split this function up :P
  var source, j, regexp, match, lastLastIndex, k, filter, href, anyChanges; // things
  var used, unused, firstUnused, lastUnused, a, parent, nextSibling; // nodes
  
  source = node.data;
  
  anyChanges = false;

  // runFiltersOnTextNode has its own do-too-much-at-once avoider thingie.
  // assumption: if there is one text node with a lot of matches,
  // it is more important to finish quickly than be transparent.
  // (e.g. plain text file FULL of links)
  // assumption: 40 * 100 = 140.
  k=0;
  
  for (j = 0; filter = filters[j]; ++j) {
    regexp = filter.regexp;
    
    if (regexp.test(source)) {

      parent = node.parentNode;
      nextSibling = node.nextSibling;

      
      regexp.lastIndex = 0;
      firstUnused = null;
      
      // Optimization from the linkify that came with Greasemonkey(?):
      // instead of splitting a text node multiple times, take advantage
      // of global regexps and substring.

      for (match = null, lastLastIndex = 0; k < 40 && (match = regexp.exec(source)); ) {
      
        // this should happen first, so RegExp.foo is still good :)
        href = genLink(filter, match); 
        
        if (href != null && href != location.href) { 
          ++k;

          unused = document.createTextNode(source.substring(lastLastIndex, match.index));
          if (!anyChanges) {
            anyChanges = true;
            parent.removeChild(node);
            firstUnused = unused;
            moddingDOM = true;
          }
          parent.insertBefore(unused, nextSibling);

          used = document.createTextNode(match[0]);
  
          a = document.createElement("A");
          a.setAttribute('href', href);
          a.setAttribute('title', "LibX AutoLink: " + filter.name);
          a.className = "libx-autolink";
  
          styleLink(a, filter);
  
          a.appendChild(used);
          parent.insertBefore(a, nextSibling);
          
          lastLastIndex = regexp.lastIndex;
        }

      }

      if (anyChanges) {
        lastUnused = document.createTextNode(source.substring(lastLastIndex));
        parent.insertBefore(lastUnused, nextSibling);
        moddingDOM = false;
        return [parent];        // tell caller to repeat entire node
      }
      
      return null;
    }
  }
  return null;
}

function genLink(filter, match)
{
  try {
    return filter.href(match); 
  }
  catch(er) {
    return "data:text/plain,Error running AutoLink function for filter: " + encodeURIComponent(filter.name) + "%0A%0A" + encodeURIComponent(er);
  }
}

if (rightaway)
    init(rightaway);
else
    window.addEventListener("load", function () { init(false); }, false);

}
