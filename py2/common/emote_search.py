# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals

#add common src files to path
import sys

emotesPath = r"../emotes"
sys.path.insert(0, emotesPath)

from utils import *
import emotes

limitedMap = emotes.getLimitedMap()
fullMap = emotes.getFullMap()

def main():
	#get name to Id map
	map = emotes.getNameToIdMap()
	
	test1(map)

	
def getEmotes_v1(msg, map):
	found = {}
	#indices where whitespace was found
	w = [-1] + [i for i, chr in enumerate(msg) if chr == ' '] + [len(msg)]
	#print(w)
	for i in range(0, len(w) - 1):
		beg = w[i] + 1 
		end = w[i+1]
		word = msg[ beg : end ]
		#print("<{}> ".format(word), end="")
		if word in map:
			id = map[word]
			if id in found:
				found[id] += ["{}-{}".format(beg, end-1)]
			else:
				found[id] = ["{}-{}".format(beg, end-1)]
			
	#print()
	results = "/".join( "{}:{}".format(id, ",".join(loc)) for id, loc in found.iteritems() )
	#print(results)
	return results
	

def getEmotes_v2(msg, map):
	found = {}
	beg = 0
	end = 0
	word = ""
	for c in msg + " ":
		if c != ' ':
			word += c
			end += 1
		else:
			if len(word) > 0 and word in map:				
				id = map[word]
				if id not in found:
					found[id] = []
				found[id] += ["{}-{}".format(beg, end-1)]
				
			word = ""
			end += 1
			beg = end
	results = "/".join( "{}:{}".format(id, ",".join(loc)) for id, loc in found.iteritems() )
	#print(results)
	return results
		
def testEmoteVersions(msg, map):
	res = getEmotes_v1(msg, map)
	res2 = getEmotes_v2(msg, map)
	
	#for comparing both methods
	if res != res2:
		print("Matches returned different results: |{}|\n\tResult 1: {}\n\tResult 2: {}\n".format(msg, res, res2).encode('utf-8'))
		exit()
	else:
		#print("Success: {}\n\tMatched to: {}\n".format(msg, res))
		pass
	return res

def getLimitedEmotes(msg):
	return getEmotes_v2(msg, limitedMap)
	
def getFullEmotes(msg):
	return getEmotes_v2(msg, fullMap)

def testEmotes(msg):
	getLimitedEmotes(msg)
	getFullEmotes(msg)
	
def test1():
	testEmotes("Can you spot the Kappa hidden here?")
	testEmotes("Kappa 1 Kappa 2 Kappafalse Kappa 3 Kappa? DansGame PogChamp3 EleGiggle")
	testEmotes(" Kappa 1 Kappa 2 Kappafalse Kappa 3 Kappa? DansGame PogChamp3 EleGiggle ")
	testEmotes("    Kappa 1 Kappa 2 Kappafalse Kappa 3 Kappa? DansGame PogChamp3 EleGiggle")
	testEmotes("Kappa 1 Kappa 2 Kappafalse Kappa 3 Kappa? DansGame PogChamp3 EleGiggle    ")
	testEmotes("   Kappa 1 Kappa 2 Kappafalse Kappa 3 Kappa? DansGame PogChamp3 EleGiggle    ")



if __name__ == "__main__":
    main()