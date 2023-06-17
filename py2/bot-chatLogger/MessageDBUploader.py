# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals

from datetime import datetime, timedelta
import sys, urllib2, traceback, logging
import re, json, time, pprint, urllib2, random

sys.path.insert(0, r"../")
from common import utils, patterns
from common.chat_sql import ChatSql
from VideoFetcher import VideoFetcher

logger = logging.getLogger(__name__)


class MessageDBUploader:
    videoRefreshIntervalSeconds = 15
    videoRefreshInterval = timedelta(seconds=videoRefreshIntervalSeconds)

    # the duration of the latest, still-live video from the twitch api is unreliable.
    # Usually it increases, but sometimes it decreases, or reports the same value.
    # when do we finally decide this video has indeed stopped recording and there is no live video right now?
    sameIdAndDurationDeactivateTimeout = timedelta(minutes=3)

    def __init__(self, sqlUser, sqlPass):
        self.sql = ChatSql('tpp_chat', sqlUser, sqlPass)
        self.videoFetcher = None
        self.liveVideoId = None
        self.lastVideoCreatedAt = datetime.min
        self.lastVideoDuration = 0
        self.timeLastVideoFetch = datetime.min
        self.lastChangedIdOrDurationSeenAt = datetime.min
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
        videoId = self.liveVideoId
        videoOffsetSeconds = (now - self.lastVideoCreatedAt).total_seconds() if videoId else None
        badges = twitchMsg.config.badges

        self.sql.processNewMessage(username, twitchId, color, dispName, mod, sub, turbo, is_action,
                                   emotes, now, text, videoId, videoOffsetSeconds, badges)

    def refreshLatestVideo(self):
        try:
            logger.debug("fetching latest video")
            latest = self.videoFetcher.fetchSingleLatest()
            logger.debug("latest video: %s" % latest)
            _id = latest['id']
            duration = latest['duration']
            createdAt = latest['created_at']
        except Exception as e:
            logger.exception(e)
            self.videoFetcher.close()
            self.initVideoFetcher()
            self.liveVideoId = None
        else:
            if self.liveVideoId != _id or self.lastVideoDuration != duration:
                logger.debug("video ID or duration changed")
                self.liveVideoId = _id
                self.lastVideoCreatedAt = datetime.strptime(createdAt, "%Y-%m-%dT%H:%M:%SZ")
                self.lastVideoDuration = duration
                self.lastChangedIdOrDurationSeenAt = datetime.utcnow()
            else:
                timeSince = datetime.utcnow() - self.lastChangedIdOrDurationSeenAt
                logger.debug("video ID and duration did not change in the last %s\n." % timeSince)
                if timeSince > self.sameIdAndDurationDeactivateTimeout:
                    logger.debug("Marking video not live")
                    self.liveVideoId = None
        self.timeLastVideoFetch = datetime.utcnow()

    def newWhisperMessage(self, twitchMsg):
        twitch_id = twitchMsg.config.user_id
        text = twitchMsg.text
        try:
            match = patterns.msgHideAllPat.match(text)
            if match:
                self.sql.markTwitchIdHidden(twitch_id)
                return

            match = patterns.msgUnhideAllPat.match(text)
            if match:
                self.sql.markTwitchIdVisible(twitch_id)
                return

            match = patterns.msgHidePat.match(text)
            if match:
                self.sql.markMsgIdHidden(twitch_id, match.group('msg_id'))
                return

            match = patterns.msgUnhidePat.match(text)
            if match:
                self.sql.markMsgIdVisible(twitch_id, match.group('msg_id'))
                return
        except Exception as e:
            logger.exception(e)

    def close(self):
        self.sql.close()
        self.videoFetcher.close()
