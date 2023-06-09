import pymongo
import json
import time
from datetime import datetime, timedelta
from pytimeparse.timeparse import timeparse

import sys

paths = [r"../common"]
for path in paths:
    sys.path.insert(0, path)

# from common
import patterns
from chat_sql import ChatSql


def main():
    # testFirstMsg()
    # testAllCommentsMatchAVideo()
    insertComments()


def insertComments():
    vidmap = createVidMap()

    mongodb_client = pymongo.MongoClient('127.0.0.1:27017')
    amie_db = mongodb_client['amie']
    comments_table = amie_db['comments']

    # "$gt": "2016-12-06T05:23:08.425Z" = where tppvisuals left off
    comments = comments_table \
        .find({"node.createdAt": {"$gt": "2016-12-06T05:23:08.425Z"}}) \
        .sort("node.createdAt")\
        # .limit(100)

    auth = json.load(open('../../oauth.json'))
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    for comment in comments:
        node = None
        try:
            node = comment['node']
            commenter = node['commenter']
            msg = node['message']
            if commenter is None:
                continue

            username = commenter['login']
            twitchId = commenter['id']
            color = msg['userColor']
            if color is not None:
                color = color[1:]  # remove hash
            dispName = commenter['displayName']
            me = True if username == 'tpp' else False
            mod = 0
            sub = 0
            turbo = 0
            msgBadges = []
            for badge in msg['userBadges']:
                if badge['version'] == '':
                    # some are like this, I checked the vod and it's just a superflous
                    # badge that isn't visible so we'll ignore it
                    continue
                setID = badge['setID']
                if 'moderator' in setID:
                    mod = 1
                elif 'subscriber' in setID:
                    sub = 1
                elif 'turbo' in setID:
                    turbo = 1
                msgBadges.append(setID + '/' + badge['version'])
            emotes = {}
            texts = []
            for frag in msg['fragments']:
                emote = frag['emote']
                if emote:
                    (emoteID, start, end) = emote['id'].split(';')
                    emotes.setdefault(emoteID, []).append(start + '-' + end)
                texts.append(frag['text'])

            emotesStr = '/'.join('%s:%s' % (emoteID, ','.join(emoteLocs))
                                 for emoteID, emoteLocs in emotes.items())
            text = ''.join(texts)
            createdAt = commentCreatedAtToDateTime(node['createdAt'])
            videoOffsetSeconds = node['contentOffsetSeconds']
            videoId = getVidIdForComment(vidmap, createdAt, videoOffsetSeconds)
            if videoId is None:
                print(node)
                return
            msgTimeStr = createdAt.strftime("%Y-%m-%d %H:%M:%S")

            # print(("[%s] %s: %s" % (createdAt, dispName, text)).encode('utf-8'))
            sql.processNewMessage(username, twitchId, color, dispName,
                                  mod, sub, turbo, me, emotesStr, msgTimeStr,
                                  text, videoId, videoOffsetSeconds, msgBadges)

            # sql.commit()
            # print(node)
            # print(("[%s] %s: %s" % (createdAt, dispName, text)).encode('utf-8'))
        except Exception:
            print(node)
            raise

    sql.close()


def testAllCommentsMatchAVideo():
    vidmap = createVidMap()

    mongodb_client = pymongo.MongoClient('127.0.0.1:27017')
    amie_db = mongodb_client['amie']
    comments_table = amie_db['comments']

    comments = comments_table \
        .find({"node.createdAt": {"$gt": "2016-12-06T05:23:08.425Z"}}) \
        .sort("node.createdAt") \
        .limit(100000)

    for comment in comments:
        try:
            node = comment['node']
            commenter = node['commenter']
            msg = node['message']

            createdAt = commentCreatedAtToDateTime(node['createdAt'])
            offsetSeconds = node['contentOffsetSeconds']

            if getVidIdForComment(vidmap, createdAt, offsetSeconds) is None:
                print(node)
                return
        except Exception:
            print(node)
            raise


def commentCreatedAtToDateTime(str):
    return datetime.strptime(str[:str.find('.')], "%Y-%m-%dT%H:%M:%S")


# return (datetime start, str vid_id)
# latest videos come first.  this is important.  if we're trying to match a chat message to its video, the earlier one will be like 20 seconds long, so we want to match the latest video.
def createVidMap():
    vidmap = []
    with open('all_tpp_videos.json') as f:
        videos = json.load(f)

    for vid in videos:
        dtCreated = datetime.strptime(vid['created_at'][0:-1], "%Y-%m-%dT%H:%M:%S")
        # msgTimeStr = time.mktime(dtCreated.timetuple())
        duration = timedelta(seconds=timeparse(vid['duration']))
        vidStartedEstimate = dtCreated  # - duration
        vidmap.append((vidStartedEstimate, vid['id']))
    return vidmap


# i've seen vids as long as 1 min off
# we can relax on error size to 4 mins
def getVidIdForComment(vidmap, msgCreatedAtDT, msgOffsetSeconds, errorSeconds=240):
    msgOffsetDelta = timedelta(seconds=msgOffsetSeconds)
    errorDelta = timedelta(seconds=errorSeconds)
    vidStartEstimate = msgCreatedAtDT - msgOffsetDelta
    # print(vidStartEstimate)
    for (vidStart, vidid) in vidmap:
        if abs(vidStart - vidStartEstimate) < errorDelta:
            return vidid


# match first comment creation time to the corresponding video json creation time
# the error here is 2 seconds
def testFirstMsg():
    vidmap = createVidMap()
    msgtime = commentCreatedAtToDateTime("2016-12-06T05:23:08.425Z")
    offset = timedelta(seconds=24901)
    vidStartedEstimate2 = msgtime - offset

    error = timedelta(seconds=10)
    # print(error)
    for (start, vidid) in vidmap:
        if abs(start - vidStartedEstimate2) < error:
            print(start)
            print(vidStartedEstimate2)
            print(start - vidStartedEstimate2)
            print(start - vidStartedEstimate2 < error)


if __name__ == '__main__':
    main()
