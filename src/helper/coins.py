#!/usr/bin/python

import urllib2, sys, datetime
from collections import defaultdict

url = sys.argv[1] if len(sys.argv) > 1 else "http://en.wikipedia.org/wiki/Libor_scandal"

print "# Retrieving COINS from", url
print "#", datetime.datetime.now()

opener = urllib2.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
response = opener.open(url)
page = response.read()

from lxml.html.soupparser import fromstring
root = fromstring(page)
for c in root.xpath('//span[@class="Z3988"]'):
    title = c.get('title')
    m = defaultdict(list)
    for kv in title.split("&"):
        k, v = kv.split("=")
        m[k].append(urllib2.unquote(v).replace("+", " "))

    for k, v in m.items():
        print k, "->", v
    print

