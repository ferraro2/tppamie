 # -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals
import re, json, io, time, random
import socket	#exception handling
import signal, traceback	#SIGINT handling and exception trace printing

import priv_routines

import sys
paths = [r"../common", r"../emotes"]
for path in paths:
	sys.path.insert(0, path)

#from common
from utils import uPrint, jsonRead, nowStr, die
import sioRoutines
from twitch_bot import TwitchBot

#from emotes
# from emote_sql import EmoteSql

class Logger:
	def __init__(self, config, host, port, channels, nick, pword, timeout):
		self.logs = {}
		self.bot = TwitchBot(host, port, channels, nick, pword, timeout)
		self.channels = channels
		self.config = config
		
	def __openLogs(self, logNames):
		for name in logNames:
			if name in self.logs:
				die("openLog: log {} already exists!".format(name))
			try:				
				self.logs[name] = io.open('{}/{}.txt'.format(self.channels[0][1:], name), 'a', encoding='utf-8')
			except IOError:
				die("log {} could not be opened.".format(name))
	
	def __setHandlers(self, handlers):
		for name in handlers:
			self.bot.setHandler(name, getattr(self, name))
	
	def __close(self):
		self.bot.close()
		uPrint("Twitch bot closed.")
		for name, log in self.logs.iteritems():
			log.close()
		uPrint("All logs closed.")
	
	#on ctrl-c
	def __quit(self, signum, frame):
		self.__close()
		uPrint("Program terminated by user.")
		exit(0)
		
	def run(self):
		logNames = ['data', 'all', 'priv', 'prettyPriv', 'whisper', 'other', 'unmatched', 'error']
		self.__openLogs(logNames)
			
		self.__setHandlers(['onData', 'onAcceptedConnect', 'onRecoverableError', 'onException', 'onAll', 'onPriv', 'onWhisper', 'onOther', 'onUnmatched', 'onJoin', 'onPart', 'onClearChat'])
		# on ctrl-c
		signal.signal(signal.SIGINT, self.__quit)
	
		self.bot.recv()
			
	#handler methods
	def onRecoverableError(self, errStr):
		self.logs['error'].write(errStr + '\n')
		uPrint(errStr)
		
	def onException(self, e):
		self.__close()
		traceback.print_exc(file=sys.stdout)
		exit(1)
	
	def onAcceptedConnect(self):
		uPrint("Twitch connection credentials accepted.");
	
	def onData(self, rawMsg):
		self.logs['data'].write(nowStr() + '\n' + rawMsg + "\n")
		# uPrint(rawMsg)
	
	def onAll(self, rawMsg):
		self.logs['all'].write(rawMsg + "\n")
		# uPrint(rawMsg)
		
	def onPriv(self, twitchMsg):
		sender = twitchMsg.sender
		text = twitchMsg.text
		if len(text) > 1024:
			text = twitchMsg.text = text[0:1023]
	
		prettyStr = "{}: {}".format(sender, text)
		self.logs['prettyPriv'].write(prettyStr + "\n")
		
		msgTimeStr = nowStr()
		str = "{} {}: {}".format(msgTimeStr, sender, text)
		self.logs['priv'].write(str + "\n")
		
		priv_routines.process(self.config, twitchMsg, msgTimeStr)
	
	def onWhisper(self, twitchMsg):
		sender = twitchMsg.sender
		text = twitchMsg.text
		
		if len(text) > 1024:
			text = twitchMsg.text = text[0:1023]
		
		pretty = "{}\n{}: {}".format(nowStr(), sender, text)
		uPrint(pretty)
		self.logs['whisper'].write(pretty + "\n")
		
	def onOther(self, twitchMsg):
		self.logs['other'].write(twitchMsg.raw + "\n")
	
	def onUnmatched(self, rawMsg):
		self.logs['unmatched'].write(rawMsg + "\n")
		uPrint("[UNMATCHED] " + rawMsg)
		
	def onJoin(self, twitchMsg):
		pass
		# msg = "\t[JOIN] {}".format(twitchMsg.sender)
		
	def onPart(self, twitchMsg):
		pass
		# msg = "\t[PART] {}".format(twitchMsg.sender)
		
	def onClearChat(self, twitchMsg):
		pass
		# msg = "\t[CLEARCHAT] {}".format(twitchMsg.text)
		

def main():
	host = "irc.chat.twitch.tv"
	port = 80
	timeout = 240 #4 minutes
	channels = ['#twitchplayspokemon']
	nick = 'ahhwoif'
	pword = jsonRead('../common/admin_oauth.cred')[nick]
	config = { 'sql': True }
	Logger(config, host, port, channels, nick, pword, timeout).run()
	
	
if __name__ == "__main__":
    main()