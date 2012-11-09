/*! jQuery v@1.8.1 jquery.com | jquery.org/license */
/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/


var Mustache = function() {
  var regexCache = {};
  var Renderer = function() {};

  Renderer.prototype = {
    otag: "{{",
    ctag: "}}",
    pragmas: {},
    buffer: [], 
    pragmas_implemented: {
      "IMPLICIT-ITERATOR": true
    },
    context: {},

    render: function(template, context, partials, in_recursion) {
      // reset buffer & set context
      if(!in_recursion) {
        this.context = context;
        this.buffer = []; // TODO: make this non-lazy
      }

      // fail fast
      if(!this.includes("", template)) {
        if(in_recursion) {
          return template;
        } else {
          this.send(template);
          return;
        }
      }

      // get the pragmas together
      template = this.render_pragmas(template);

      // render the template
      var html = this.render_section(template, context, partials);

      // render_section did not find any sections, we still need to render the tags
      if (html === false) {
        html = this.render_tags(template, context, partials, in_recursion);
      }

      if (in_recursion) {
        return html;
      } else {
        this.sendLines(html);
      }
    },

    /*
      Sends parsed lines
    */
    send: function(line) {
      if(line !== "") {
        this.buffer.push(line);
      }
    },

    sendLines: function(text) {
      if (text) {
        var lines = text.split("\n");
        for (var i = 0; i < lines.length; i++) {
          this.send(lines[i]);
        }
      }
    },

    /*
      Looks for %PRAGMAS
    */
    render_pragmas: function(template) {
      // no pragmas
      if(!this.includes("%", template)) {
        return template;
      }

      var that = this;
      var regex = this.getCachedRegex("render_pragmas", function(otag, ctag) {
        return new RegExp(otag + "%([\\w-]+) ?([\\w]+=[\\w]+)?" + ctag, "g");
      });

      return template.replace(regex, function(match, pragma, options) {
        if(!that.pragmas_implemented[pragma]) {
          throw({message:
            "This implementation of mustache doesn't understand the '" +
            pragma + "' pragma"});
        }
        that.pragmas[pragma] = {};
        if(options) {
          var opts = options.split("=");
          that.pragmas[pragma][opts[0]] = opts[1];
        }
        return "";
        // ignore unknown pragmas silently
      });
    },

    /*
      Tries to find a partial in the curent scope and render it
    */
    render_partial: function(name, context, partials) {
      name = this.trim(name);
      if(!partials || partials[name] === undefined) {
        throw({message: "unknown_partial '" + name + "'"});
      }
      if(typeof(context[name]) != "object") {
        return this.render(partials[name], context, partials, true);
      }
      return this.render(partials[name], context[name], partials, true);
    },

    /*
      Renders inverted (^) and normal (#) sections
    */
    render_section: function(template, context, partials) {
      if(!this.includes("#", template) && !this.includes("^", template)) {
        // did not render anything, there were no sections
        return false;
      }

      var that = this;

      var regex = this.getCachedRegex("render_section", function(otag, ctag) {
        // This regex matches _the first_ section ({{#foo}}{{/foo}}), and captures the remainder
        return new RegExp(
          "^([\\s\\S]*?)" +         // all the crap at the beginning that is not {{*}} ($1)

          otag +                    // {{
          "(\\^|\\#)\\s*(.+)\\s*" + //  #foo (# == $2, foo == $3)
          ctag +                    // }}

          "\n*([\\s\\S]*?)" +       // between the tag ($2). leading newlines are dropped

          otag +                    // {{
          "\\/\\s*\\3\\s*" +        //  /foo (backreference to the opening tag).
          ctag +                    // }}

          "\\s*([\\s\\S]*)$",       // everything else in the string ($4). leading whitespace is dropped.

        "g");
      });


      // for each {{#foo}}{{/foo}} section do...
      return template.replace(regex, function(match, before, type, name, content, after) {
        // before contains only tags, no sections
        var renderedBefore = before ? that.render_tags(before, context, partials, true) : "",

        // after may contain both sections and tags, so use full rendering function
            renderedAfter = after ? that.render(after, context, partials, true) : "",

        // will be computed below
            renderedContent,

            value = that.find(name, context);

        if (type === "^") { // inverted section
          if (!value || that.is_array(value) && value.length === 0) {
            // false or empty list, render it
            renderedContent = that.render(content, context, partials, true);
          } else {
            renderedContent = "";
          }
        } else if (type === "#") { // normal section
          if (that.is_array(value)) { // Enumerable, Let's loop!
            renderedContent = that.map(value, function(row) {
              return that.render(content, that.create_context(row), partials, true);
            }).join("");
          } else if (that.is_object(value)) { // Object, Use it as subcontext!
            renderedContent = that.render(content, that.create_context(value),
              partials, true);
          } else if (typeof value === "function") {
            // higher order section
            renderedContent = value.call(context, content, function(text) {
              return that.render(text, context, partials, true);
            });
          } else if (value) { // boolean section
            renderedContent = that.render(content, context, partials, true);
          } else {
            renderedContent = "";
          }
        }

        return renderedBefore + renderedContent + renderedAfter;
      });
    },

    /*
      Replace {{foo}} and friends with values from our view
    */
    render_tags: function(template, context, partials, in_recursion) {
      // tit for tat
      var that = this;



      var new_regex = function() {
        return that.getCachedRegex("render_tags", function(otag, ctag) {
          return new RegExp(otag + "(=|!|>|\\{|%)?([^\\/#\\^]+?)\\1?" + ctag + "+", "g");
        });
      };

      var regex = new_regex();
      var tag_replace_callback = function(match, operator, name) {
        switch(operator) {
        case "!": // ignore comments
          return "";
        case "=": // set new delimiters, rebuild the replace regexp
          that.set_delimiters(name);
          regex = new_regex();
          return "";
        case ">": // render partial
          return that.render_partial(name, context, partials);
        case "{": // the triple mustache is unescaped
          return that.find(name, context);
        default: // escape the value
          return that.escape(that.find(name, context));
        }
      };
      var lines = template.split("\n");
      for(var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(regex, tag_replace_callback, this);
        if(!in_recursion) {
          this.send(lines[i]);
        }
      }

      if(in_recursion) {
        return lines.join("\n");
      }
    },

    set_delimiters: function(delimiters) {
      var dels = delimiters.split(" ");
      this.otag = this.escape_regex(dels[0]);
      this.ctag = this.escape_regex(dels[1]);
    },

    escape_regex: function(text) {
      // thank you Simon Willison
      if(!arguments.callee.sRE) {
        var specials = [
          '/', '.', '*', '+', '?', '|',
          '(', ')', '[', ']', '{', '}', '\\'
        ];
        arguments.callee.sRE = new RegExp(
          '(\\' + specials.join('|\\') + ')', 'g'
        );
      }
      return text.replace(arguments.callee.sRE, '\\$1');
    },

    /*
      find `name` in current `context`. That is find me a value
      from the view object
    */
    find: function(name, context) {
      name = this.trim(name);

      // Checks whether a value is thruthy or false or 0
      function is_kinda_truthy(bool) {
        return bool === false || bool === 0 || bool;
      }

      var value;
      
      // check for dot notation eg. foo.bar
      if(name.match(/([a-z_]+)\./ig)){
        var childValue = this.walk_context(name, context);
        if(is_kinda_truthy(childValue)) {
          value = childValue;
        }
      }
      else{
        if(is_kinda_truthy(context[name])) {
          value = context[name];
        } else if(is_kinda_truthy(this.context[name])) {
          value = this.context[name];
        }
      }

      if(typeof value === "function") {
        return value.apply(context);
      }
      if(value !== undefined) {
        return value;
      }
      // silently ignore unkown variables
      return "";
    },

    walk_context: function(name, context){
      var path = name.split('.');
      // if the var doesn't exist in current context, check the top level context
      var value_context = (context[path[0]] != undefined) ? context : this.context;
      var value = value_context[path.shift()];
      while(value != undefined && path.length > 0){
        value_context = value;
        value = value[path.shift()];
      }
      // if the value is a function, call it, binding the correct context
      if(typeof value === "function") {
        return value.apply(value_context);
      }
      return value;
    },

    // Utility methods

    /* includes tag */
    includes: function(needle, haystack) {
      return haystack.indexOf(this.otag + needle) != -1;
    },

    /*
      Does away with nasty characters
    */
    escape: function(s) {
      s = String(s === null ? "" : s);
      return s.replace(/&(?!\w+;)|["'<>\\]/g, function(s) {
        switch(s) {
        case "&": return "&amp;";
        case '"': return '&quot;';
        case "'": return '&#39;';
        case "<": return "&lt;";
        case ">": return "&gt;";
        default: return s;
        }
      });
    },

    // by @langalex, support for arrays of strings
    create_context: function(_context) {
      if(this.is_object(_context)) {
        return _context;
      } else {
        var iterator = ".";
        if(this.pragmas["IMPLICIT-ITERATOR"]) {
          iterator = this.pragmas["IMPLICIT-ITERATOR"].iterator;
        }
        var ctx = {};
        ctx[iterator] = _context;
        return ctx;
      }
    },

    is_object: function(a) {
      return a && typeof a == "object";
    },

    is_array: function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    },

    /*
      Gets rid of leading and trailing whitespace
    */
    trim: function(s) {
      return s.replace(/^\s*|\s*$/g, "");
    },

    /*
      Why, why, why? Because IE. Cry, cry cry.
    */
    map: function(array, fn) {
      if (typeof array.map == "function") {
        return array.map(fn);
      } else {
        var r = [];
        var l = array.length;
        for(var i = 0; i < l; i++) {
          r.push(fn(array[i]));
        }
        return r;
      }
    },

    getCachedRegex: function(name, generator) {
      var byOtag = regexCache[this.otag];
      if (!byOtag) {
        byOtag = regexCache[this.otag] = {};
      }

      var byCtag = byOtag[this.ctag];
      if (!byCtag) {
        byCtag = byOtag[this.ctag] = {};
      }

      var regex = byCtag[name];
      if (!regex) {
        regex = byCtag[name] = generator(this.otag, this.ctag);
      }

      return regex;
    }
  };

  return({
    name: "mustache.js",
    version: "0.4.0-dev",

    /*
      Turns a template and view into HTML
    */
    to_html: function(template, view, partials, send_fun) {
      var renderer = new Renderer();
      if(send_fun) {
        renderer.send = send_fun;
      }
      renderer.render(template, view || {}, partials);
      if(!send_fun) {
        return renderer.buffer.join("\n");
      }
    }
  });
}();



(function(window) {
  var $;
  
  var css = '.summon-search-box-widget{-webkit-border-radius:1em;-moz-border-radius:1em;border-radius:1em;padding:2px;color:#4d4d4d;line-height:14px;font-family:Helvetica,Arial;font-size:12px}.summon-search-box-widget a{color:#214e95;text-decoration:none}.summon-search-box-widget a:hover{text:decoration:underline}.summon-search-box-widget .widget-header{padding:.25em 1em;background-color:#fff;-webkit-border-top-left-radius:1em;-moz-border-top-left-radius:1em;border-top-left-radius:1em;-webkit-border-top-right-radius:1em;-moz-border-top-right-radius:1em;border-top-right-radius:1em}.summon-search-box-widget .widget-search{background-color:#c5c5c5;padding:13px 6px 6px 9px}.summon-search-box-widget .widget-search .widget-submit-container{float:right}.summon-search-box-widget .widget-search .widget-title{padding-bottom:6px;color:#4d4d4d;font-weight:bold}.summon-search-box-widget .widget-search .widget-field-container{overflow:hidden;padding-right:6px}.summon-search-box-widget .widget-search .widget-field{border:1px solid #fff;width:100%}.summon-search-box-widget .widget-empty{font-size:11px}.summon-search-box-widget .widget-didyoumean{margin-bottom:17px}.summon-search-box-widget .widget-didyoumean .widget-label{color:#be1e2d}.summon-search-box-widget .widget-didyoumean a{color:#214e95;font-weight:bold;font-style:italic}.summon-search-box-widget .widget-highlight{font-weight:bold;color:#4d4d4d}.summon-search-box-widget .widget-infobox ul,.summon-search-box-widget .widget-infobox li{list-style-type:none;margin:0;padding:0}.summon-search-box-widget .widget-results{padding:14px 10px 10px 10px;background-color:#fff;overflow-y:auto;padding-bottom:10px;position:relative}.summon-search-box-widget .widget-results .widget-noresults{margin-bottom:17px;color:#959595}.summon-search-box-widget .widget-results .widget-noresults .widget-query{color:#4d4d4d;font-weight:bold}.summon-search-box-widget .widget-results .widget-result{font-size:11px;overflow:hidden;margin-bottom:2px;position:relative;padding-top:12px}.summon-search-box-widget .widget-results .widget-result .widget-metadata{overflow:hidden;padding-left:7px}.summon-search-box-widget .widget-results .widget-result .widget-thumbnail{float:left;position:relative;margin-left:5px;width:48px;height:48px}.summon-search-box-widget .widget-results .widget-result .widget-thumbnail img{position:absolute;top:0;left:-5px;width:48px;height:48px;z-index:1}.summon-search-box-widget .widget-results .widget-result .widget-thumbnail .widget-theme-fulltext{position:absolute;top:-8px;right:0;z-index:2}.summon-search-box-widget .widget-results .widget-result .widget-title{font-size:13px}.summon-search-box-widget .widget-footer{font-size:11px;color:#4d4d4d;height:24px;line-height:24px;padding-left:9px}'
  var sprites = '.widget-sprite { background: url("{{widget_host}}/widgets/sprites/sprite_b39ab3307a3073e64b6fb917574a9416b55fed25.png") no-repeat; }.widget-format_generic_lg { width: 40px; height: 40px; background-position: 0 -0px; }.widget-format_software_lg { width: 40px; height: 40px; background-position: 0 -40px; }.widget-format_library_guide_lg, .widget-format_research_guide_lg { width: 40px; height: 40px; background-position: 0 -80px; }.widget-format_photograph_lg { width: 40px; height: 40px; background-position: 0 -120px; }.widget-format_audio_book_cassette_lg { width: 40px; height: 40px; background-position: 0 -160px; }.widget-format_music_cd_lg, .widget-format_album_lg, .widget-format_compact_disc_lg { width: 40px; height: 40px; background-position: 0 -200px; }.widget-format_reference_lg { width: 40px; height: 40px; background-position: 0 -240px; }.widget-format_artwork_lg, .widget-format_art_lg { width: 40px; height: 40px; background-position: 0 -280px; }.widget-format_video_cd_lg, .widget-format_dvd_lg { width: 40px; height: 40px; background-position: 0 -320px; }.widget-format_audio_recording_lg, .widget-format_streaming_audio_lg { width: 40px; height: 40px; background-position: 0 -360px; }.widget-format_reference2_lg { width: 40px; height: 40px; background-position: 0 -400px; }.widget-format_music_lg, .widget-format_music_recording_lg { width: 40px; height: 40px; background-position: 0 -440px; }.widget-format_archival_material_lg { width: 40px; height: 40px; background-position: 0 -480px; }.widget-format_music_score_lg { width: 40px; height: 40px; background-position: 0 -520px; }.widget-format_web_resource_lg { width: 40px; height: 40px; background-position: 0 -560px; }.widget-format_poem_lg { width: 40px; height: 40px; background-position: 0 -600px; }.widget-format_artifact_lg, .widget-format_interactive_media_lg { width: 40px; height: 40px; background-position: 0 -640px; }.widget-format_computer_file_lg { width: 40px; height: 40px; background-position: 0 -680px; }.widget-format_ebook_lg { width: 40px; height: 40px; background-position: 0 -720px; }.widget-format_government_lg, .widget-format_government_document_lg { width: 40px; height: 40px; background-position: 0 -760px; }.widget-format_music_lp_lg { width: 40px; height: 40px; background-position: 0 -800px; }.widget-format_video_cassette_lg { width: 40px; height: 40px; background-position: 0 -840px; }.widget-format_kit_lg { width: 40px; height: 40px; background-position: 0 -880px; }.widget-format_patent_lg { width: 40px; height: 40px; background-position: 0 -920px; }.widget-format_special_collection_lg { width: 40px; height: 40px; background-position: 0 -960px; }.widget-format_microfilm_lg, .widget-format_film_lg { width: 40px; height: 40px; background-position: 0 -1000px; }.widget-format_audio_book_cd_lg { width: 40px; height: 40px; background-position: 0 -1040px; }.widget-format_newspaper_lg, .widget-format_newspaper_article_lg { width: 40px; height: 40px; background-position: 0 -1080px; }.widget-format_manuscript_lg { width: 40px; height: 40px; background-position: 0 -1120px; }.widget-format_dissertation_lg { width: 40px; height: 40px; background-position: 0 -1160px; }.widget-format_mixed_lg { width: 40px; height: 40px; background-position: 0 -1200px; }.widget-format_map_lg { width: 40px; height: 40px; background-position: 0 -1240px; }.widget-format_video_recording_lg, .widget-format_streaming_video_lg { width: 40px; height: 40px; background-position: 0 -1280px; }.widget-format_book_review_lg { width: 40px; height: 40px; background-position: 0 -1320px; }.widget-format_data_cd_lg { width: 40px; height: 40px; background-position: 0 -1360px; }.widget-format_course_reading_lg { width: 40px; height: 40px; background-position: 0 -1400px; }.widget-format_unknown_lg { width: 40px; height: 40px; background-position: 0 -1440px; }.widget-format_conference_lg, .widget-format_market_research_lg { width: 40px; height: 40px; background-position: 0 -1480px; }.widget-format_realia_lg { width: 40px; height: 40px; background-position: 0 -1520px; }.widget-format_journal_lg, .widget-format_journal_article_lg, .widget-format_ejournal_lg { width: 40px; height: 40px; background-position: 0 -1560px; }.widget-format_report_lg { width: 40px; height: 40px; background-position: 0 -1600px; }.widget-format_book_lg { width: 40px; height: 40px; background-position: 0 -1640px; }.widget-format_cd_rom_lg { width: 40px; height: 40px; background-position: 0 -1680px; }.widget-theme-fulltext { width: 22px; height: 18px; background-position: 0 -1720px; }'

  var templates = {
    widget: '<div class="summon-search-box-widget">  <div class="widget-header">    <img src="{{logo}}" />  </div>  <div class="widget-search">    <div class="widget-title">{{title}}</div>    <div class="widget-box">      <form method="get" action="{{url}}/search">        <input name="utf8" type="hidden" value="&#x2713;" />        <div class="widget-submit-container">          <input type="submit" value="{{searchbutton_text}}" class="widget-submit" />        </div>        <div class="widget-field-container">          <input type="text" class="widget-field" name="s.q" autocomplete="off" />        </div>      </form>    </div>  </div>  <div class="widget-results">    <p>Submit a query to see search results.</p>  </div>  <div class="widget-footer">    Powered by Summon&trade;  </div></div>'
  }

  var widget = null
  var options = {
    id: null,
    url: '',
    advanced: false,
    expand: false,  // not supported yet
    suggest: false,
    tagline: false,
    searchbutton_text: 'Search',
    colors: {},
    style: { searchButton: 'website' },
    size: 'auto',
    q: "",
    params: {
      "s.ho": "t",
      "s.role": "authenticated"
    }
  }
  var hard = {
    delay: 650
  }

  function style(css, name) {
    var head = $('head'), el = $('<style />'), found = false
    if (name) {
      head.find('style').each(function(i, s) {
        if ($(s).attr('summon-name') == name) {
          found = true
          return
        }
      })
      if (found) return
    }
    el = document.createElement('style')
    if (name) { el.setAttribute('summon-name', name) }
    if ('styleSheet' in el) { // IE
      head.get(0).appendChild(el)
      el.styleSheet.cssText = css
    } else {
      el = $(el).html(css).appendTo(head)
    }
  }

  function parseUrl(url) {
    var a = document.createElement('a')
    a.href = url
    return a
  }
  
  function widgetUrl() {
    var el = $(options.id)
    return parseUrl(el.data('url') ? el.data('url') : el.attr('src'))
  }
  
  function SearchWidget(o) {
    o = o || {}
    $ = o['jQuery'];
    var p = $.extend({}, options.params, o.params)
    options = $.extend({}, options, o, hard, {params: p})
    
    // update colors for tagline and text?
    var customCss = "",
        prefixCss = " " + options.id + " "
        
    if (options.style.header_color) {
      customCss += prefixCss + ".widget-header { background-color: " + options.style.header_color + "; }"
    }
    if (options.style.results_color) {
      customCss += prefixCss + ".widget-results { background-color: " + options.style.results_color + "; }"
    }

    if (options.style.title_color) {
      customCss += prefixCss + ".widget-title { color: " + options.style.title_color + "; }"
    }
    if (options.style.link_color) {
      customCss += prefixCss + "a { color: " + options.style.link_color + "; }"
    }
    if (options.style.width == "fixed") {
      customCss += prefixCss + "{ width: 250px !important; }"
    }
    if (options.style.width == "fluid") {
      customCss += prefixCss + "{ width: 100% !important; }"
    }

    var url = widgetUrl()
    options.url = url.protocol + '//' + url.host
    options.ajaxUrl = $(options.id).data('ajax-url')
    sprites = sprites.replace(/\{\{widget_host\}\}/g, options.url)

    style(css, 'summon-search-box-widget')
    style(sprites, 'summon-search-box-widget-sprites')
    style(customCss)
    
    widget = $(Mustache.to_html(templates.widget, options))
    widget.attr('id', options.id.replace('#', ''))
    $(options.id).replaceWith(widget)
    
    if (options.params["q"].length) {
      $('.widget-field').val(options.params["q"])
      search()
    }

    // hook up searching
    widget = $(options.id)
    widget.find('form').on('submit', function(e) {
      e.preventDefault()
      search()
    })
  }

  function search() {
    widget.find('.widget-results').html('<div class="widget-loading">Loading..</div>')
    var params = $.extend({"s.q": widget.find('.widget-field').val(), "format": "searchwidget"}, options.params)
    $.getJSON(options.ajaxUrl + '?', $.param(params, true) + "&callback=?", function(json) {
      widget.find('.widget-results').html(json.results)
    })
  }

  window.SummonSearchWidget = SearchWidget
})(this)
;
