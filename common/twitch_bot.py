 # -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals
import socket	#exception handling
import signal, traceback	#SIGINT handling and exception trace printing
import sys

import re, json, io, time, random, logging

#from common
from utils import uPrint, die
from twitch_irc import TwitchIrc

logger = logging.getLogger(__name__)

HANDLER_NAMES = ['onException', 'onRecoverableError', 'onConnectStatus', 'onUnmatched', 'onTick', 'onData', 'onAll', 'onPriv', 'onJoin', 'onPart', 'onClearchat']
class TwitchBot:
	def __init__(self, host, port, channels, nick, pword, **args):
		self.logs = {}
		self.bot = TwitchIrc(host, port, channels, nick, pword, **args)
		self.channels = channels
		
	def setMute(self, mute):
		self.bot.setMute(mute)
	
	def setIrcLoggers(self, logNames):
		for name in logNames:
			self.logs[name] = TwitchBot.getIrcLogger(self, name)
	
	def getIrcLogger(self, logName):
		logFilename = 'twitchIrc-{}.log'.format(logName)
		logPath = 'logs-{}/{}'.format(self.channels[0][1:], logFilename)
		l = logging.getLogger(logFilename)
		l.propagate = False
		l.setLevel(logging.INFO)
		
		fh = logging.handlers.RotatingFileHandler(logPath, maxBytes=10000000, backupCount=3, encoding='utf-8')
		
		fmt = '[%(asctime)s]    %(message)s'
		datefmt = '%Y-%m-%d %H:%M:%S'
		f = logging.Formatter(fmt, datefmt)
		fh.setFormatter(f)
		
		l.addHandler(fh)
		return l
	
	def __setDefaultHandlers(self):
		for name in HANDLER_NAMES:
			if hasattr(self, name):
				self.bot.setHandler(name, getattr(self, name))
	
	def __close(self):
		self.bot.close()
		uPrint("Twitch bot closed.")
		logging.shutdown()
		uPrint("All logs closed.")
	
	#on ctrl-c
	def __quit(self, signum, frame):
		logger.critical("Program terminated by user.")
		self.__close()
		exit(0)
		
	def run(self):
		self.__setDefaultHandlers()
		# on ctrl-c
		signal.signal(signal.SIGINT, self.__quit)
		self.bot.run()
			
	#handler methods
	def onException(self, e):
		logger.critical( traceback.format_exc() )
		self.__close()
		# traceback.print_exc(file=sys.stdout)
		
	def onRecoverableError(self, e, sleepTime):
		logger.warning( e )
		logger.debug( traceback.format_exc() )
		logger.info('Reconnecting in {} seconds...'.format(sleepTime))