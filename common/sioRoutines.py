# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals

import re, json
import traceback

#from common
import utils
from utils import uPrint

import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# pip install socketIO-client
# socketIO-client 0.7.2
from socketIO_client import SocketIO

sockets = []
auth_socketIO = utils.readFile("../auth_socketIO")

def addSocket(port):
	loc = 'localhost'
	logger.debug('Creating SocketIO at {} port {}'.format(loc, port))
	socketIO = SocketIO(loc, port)
	logger.debug('Socket successfully created.')
	sockets.append(socketIO)
		
def emit(event, *args):
	logger.debug('Emitting event: {}'.format(event))
	for socket in sockets:
		socket.emit(auth_socketIO + ': ' + event, *args)
	logger.debug('Emitting complete')