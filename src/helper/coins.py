#!/usr/bin/python

import urllib2, sys

# http://en.wikipedia.org/wiki/Libor_scandal
url = sys.argv[1]

opener = urllib2.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
response = opener.open(url)
page = response.read()

from lxml.html.soupparser import fromstring
root = fromstring(page)
for c in root.xpath('//span[@class="Z3988"]'):
    title = c.get('title')
    for kv in title.split("&"):
        k, v = kv.split("=")
        print k, urllib2.unquote(v)
    print


