from __future__ import division, print_function

import json
import traceback
from Queue import Queue, Empty
import pymongo
from datetime import datetime, timedelta
import sys

paths = [r"../"]
for path in paths:
    sys.path.insert(0, path)

from common.chat_sql import ChatSql

from db_partition_multiprocesser import perform_partitions_work
from partitions import get_partition_ranges_of_time_interval

# note- resizing pycharm terminal to see what processes finished is bugged and
# can delete a few lines printed to the terminal.  Scroll instead, or resize
# terminal before a ctrl-c

TPP_START_DATE = datetime.strptime('2014-02-14T00:00:00.000', '%Y-%m-%dT%H:%M:%S.%f')
TPPVISUALS_LOGS_END_DATE = datetime.strptime('2016-12-06T05:23:08.426', '%Y-%m-%dT%H:%M:%S.%f')
MONGO_TABLE = 'comments2'
# MONGO_TABLE = 'comments-leftovers'


def main():
    num_processes = 15

    # General format
    min_date = datetime.strptime('2020-01-01T00:00:00.000', '%Y-%m-%dT%H:%M:%S.%f')
    max_date = datetime.strptime('2020-01-01T00:00:00.000', '%Y-%m-%dT%H:%M:%S.%f')
    interval_size = timedelta(minutes=20)

    # Add comments-leftovers
    # min_date = TPPVISUALS_LOGS_END_DATE
    # max_date = datetime.utcnow()
    # interval_size = timedelta(minutes=120)

    # Add everything post-tppvisuals
    # min_date = TPPVISUALS_LOGS_END_DATE
    # max_date = datetime.utcnow()
    # interval_size = timedelta(minutes=20)

    partition_ranges = get_partition_ranges_of_time_interval(interval_size, min_date, max_date)
    # for pr in partition_ranges:
    #     print(pr)

    print('%d partition ranges' % len(partition_ranges))
    perform_partitions_work(partition_ranges, num_processes, partition_consumer)


def partition_consumer(i, q):
    mongodb_client = pymongo.MongoClient('127.0.0.1:27017')
    amie_db = mongodb_client['amie']
    comments_table = amie_db[MONGO_TABLE]

    auth = json.load(open('../../config.json'))
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    lastitem = None
    try:
        while True:
            (start, end) = lastitem = q.get(block=False)
            start_str = datetime.strftime(start, '%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            end_str = datetime.strftime(end, '%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            # let the 1st thread print its progress
            if i == 0:
                print("running range %s - %s" % (start_str, end_str))
            comments = comments_table \
                .find({"createdAt": {"$gte": start_str, "$lt": end_str}}) \
                .sort("createdAt")

            for comment in comments:
                insert_one_comment_node(sql, comment)

    except KeyboardInterrupt:
        return "%d Ctrl-c, goodbye" % i
    except Empty:
        sql.close()
        mongodb_client.close()
        return str(i)
        # return "\n\t".join(results)
        # return
    except Exception:
        print('exception')
        print(traceback.format_exc())
        result = str(i) + traceback.format_exc()
        try:
            if lastitem:
                q.put(lastitem)
            sql.close()
            mongodb_client.close()
        except Exception:
            result += '\n' + traceback.format_exc()
        return result


def insert_one_comment_node(sql, node):
    try:
        commenter = node['commenter']
        if commenter is None:
            return
        msg = node['message']
        username = commenter['login']
        twitchId = commenter['id']
        color = msg['userColor']
        if color is not None:
            color = color[1:]  # remove hash
        dispName = commenter['displayName']
        is_action = True if username in('tpp', 'tppsimulator') else False
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
        createdAtStr = node['createdAt'][:-1]  # strip trailing Z
        try:
            createdAt = datetime.strptime(createdAtStr, "%Y-%m-%dT%H:%M:%S.%f")
        except ValueError:
            createdAt = datetime.strptime(createdAtStr, "%Y-%m-%dT%H:%M:%S")
        videoOffsetSeconds = node['contentOffsetSeconds']
        videoId = node['video_id']
        msgTimeStr = createdAt.strftime("%Y-%m-%d %H:%M:%S.%f")

        # print(("\n[%s] %s: %s" % (createdAt, dispName, text)).encode('utf-8'))
        sql.processNewMessage(username, twitchId, color, dispName,
                              mod, sub, turbo, is_action, emotesStr, msgTimeStr,
                              text, videoId, videoOffsetSeconds, msgBadges)

        # print(node)
        # print(("[%s] %s: %s" % (createdAt, dispName, text)).encode('utf-8'))

    except Exception:
        print(node)
        raise


if __name__ == '__main__':
    main()
