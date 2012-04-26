#!/usr/bin/python

import copy
import imp
import os
import pickle
import sys, re, simplejson, urllib

pathinfoformat = re.compile('/([^/]*)/(.*)')

tree = None
tree_mod = 0

#
# Callable 'application' is the WSGI entry point
#
def application(env, start_response):
    ipTree = imp.load_source('ipTree', '/home/nova/public_html/libx/src/logParser/ipTree.py')
    global tree
    global tree_mod

    # get QUERY parameters
    params = dict([(urllib.unquote_plus(k), urllib.unquote_plus(v))
        for k, v in [kv.strip().split('=', 1) \
                     for kv in env['QUERY_STRING'].split('&') if '=' in kv]])

# FIX: Probably doesn't work correctly without the rewrite engine. Check on local machine.
    m = pathinfoformat.match(env['PATH_INFO'])
#    (type, urlIP) = m.groups()
    if 'ip' in params:
        ip = params['ip']
#    if urlIP != "":
#        ip = urlIP
#
    new_mod = os.path.getmtime("/home/nova/public_html/libx/src/autoedition/tree.bin")
    if new_mod > tree_mod:
        tree = pickle.load(open("/home/nova/public_html/libx/src/autoedition/tree.bin", "rb"))
        tree_mod = new_mod
    try:
        editions = copy.deepcopy(tree.inTree(ipTree.convertIP(ip)))
    except UnboundLocalError:
        ip = ''
        editions = False

    editionsOutput = []
    if editions is not False:
        while len(editions) > 0:
            editionsOutput.append(editions.pop())

    dummyanswerobject = {
        'ip': ip,
        'editions': editionsOutput,
        'tree_mod': tree_mod
    }
    headers = [('Content-Type', 'application/javascript;charset=utf-8'), \
               ('Cache-Control', 'max-age=1,must-revalidate')]

    body = simplejson.dumps(dummyanswerobject, encoding="utf-8")
    if params.has_key('callback'):
        body = params.get('callback') + "(" + body + ");"
    start_response("200 OK", headers)
    return [body]

if __name__ == '__main__':
    print "you invoked me with", sys.argv
