# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals

from datetime import datetime, timedelta
import sys, urllib2, traceback, logging
import re, json, time, pprint, urllib2, random

sys.path.insert(0, r"../")
from common import utils
from common.chat_sql import ChatSql
from VideoFetcher import VideoFetcher

logger = logging.getLogger(__name__)


class MessageDBUploader:
    videoRefreshIntervalSeconds = 10
    videoRefreshInterval = timedelta(seconds=videoRefreshIntervalSeconds)

    def __init__(self, sqlUser, sqlPass):
        self.sql = ChatSql('tpp_chat', sqlUser, sqlPass)
        self.videoFetcher = None
        self.activeVideoId = None
        self.lastVideoCreatedAt = datetime.min
        self.lastVideoDuration = 0
        self.timeLastVideoFetch = datetime.min
        self.initVideoFetcher()

    def initVideoFetcher(self):
        self.videoFetcher = VideoFetcher()

    def newChatMessage(self, twitchMsg):
        # irc messages have a unix timestamp, but since it lacks ms precision we won't use it
        now = datetime.utcnow()
        if (now - self.timeLastVideoFetch) > self.videoRefreshInterval:
            self.refreshLatestVideo()

        username = twitchMsg.sender
        twitchId = twitchMsg.config.user_id
        color = twitchMsg.config.color
        dispName = twitchMsg.config.display_name
        mod = twitchMsg.config.mod
        sub = twitchMsg.config.subscriber
        turbo = twitchMsg.config.turbo
        is_action = twitchMsg.me
        emotes = twitchMsg.config.emotes
        text = twitchMsg.text
        videoId = self.activeVideoId
        videoOffsetSeconds = (now - self.lastVideoCreatedAt).total_seconds() if videoId else None
        badges = twitchMsg.config.badges

        self.sql.processNewMessage(username, twitchId, color, dispName, mod, sub, turbo, is_action,
                                   emotes, now, text, videoId, videoOffsetSeconds, badges)

    def refreshLatestVideo(self):
        try:
            latest = self.videoFetcher.fetchSingleLatest()
            _id = latest['id']
            duration = latest['duration']
            createdAt = latest['created_at']
        except Exception as e:
            logger.exception(e)
            self.videoFetcher.close()
            self.initVideoFetcher()
            self.activeVideoId = None
        else:
            if self.activeVideoId != _id or self.lastVideoDuration != duration:
                self.activeVideoId = _id
                self.lastVideoCreatedAt = datetime.strptime(createdAt, "%Y-%m-%dT%H:%M:%SZ")
                self.lastVideoDuration = duration
            else:
                self.activeVideoId = None
        self.timeLastVideoFetch = datetime.utcnow()

    def close(self):
        self.sql.close()
        self.videoFetcher.close()
