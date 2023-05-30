from __future__ import division, print_function, unicode_literals
import re, time
#import collections
#import operator
import socket, ssl

#from common
from utils import uPrint, utf8Encode

class Irc:
	# --------------------------------------------- Sample Config  -------------------------------------------------------
	# Accesses in config file, eg: CONFIG['HOST']

	# HOST = "irc.twitch.tv"							# Hostname of the IRC-Server in this case twitch's
	# PORT = 6667										# Default IRC-Port
	# CHAN = "#twitchplayspokemon"							   # Channelname = #{Broadcaster nickname}
	# nick = "somebody"								   # nickname = Twitch nick
	# PASS = "oauth:qwertyuiop1234567890"	# www.twitchapps.com/tmi/ will help to retrieve the required authkey
	# --------------------------------------------- End Sample Config -------------------------------------------------------

	# --------------------------------------------- Start Functions ----------------------------------------------------
	def __init__(self, host, port, channels, nick, pword, timeout):
		self.host = host
		self.port = port
		self.channels = channels
		self.nick = nick
		self.pword = pword
		self.timeout = timeout
		self.sslSock = None
		
	def connect(self):
		self.sock = socket.socket()
		self.sock.settimeout(5)
		self.sslSock = ssl.wrap_socket(self.sock)
		self.sslSock.connect((self.host, self.port))
		self.sslSock.settimeout(self.timeout)
		self.__send_pword()
		self.__send_nick()
		
	def joinChannels(self):
		for chan in self.channels:
			self.__join_channel(chan)

	def close(self):
		if self.sslSock:
			self.sslSock.close()
		
	def recv(self):
		return self.sslSock.recv(4096)
			
	def send_pong(self, msg=''):
		for i in range(0, 6):
			self.sslSock.sendall(bytes('PONG {}\r\n'.format(msg)))

	def send_ping(self, msg=''):
		for i in range(0, 3):
			self.sslSock.sendall(bytes('PING\r\n'.format(msg)))
			
	def sendCap(self, cap='tmc'):
		if 't' in cap:
			self.sslSock.sendall(bytes('CAP REQ :twitch.tv/tags\r\n'))
		if 'm' in cap:
			self.sslSock.sendall(bytes('CAP REQ :twitch.tv/membership\r\n'))
		if 'c' in cap:
			self.sslSock.sendall(bytes('CAP REQ :twitch.tv/commands\r\n'))
	
	def sendPriv(self, msg, chan=''):
		if chan == '':
			chan = self.channels[0]
		print(msg)
		self.sslSock.sendall( bytes( utf8Encode('PRIVMSG {} :{}\r\n'.format(chan, msg)) ) )
		
	def sendWhisper(self, nick, msg):
		self.sslSock.sendall( bytes( utf8Encode('PRIVMSG #jtv :/w {} {}\r\n'.format(nick, msg)) ) )
		
	def __send_nick(self):
		self.sslSock.sendall( bytes('NICK {}\r\n'.format(self.nick)) )

	def __send_pword(self):
		self.sslSock.sendall( bytes('PASS {}\r\n'.format(self.pword)) )

	def __join_channel(self, CHAN):
		self.sslSock.sendall( bytes('JOIN {}\r\n'.format(CHAN)) )

	def __part_channel(self, CHAN):
		self.sslSock.sendall( bytes('PART {}\r\n'.format(CHAN)) )
	# --------------------------------------------- End Functions ------------------------------------------------------