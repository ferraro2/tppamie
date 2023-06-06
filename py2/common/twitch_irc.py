# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals
import re, socket, time, datetime, ssl

from irc import Irc

#from common
import patterns

import logging
logger = logging.getLogger(__name__)

class TwitchIrc:
	def __init__(self, host, port, channels, nick, pword, \
		cap='tmc', mute = '', \
		sockTimeout=.5, tickTimeout=1, noMsgTimeout=240, pingTimeout=60):
		self.twitchAcceptedConnect = False
		self.handlers = {}
		self.reconnectSleepTime = 2
		self.irc = Irc(host, port, channels, nick, pword, sockTimeout)
		
		self.tickTimeout = tickTimeout
		self.tickTimeoutInterval = datetime.timedelta(0, tickTimeout, 0)
		
		self.noMsgTimeout = noMsgTimeout
		self.noMsgTimeoutInterval = datetime.timedelta(0, noMsgTimeout, 0)
		
		self.pingTimeout = pingTimeout
		self.pingTimeoutInterval = datetime.timedelta(0, pingTimeout, 0)
		
		now = datetime.datetime.now()
		self.lastTickTime = now
		self.lastMsgTime = now
		self.lastPingTime = now
		
		self.mute = mute
		
	def connect(self):
		#remove any leftover message part that was left from previous connection
		self.incomplete = ''
		statusMsg = 'Connecting to {}:{} as {}'.format(self.irc.host, self.irc.port, self.irc.nick)
		self.__runHandler('onConnectStatus', Status(statusMsg, 'connecting'))
		
		self.irc.connect()
		statusMsg = 'Joining channels ' + ', '.join(self.irc.channels)
		self.__runHandler('onConnectStatus', Status(statusMsg, 'join_req'))
		self.irc.joinChannels()
		self.irc.sendCap()
		
	def close(self):
		self.irc.close()
		self.twitchAcceptedConnect = False
		
	def setMute(self, mute):
		self.mute = mute
		
	def sendPriv(self, msg, chan=''):
		if 'p' not in self.mute:
			self.irc.sendPriv(msg, chan)
		
	def sendWhisper(self, nick, msg):
		if 'w' not in self.mute:
			self.irc.sendWhisper(nick, msg)
	
	def setHandler(self, name, f):
		self.handlers[name] = f
	
	def __runHandler(self, name, *args):
		if name in self.handlers:
			self.handlers[name](*args)
		
	def run(self):
		self.connected = False
		while True:	
			try:
				try:
					if not self.connected:
						self.connect()
						self.connected = True
						self.reconnectSleepTime = 2
					
					#send ping if overdue
					if datetime.datetime.now() - self.lastPingTime > self.pingTimeoutInterval:
						self.irc.send_ping()
						self.lastPingTime = datetime.datetime.now()
						
					#blocking recv
					self.__recvOne()
					
					#got a message, update time
					self.lastMsgTime = datetime.datetime.now()
						
				except socket.timeout:
					self.__handleTimeout()
					
			except ssl.SSLError as e:
				if e.message == 'The read operation timed out':
					self.__handleTimeout()	
				else:
					self.__handleRecoverable(e)
				
			except socket.error as e:
				self.__handleRecoverable(e)
			
			# custom errors
			except ValueError as e:
				self.__handleRecoverable(e)
				
			except Exception as e:
				self.__runHandler('onException', e)
				raise
				
	def __handleTimeout(self):
		now = datetime.datetime.now()
		self.__tickIfOverdue(now)
		
		#check no message timeout
		if  now - self.lastMsgTime > self.noMsgTimeoutInterval:
			errStr = "Timeout- no messages received for {} seconds".format(self.msgTimeout)
			self.lastMsgTime = now
			raise ValueError(errStr)
			
	# call tick handler if a tick is overdue
	def __tickIfOverdue(self, now):
		#check tick timeout
		if now - self.lastTickTime > self.tickTimeoutInterval:
			self.__runHandler('onTick')
			self.lastTickTime = now
		
	def __handleRecoverable(self, e):
		self.__runHandler('onRecoverableError', e, self.reconnectSleepTime)
		#reconnect
		self.close()
		self.connected = False
		time.sleep(self.reconnectSleepTime)
		if self.reconnectSleepTime < 240:
			self.reconnectSleepTime *= 2
		
	def __recvOne(self):
		data = self.irc.recv().decode('utf-8')
		
		
		now = datetime.datetime.now()
		self.__tickIfOverdue(now)
		self.__runHandler('onData', data)
		
		#split the data received into: message header + several messages.  Pop and discard the header
		data_split = re.split(r"[\r\n]+", data)
		
		#combine the two halves of some message that was split up
		#usually incomplete will be an empty string
		data_split[0] = self.incomplete + data_split[0]
		
		#sometimes the last entry in data_split is only the first half of some message.  The second half is then the first entry in the next data_split received.
		#this first half message must be stored so it can be reunited with the rest of the message
		self.incomplete = data_split.pop()
		
		# print("Data_split: {}".format(data_split))
		# print("Data_split length: {}".format(len(data_split)))
		# print("Data_split first empty: {}".format(len(data_split)))
		
		#parse each message
		for rawMsg in data_split:
			self.__parseRawMsg(rawMsg)
			
		if len(data_split) == 0:
			raise ValueError('Twitch terminated the connection')

	#parse the raw twitch message
	def __parseRawMsg(self, rawMsg):
		self.__runHandler('onAll', rawMsg)
	
		#if we see this, we can verify the connection was successful
		if not self.twitchAcceptedConnect and "You are in a maze of twisty" in rawMsg:
			self.twitchAcceptedConnect = True
			statusMsg = 'Twitch connection credentials accepted'
			self.__runHandler('onConnectStatus', Status(statusMsg, 'accept'))
		
		# process standard messages on the channel
		twitchMsgMatch = patterns.twitchMsgPat.match(rawMsg)
		if twitchMsgMatch is not None:
			#get a TwitchMsg object with attribute fields
			twitchMsg = TwitchMsg(twitchMsgMatch)
			
			if twitchMsg.action == 'PRIVMSG':
				self.__runHandler('onPriv', twitchMsg)
				
			elif twitchMsg.action == 'WHISPER':
				self.__runHandler('onWhisper', twitchMsg)
			
			elif twitchMsg.action == 'JOIN':
				self.__runHandler('onJoin', twitchMsg)
				
			elif twitchMsg.action == 'PART':
				self.__runHandler('onPart', twitchMsg)
			
			elif twitchMsg.action == 'CLEARCHAT':
				self.__runHandler('onClearchat', twitchMsg)
				
			else:
				self.__runHandler('onOther', twitchMsg)
			return

		#respond to  pings
		elif patterns.twitchPingPat.match(rawMsg):
			self.irc.send_pong(rawMsg)
		elif 'PING' in rawMsg:
			uPrint("WARNING: Is this a ping? If so, it was missed!\n" + rawMsg)
		elif rawMsg == 'PONG :tmi.twitch.tv':
			pass
		else:
			self.__runHandler('onUnmatched', rawMsg)

class Status:
	def __init__(self, msg, code):
		self.__msg = msg
		self.__code = code
	def msg(self):
		return self.__msg
	def code(self):
		return self.__code
			
SOH = chr(1)
class TwitchMsg:
	def __init__(self, twitchMsgMatch):
		fieldNames = ['config_raw', 'sender', 'action', 'target', 'text']
		for name in fieldNames:
			val = twitchMsgMatch.group(name)
			if not val:
				val = ""
			setattr(self, name, val)
		setattr(self, 'raw', twitchMsgMatch.group(0))
		self.config = TwitchConfig(self.config_raw)
		
		if self.action == 'PRIVMSG' and SOH in self.text:
			self.me = True
			self.text = self.text[8:-1]
		else:
			self.me = False
		
		
#@color=#0D4200;display-name=TWITCH_UserNaME;emotes=25:0-4,12-16/1902:6-10;mod=0;subscriber=0;turbo=1;user-id=1337;
#fields can be empty!

fieldPat = re.compile(r"""
	([\w-]+)	#field
	=
	([^;]*)		#value
	""", re.VERBOSE)

colorPat = re.compile(r"""^#[A-Fa-f0-9]{6}$""")
class TwitchConfig:
	def __init__(self, config_raw):
		for m in re.finditer(fieldPat, config_raw):
			#print"<{}>".format(m.group(1)))
			# replace dash for keys such as  'display-name', 
			# because dash not valid character for a key
			key = m.group(1).replace('-', '_')
			value = m.group(2)
			setattr(self, key, value)
		
		if not hasattr(self, 'color'):
			self.color = ''
		else:
			#verify appropriate color format
			colorMatch = colorPat.match(self.color)
			if colorMatch is None:
				self.color = ''
			else:
				#remove hash from beginning of color
				self.color = self.color[1:]
		
		if not hasattr(self, 'display_name'):
			self.display_name = ''
		elif '\\' in self.display_name:
			logger.warning( 'Display name has a slash: "{}"'.format(self.display_name) )
			self.display_name = TwitchConfig.unescapeIrcTag(self.display_name)
			logger.warning( 'Display name after unescaping: "{}"'.format(self.display_name) )
			
		if not hasattr(self, 'emotes'):
			self.emotes = ''
			
		if not hasattr(self, 'mod'):
			self.mod = 0
		else:				
			self.mod = 1 if self.mod == '1' else 0
			
		if not hasattr(self, 'subscriber'):
			self.subscriber = 0
		else:				
			self.subscriber = 1 if self.subscriber == '1' else 0
			
		if not hasattr(self, 'turbo'):
			self.turbo = 0
		else:				
			self.turbo = 1 if self.turbo == '1' else 0
			
		if not hasattr(self, 'user_id'):
			self.user_id = 0
	
	@staticmethod
	def unescapeIrcTag(str):
		return str.replace('\\:', ';').replace('\\s',' ').replace('\\\\','\\').replace('\\r','\r').replace('\\n','\n')	
		