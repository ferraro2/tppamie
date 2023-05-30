# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals

import random, sys, json, time
paths = [r"../common"]
for path in paths:
	sys.path.insert(0, path)

#from common
import utils
from utils import uPrint

# vis pokemon specification for an unknown secrecy match Pokemon
unknownPkmn = {
	"name": "Unown", 
	"displayName": "Unknown Pokemon",
	"id": 201,
	"gender": "-",
	"form": 27,
	"ability": 25,
	"stats": {"hp": 999, "atk": 999, "sdf": 999, "spd": 999, "def": 999, "sat": 999}, 
	"moves": [150, 150, 150, 150],
	"ivs": {"hp": 0, "atk": 0, "spA": 0, "spD": 0, "spe": 0, "def": 0},
	"pp": [40, 40, 40, 40], 
	"happiness": 0,
	"setName": "unknown",
	"type1": "ghost",
	"type2": "dark"}
	
# take verbose api struct and replace with a more condense structure to be read by visualizer
def api2VisSpec(apiPkmn, instantiated=True):
	if not instantiated:
		apiPkmn = apiPkmn['data']
	pkmn = {}
	id = str(apiPkmn['species']['id'])
	if id == '0':
		pkmn = unknownPkmn
	else:
		pkmn['id'] = id
		pkmn['name'] = apiPkmn['species']['name']
		if pkmn['id'] == '29':
			pkmn['name'] = 'Nidoran-female'
		elif pkmn['id'] == '32':
			pkmn['name'] = 'Nidoran-male'
		pkmn['ivs'] = apiPkmn['ivs']
		pkmn['happiness'] = apiPkmn['happiness']
		# if a real form (nonzero) is present, assign it
		if apiPkmn['form']:
			pkmn['form'] = apiPkmn['form']
		pkmn['displayName'] = apiPkmn['displayname']
		pkmn['setName'] = apiPkmn['setname']
		if apiPkmn['shiny']:
			pkmn['shiny'] = True
		pkmn['level'] = apiPkmn['level']

		# gender, item, ability, and moves
		if instantiated:
			pkmn['gender'] = apiPkmn['gender']
			item = apiPkmn['item']
			# assign item if present
			if 'id' in item and item['id'] != 0:
				pkmn['item'] = item['id']
			# assign ability if present
			ability = apiPkmn['ability']
			if 'id' in ability and ability['id'] != 0:
				pkmn['ability'] = ability['id']
				
			moves = []
			movepp = []
			for m in apiPkmn['moves']:
				if m and m['id'] != 0:
					moves.append(m['id'])
					movepp.append(m['pp'])
					
			pkmn['moves'] = moves
			pkmn['pp'] = movepp
		else:
			# assert apiPkmn['gender'] is a list
			if not isinstance(apiPkmn['gender'], list):
				die("apiPkmn['gender'] was expected to be a list")
			# ensure nonempty (not assured)
			if len(apiPkmn['gender']) == 0:
				apiPkmn['gender'].append(None)
			# if a real gender is available, assign the first one
			firstGender = apiPkmn['gender'][0]
			if firstGender:
				pkmn['gender'] = firstGender
			
			# assert apiPkmn['item'] is a list
			if not isinstance(apiPkmn['item'], list):
				die("apiPkmn['item'] was expected to be a list")
			# assert nonempty
			if len(apiPkmn['item']) == 0:
				die("apiPkmn['item'] was expected to nonempty")
			# if a real item is available, assign the first one
			firstItem = apiPkmn['item'][0]
			if 'id' in firstItem and firstItem['id'] != 0:
				pkmn['item'] = firstItem['id']
			
			# assert apiPkmn['ability'] is a list
			if not isinstance(apiPkmn['ability'], list):
				die("apiPkmn['ability'] was expected to be a list")
			# assert nonempty
			if len(apiPkmn['ability']) == 0:
				die("apiPkmn['ability'] was expected to nonempty")
			# if a real ability is available, assign the first one
			firstAbility = apiPkmn['ability'][0]
			if 'id' in firstAbility and firstAbility['id'] != 0:
				pkmn['ability'] = firstAbility['id']
				
			# if real moves are available, assign the first move in each list
			moves = []
			movepp = []
			for moveList in apiPkmn['moves']:
				if moveList:
					firstMove = moveList[0]
					if firstMove and 'id' in firstMove and  firstMove['id'] != 0:
						moves.append(firstMove['id'])
						movepp.append(firstMove['pp'])
			pkmn['moves'] = moves
			pkmn['pp'] = movepp
			
		stats = {}
		pstats = apiPkmn['stats']
		stats['hp'] = pstats['hp']
		stats['atk'] = pstats['atk']
		stats['def'] = pstats['def']
		stats['sat'] = pstats['spA']
		stats['sdf'] = pstats['spD']
		stats['spd'] = pstats['spe']
		pkmn['stats'] = stats
		
		ptypes = apiPkmn['species']['types']
		pkmn['type1'] = ptypes[0].lower()
		if len(ptypes) > 1:
			pkmn['type2'] = ptypes[1].lower()
	return pkmn