# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals
from datetime import datetime
import json, io, yaml

#io.open is py3 compatible (py3 has io.open as the builtin open function
#io.open doesn't work as well in < py2.7, hence this extra code
#io is preferable to codecs


# take data, create appropriate unicode, output in utf-8 encoding
# may throw an error if data was read without specifying utf-8 encoding
def writeJson(data, filename, indent=None):
	#io.open expects unicode.  To write bytes, use 'wb' mode (and remove encoding argument, since bytes have no encoding)
	#if the unicode contains non-ascii, encoding must be set
	with io.open(filename, 'w', encoding='utf-8') as jfile:
		jfile.write( json2Str( data, indent ) )

def writeJsons(data, filename):
	writeJson(data, '{}.json'.format(filename), indent=4)
	writeJson(data, '{}.min.json'.format(filename))
		
def json2Str(data, indent=None):
	# create json text from data struct
	# - when ensure_ascii=True (default), unicode becomes \u0361\u00b0 (12 separate ascii chars)
	# - due to a python 2 bug, ensure_ascii=False can cause json.dumps return either str or unicode
	dump = json.dumps(data, ensure_ascii=False, indent=indent)
	#ensure dump is unicode
	return ( unicode(dump) )

def writeFile(str, filename):
	with open(filename, "w") as text_file:
		text_file.write(str)

def readFile(filename):
	with open(filename, "r") as text_file:
		return text_file.read()
		
#read bytes as utf-8 into unicode
#load the result to get the data struct
def readJson(filename):
	with io.open(filename, 'r', encoding='utf-8') as jfile:
		unicodeRep = jfile.read()
		return json.loads(unicodeRep)
		
def readYaml(filename):
	with io.open(filename, 'r', encoding='utf-8') as jfile:
		unicodeRep = jfile.read()
		return yaml.load(unicodeRep)
		
def uPrint(str):
	if type(str) is unicode:
		print(str.encode('utf-8'))
	else:
		print(str)
		
def utf8Encode(str):
	return str.encode('utf-8')
		
def datetimeStr():
	return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
	
def dateStr():
	return datetime.utcnow().strftime("%Y-%m-%d")

def getNameToIdMap():	
	return jsonRead(r"../common/nameToIdMap.json")

def getTppNameToIdMap():	
	return jsonRead(r"../common/tppNameToIdMap.json")
	
def getAdminUsers():
	admins = []
	for user, pword in jsonRead('../common/oauth.json').iteritems():
		admins.append(user)
	return admins	

def die(msg):
	uPrint(msg)
	exit(1)
	
def getTwitchColorCodes():
	return ['0000ff', 'ff7f50', '1e90ff', '00ff7f', '9acd32', '00ff00', 'ff4500', 'ff0000', 'daa520', 'ff69b4', '5f9ea0', '54ff9f', 'd2681e', '8a2be2', 'b22222']

def getTwitchColors():
	return {'blue': '0000ff', 'coral': 'ff7f50', 'dodgerBlue': '1e90ff', 'springGreen': '00ff7f', 'yellowGreen': '9acd32', 'green': '00ff00', 'orangeRed': 'ff4500', 'red': 'ff0000', 'goldenRod': 'daa520', 'hotPink': 'ff69b4', 'cadetBlue': '5f9ea0', 'seaGreen': '54ff9f', 'chocolate': 'd2681e', 'blueViolet': '8a2be2', 'fireBrick': 'b22222'}