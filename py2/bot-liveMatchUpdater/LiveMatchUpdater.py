 # -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals
import sys, urllib2, traceback
import re, json, time, pprint, urllib2, random

import sys
sys.path.insert(0, r"../")

#from common
from common import utils, pkmnUtils, sioRoutines
from common.twitch_bot import TwitchBot

import logging, logging.config


logging.config.dictConfig(utils.readYaml('logging.yaml'))
logger = logging.getLogger(__name__)

pp = pprint.PrettyPrinter(indent=4)

announcePhrases = [' Match visualizer', 'Match overview']


class LiveMatchUpdater(TwitchBot):

	def __init__(self, host, port, channels, nick, pword, **args):
		TwitchBot.__init__(self, host, port, channels, nick, pword, **args)
		self.setMute('pw')
		self.nextIsTokenMatch = False
		self.matchGimmick = False
		self.setIrcLoggers(['all'])

	def run(self):
		TwitchBot.run(self)

	#handler methods
	def onConnectStatus(self, status):
		logger.info(status.msg())
		if status.code() == 'accept':
			logger.info('Fetching current match on script startup.')
			self.newMatchSpec()

	def onUnmatched(self, rawMsg):
		logger.info("[UNMATCHED] {}".format(rawMsg))

	def onTick(self):
		pass

	def onAll(self, rawMsg):
		self.logs['all'].info(rawMsg)

	def onPriv(self, twitchMsg):
		msgTimeStr = utils.datetimeStr()
		self.priv(twitchMsg, msgTimeStr)

	def priv(self, twitchMsg, msgTimeStr):
		sender = twitchMsg.sender
		text = twitchMsg.text
		if sender == 'tpp':
			if 'break has started' in text:
				sioRoutines.emit('visualizer', "load blank match")
				sioRoutines.emit('visualizer', "state change", "break started")
			if 'about to begin' in text:
				sioRoutines.emit('visualizer', "load blank match")
				sioRoutines.emit('visualizer', "state change", "impending match")
			elif 'next match are' in text:
				self.newMatchSpec(announce=True)
			elif 'match starts in' in text:
				sioRoutines.emit('visualizer', 'feed notice', text)
			elif 'has just begun' in text:
				#reload pokmon for gimmicks, such as secrecy etc.
				if self.gimmick:
					time.sleep(.1)
					self.newMatchSpec()
				sioRoutines.emit('visualizer', 'feed notice', 'The match has begun!')

	def newMatchSpec(self, announce=False):
		try:
			response = self.fetchCurrentMatchPage()
		except urllib2.HTTPError as e:
			logger.warning('API failed to deliver match.\n\tHTTP status code: {}\n\tReason: {}'.format(e.code, e.reason))
		except urllib2.URLError as e:
			logger.warning('API failed to deliver match.\nReason: {}'.format(e.reason))
		else:
			rawMatch = self.extractRawMatch(response)

			visMatch = self.genVisMatchSpec(rawMatch)

			self.gimmick = False if visMatch['gimmick'] == 'normal' else True

			if visMatch['teams']:
				# pp.pprint(visMatch)
				self.emitMatchSpec(visMatch)
				logger.info('Match successfully fetched and emitted.')
				self.logs['all'].info(rawMatch)
				if announce:
					self.announceMatch(rawMatch, visMatch)
			else:
				logger.info('Teams not available yet.')
				if announce:
					logger.error("Warn- teams not available on announced match")

	def fetchCurrentMatchPage(self):
		url = 'https://twitchplayspokemon.tv/api/current_match'
		# user_agent = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64)'
		user_agent = 'Mozilla/5.0 (Windows NT 6.2; rv:9.0.1) Gecko/20100101 Firefox/9.0.1'
		# values = {}
		headers = {'User-Agent': user_agent}
		# data = urllib.urlencode(values)
		# req = urllib2.Request(getUrl)
		req = urllib2.Request(url, headers=headers)
		response = urllib2.urlopen(req)
		return response

	def extractRawMatch(self, response):
		the_page = response.read()
		match = json.loads(the_page)
		return match

	def genVisMatchSpec(self, apiMatch):
		matchOut = {}
		# print(apiMatch)
		matchOut['gimmick'] = apiMatch['gimmick']
		matchOut['base_gimmicks'] = apiMatch['base_gimmicks']
		matchOut['stage'] = apiMatch['stage']
		matchOut['switching'] = apiMatch['switching']

		if 'teams' in apiMatch:
			matchOut['teams'] = self.getTeams(apiMatch)

		return matchOut

	def getTeams(self, apiMatch):
		teams = []
		for apiTeam in apiMatch['teams']:
			team = []
			for i, apiPkmn in enumerate(apiTeam):
				team.append(pkmnUtils.api2VisSpec(apiPkmn, instantiated=True))
			teams.append(team)
		return teams

	def emitMatchSpec(self, data):
		sioRoutines.emit('visualizer', 'live match spec', data)

	def announceMatch(self, rawMatch, visMatch):
		try:
			teams = rawMatch['teams']
			ids = []
			for team in teams:
				for pkmn in team:
					ids.append(str(pkmn['species']['id']))
			emote = self.getEmote(ids)
			phrase = self.getPhrase()
			msg = "{} {}: https://www.tppAmie.com/vis".format(emote, phrase)
			#self.bot.sendPriv(msg)

		except Exception:
			logger.critical( 'Announce failed :(' )
			logger.critical( traceback.format_exc() )
		pass

	def announceAPIFail(self, failMsg):
		#announce failure to chat
		pass

	def getPhrase(self):
		r = random.randint(0, 1)
		return announcePhrases[r]

	def getEmote(self, ids):
		r = random.randint(0, 100)

		emote = ''
		if '244' in ids:
			return 'TriHard'
		elif '231' in ids or '232' in ids:
			return 'RNGelephant'
		elif '79' in ids:
			return 'tppSlowpoke'
		elif '370' in ids:
			return '<3'
		elif '157' in ids:
			return 'BORT'
		elif '338' in ids:
			return 'B)'
		elif '404' in ids or '405' in ids:
			return 'DansGame'
		elif '298' in ids:
			return 'BibleThump'
		elif '257' in ids:
			return 'OneHand'
		elif '175' in ids or '292' in ids:
			return 'DBstyle'
		elif '441' in ids:
			return 'PermaSmug'
		elif '138' in ids or '139' in ids:
			return 'PraiseIt'
		elif '287' in ids or '289' in ids:
			return 'OSsloth'
		elif '186' in ids:
			return 'OSfrog'
		elif '87' in ids or '355' in ids:
			return 'BigBrother'
		elif '185' in ids:
			return 'PunchTrees'
		elif '225' in ids:
			return 'KappaClaus'
		elif '181' in ids:
			return 'VoHiYo'
		elif '100' in ids or '101' in ids:
			return 'KAPOW'
		elif '108' in ids or '463' in ids:
			return ':P'
		elif '181' in ids:
			return 'VoHiYo'
		elif '386' in ids:
			return 'tppTeiHard'
		elif '221' in ids or '96' in ids:
			return 'ResidentSleeper'
		elif '493' in ids:
			return 'OhMyDog'
		elif '91' in ids:
			return 'OpieOP'

		if r >= 0 and r < 20:
			emote = 'MrDestructoid'
		return emote

def main():
	host = "irc.chat.twitch.tv"
	port = 443
	channels = ['#twitchplayspokemon']
	cred = utils.readJson('../../config.json')['liveMatchUpdater']
	nick = cred['user']
	# CANNOT be blank
	pword = cred['oauth']
	sioRoutines.addSocket(8000)
	while True:
		try:
			LiveMatchUpdater(host, port, channels, nick, pword).run()
		except Exception:
			logger.critical( 'THE WHOLE PROGRAM DIED LUL' )
			logger.critical( traceback.format_exc() )
			time.sleep(5)


if __name__ == "__main__":
    main()
