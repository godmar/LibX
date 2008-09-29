/**
  * Member function of libxEnv object that handles COinS (Context Object in
  * Span).  Will append a child element to the span tag that will serve as a
  * image based hyper link
  *
  * @member libxEnv
  *
  * @param {DOM node} doc document element in HTML DOM.
  * @param {handlers} array of functions that handle COinS
  * @param {is1_0} boolean whether OpenURL 0.1 is desired
  */
libxEnv.coins.handleCoins = function (doc, handlers, is1_0) {
    var coins = $("span.Z3988", doc);
    for (var i = 0; i < coins.length; i++) {
        try { // the span attribute may be malformed, if so, recover and continue with next
            var span = coins[i];
            var query = span.getAttribute('title');
            query = query.replace(/&amp;/g, "&").replace(/\+/g, "%20").split(/&/);

            var rft_book = "rft_val_fmt=info:ofi/fmt:kev:mtx:book";
            var rft_journal = "rft_val_fmt=info:ofi/fmt:kev:mtx:journal";
            var isBookOrArticle = false;
            for (var j = 0; j < query.length; j++) {
                var qj = decodeURIComponent(query[j]);

                // some 0.1 resolver (SerSol) don't like the 'url_ver=' option
                if (!is1_0 && qj.match(/^url_ver=/)) {
                    query.splice(j--, 1);
                    continue;
                }

                // remove rfr_id= if present, we substitute our own sid/rfr_id
                if (qj.match(/^rfr_id=/)) {
                    query.splice(j--, 1);
                    continue;
                }

                // this is part of the context object version, but is not included in final URL
                if (qj.match(/^ctx_ver=/)) {
                    query.splice(j--, 1);
                    continue;
                }

                if (qj == rft_book) {
                    isBookOrArticle = true;
                    if (!is1_0)
                        query[j] = "genre=book";
                    continue;
                }
                if (qj == rft_journal) {
                    isBookOrArticle = true;
                    if (!is1_0)
                        query[j] = "genre=article";
                    continue;
                }

                if (!is1_0) {
                    //convert to 0.1 unless 1.0 is given
                    //remove "rft." from beginning of attribute keys
                    qj = qj.replace(/rft\./g,"");

                    //change some attribute names
                    qj = qj.replace(/jtitle=/,"title=");
                    qj = qj.replace(/btitle=/,"title=");
                    qj = qj.replace(/rft_id=info:pmid\//,"id=pmid:");
                    qj = qj.replace(/rft_id=info:doi\//,"id=doi:");
                    qj = qj.replace(/rft_id=info:bibcode\//,"id=bibcode:");
                }

                var kv = qj.split(/=/);
                var val = kv.splice(1, 1).join("=");
                query[j] = kv[0] + '=' + encodeURIComponent(val);
            }
            if (is1_0)
                query.push("url_ver=Z39.88-2004");

            query = query.join("&");

            // handle any coins if 1.0, otherwise do only if book or article
            if (is1_0 || isBookOrArticle) {
                for (var j = 0; j < handlers.length; j++) {
                    if (handlers[j](doc, span, query))
                        break;
                }
            }
        } catch (e) {
            libxEnv.writeLog("Exception during coins processing: " +e);
        }
    }
}
