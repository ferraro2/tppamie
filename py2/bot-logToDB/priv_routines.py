# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals

import sys
paths = [r"../common"]
for path in paths:
	sys.path.insert(0, path)

#from common
from chat_sql import ChatSql


#additional private msg parsing
def process(config, twitchMsg, msgTimeStr, videoId, videoOffsetSeconds):
	sender = twitchMsg.sender
	text = twitchMsg.text

	if config['sql']:
		sql = ChatSql('tpp_chat')
		sqlInsertFromIrc(sql, twitchMsg, msgTimeStr, videoId, videoOffsetSeconds)
		sql.commit()
		sql.close()


def sqlInsertFromIrc(sql, twitchMsg, msgTimeStr, videoId, videoOffsetSeconds):
	username = twitchMsg.sender
	twitchId = twitchMsg.configFields.user_id
	color = twitchMsg.configFields.color
	dispName = twitchMsg.configFields.displayname
	mod = twitchMsg.configFields.mod
	sub = twitchMsg.configFields.subscriber
	turbo = twitchMsg.configFields.turbo
	emotes = twitchMsg.configFields.emotes
	text = twitchMsg.text
	me = twitchMsg.me

	sql.processNewMessage(sql, username, twitchId, color, dispName, mod, sub, turbo, me, emotes,
			  msgTimeStr, text, videoId, videoOffsetSeconds)


