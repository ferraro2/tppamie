# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals
import sys, urllib2, traceback
import re, json, time, pprint, urllib2, random
import logging, logging.config
import sys

from MessageDBUploader import MessageDBUploader

sys.path.insert(0, r"../")

# from common
from common import utils, pkmnUtils, sioRoutines
from common.twitch_bot import TwitchBot

logging.config.dictConfig(utils.readYaml('logging.yaml'))
logger = logging.getLogger(__name__)

pp = pprint.PrettyPrinter(indent=4)

announcePhrases = [' Match visualizer', 'Match overview']


class LoggingTwitchBot(TwitchBot):
    def __init__(self, host, port, channels, nick, pword, sqlUser, sqlPass, **args):
        TwitchBot.__init__(self, host, port, channels, nick, pword, **args)
        self.setMute('pw')
        self.setIrcLoggers(['all'])
        self.uploader = MessageDBUploader(sqlUser, sqlPass)

    def run(self):
        TwitchBot.run(self)

    def onUnmatched(self, rawMsg):
        logger.info("[UNMATCHED] {}".format(rawMsg))

    def onTick(self):
        pass

    def onAll(self, rawMsg):
        self.logs['all'].info(rawMsg)

    def onPriv(self, twitchMsg):
        self.uploader.newChatMessage(twitchMsg)

    def onWhisper(self, twitchMsg):
        self.uploader.newWhisperMessage(twitchMsg)

    def close(self):
        self.uploader.close()


def main():
    host = "irc.chat.twitch.tv"
    port = 443
    channels = ['#twitchplayspokemon']
    allCred = utils.readJson('../../config.json')
    ircCred = allCred['chatLogger']
    nick = ircCred['user']
    pword = ircCred['oauth']
    sqlCred = allCred['mysql']
    sqlUser = sqlCred['user']
    sqlPass = sqlCred['pass']
    while True:
        bot = None
        try:
            bot = LoggingTwitchBot(host, port, channels, nick, pword, sqlUser, sqlPass)
            bot.run()
        except Exception:
            logger.critical('THE WHOLE PROGRAM DIED LUL')
            logger.critical(traceback.format_exc())
            time.sleep(5)
        finally:
            if bot:
                bot.close()


if __name__ == "__main__":
    main()
