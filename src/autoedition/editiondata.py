#!/usr/bin/python

import MySQLdb
import re
import simplejson
import sys
import urllib

pathinfoformat = re.compile('/([^/]*)/(.*)')

#
# Callable 'application' is the WSGI entry point
#
def application(env, start_response):
    # get QUERY parameters
    params = dict([(urllib.unquote_plus(k), urllib.unquote_plus(v))
        for k, v in [kv.strip().split('=', 1) \
                     for kv in env['QUERY_STRING'].split('&') if '=' in kv]])
    
    m = pathinfoformat.match(env['PATH_INFO'])
    (type, url_edition) = m.groups()
    if 'edition' in params:
        edition = params['edition']
    if url_edition != '':
        edition = url_edition

    db = MySQLdb.connect(host="localhost", user="root", passwd="sqlroot", db="libxeb")
    cursor = db.cursor()
    cursor.execute("""
    SELECT editionInfo.editionId, editionInfo.shortDesc, GROUP_CONCAT(editionMaintainer.email separator ', ')
       FROM editionInfo INNER JOIN editionMaintainer
         ON editionInfo.editionId = editionMaintainer.editionId
       WHERE editionInfo.isPublic = 1 AND editionInfo.editionId = %s
""", edition)
    results = []
    for row in cursor:
        results.append(row)

    dummyanswerobject = {
        'edition': edition,
        'results': results
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
