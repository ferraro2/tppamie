from __future__ import division, print_function

import contextlib
import json
import signal
import traceback
import math
from Queue import Queue, Empty
from multiprocessing import Manager, Pool
import pymongo

import requests
from collections import namedtuple
import time
from datetime import datetime, timedelta
import random
import sys

paths = [r"../"]
for path in paths:
    sys.path.insert(0, path)

from common import filters
from common.chat_sql import ChatSql

# note- resizing pycharm terminal to see what processes finished is bugged and
# can delete a few lines printed to the terminal.  Scroll instead, or resize
# terminal before a ctrl-c


def main():
    mongo_comments_insert()

    # go through all messages and modify them in some way
    # e.g. if our input regex is modified, we can update the flags with this
    # message_update()

    # old script to add microseconds to messages with same tstamp, so they can sort by tstamp
    # microsecond_assign()


def mongo_comments_insert():
    num_processes = 15
    # min_date = datetime.strptime('2014-02-01T00:00:00.000', '%Y-%m-%dT%H:%M:%S.%f')
    max_date = datetime.utcnow()

    # min_date = datetime.strptime('2016-12-06T05:23:08.426', '%Y-%m-%dT%H:%M:%S.%f')
    # max_date = datetime.strptime('2016-12-16T15:25:42.425', '%Y-%m-%dT%H:%M:%S.%f')
    min_date = datetime.strptime('2023-03-23T15:25:42.425', '%Y-%m-%dT%H:%M:%S.%f')
    # max_date = datetime.strptime('2016-12-16T15:25:42.425', '%Y-%m-%dT%H:%M:%S.%f')
    interval_size = timedelta(minutes=20)
    partition_ranges = get_partition_ranges_of_time_interval(interval_size, min_date, max_date)
    # for pr in partition_ranges:
    #     print(pr)

    print('%d partition ranges' % len(partition_ranges))
    perform_partitions_work(partition_ranges, num_processes, mongo_comments_insert_consumer)


def mongo_comments_insert_consumer(i, q):
    mongodb_client = pymongo.MongoClient('127.0.0.1:27017')
    amie_db = mongodb_client['amie']
    comments_table = amie_db['comments2']

    auth = json.load(open('../../oauth.json'))
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    lastitem = None
    try:
        while True:
            (start, end) = lastitem = q.get(block=False)
            start_str = datetime.strftime(start, '%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            end_str = datetime.strftime(end, '%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            # let the 1st thread print its progress
            # if i == 0:
            #     print("running range %s - %s" % (start_str, end_str))
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
        if videoId is None:
            print(node)
            raise Exception(str(node))
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


def get_partition_ranges_of_time_interval(interval_duration, min_date, max_date):
    results = []
    while min_date < max_date:
        next_date = min_date + interval_duration
        if next_date >= max_date:
            next_date = max_date
        results.append((min_date, next_date))
        min_date = next_date
    return results


def message_update():
    num_processes = 15
    # min_date = datetime.min
    max_date = datetime.max
    # min_date = '2014-02-14 08:16:19'
    # max_date = '2014-02-14 08:16:28'
    min_date = '2016-12-03 05:24:00'
    # max_date = '2016-12-06 05:25:00'
    # min_date = datetime.strptime('2014-02-14 08:16:22', '%Y-%m-%d %H:%M:%S')
    # max_date = datetime.strptime('2014-02-14 08:17:12', '%Y-%m-%d %H:%M:%S')
    # num_ranges = 4
    # partition_ranges = sql.getPartitionRanges(num_ranges, min_date, max_date)
    # range_size = 100
    range_size = 20000
    partition_ranges = get_partition_ranges_of_size(range_size, min_date, max_date)
    for pr in partition_ranges:
        print(pr)

    print('%d partition ranges' % len(partition_ranges))
    perform_partitions_work(partition_ranges, num_processes, message_update_consumer)


def message_update_consumer(i, q):
    auth = json.load(open('../../oauth.json'))
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    # results = []
    lastitem = None
    try:
        while True:
            (start, end) = lastitem = q.get(timeout=5)
            # (start, end) = lastitem = q.get(block=False)
            # let the 1st thread print its progress
            if i == 0:
                print("running range %s - %s" % (start, end))

            text = ("""SELECT username, m.msg_id, msg, tstamp 
            FROM messages as m join msg_data md using(msg_id) join users using(user_id)
            WHERE %s <= tstamp AND tstamp < %s order by tstamp asc""")
            sql.cursor.execute(text, (start, end))
            for (username, msg_id, msg, tstamp) in list(sql.cursor):
                msg_update_items = {
                    # is_action is already set correctly
                    # "is_bot": filters.isUserBot(username),
                    "is_input": filters.isInput2(msg),
                    # "is_command": filters.isCommand(msg),
                    "is_match_command": filters.isMatchCommand(msg),
                    # "has_unwhitelisted_chars": not filters.passesCharacterWhitelist2(msg),
                }
                msg_update_criteria = {
                    "msg_id": msg_id,
                }
                sql.update('messages', msg_update_items, msg_update_criteria)

                # print('[%s] %s: %s (%s)' % (tstamp, msg_id, msg_update_items, msg.encode('utf-8')))
                # search_text = 'tppvisuals.com'
                # replace_text = 'tppamie.com'
                # if search_text in msg:
                #     msg_data_update_items = {
                #         'msg': msg.replace(search_text, replace_text),
                #     }
                #     msg_data_update_criteria = {
                #         'msg_id': msg_id,
                #     }
                #     sql.update('msg_data', msg_data_update_items, msg_data_update_criteria)
                    # print('[%s] %s: %s (%s)' % (tstamp, msg_id, msg_data_update_items, msg.encode('utf-8')))

            sql.commit()

    except KeyboardInterrupt:
        return "Ctrl-c, goodbye"

    except Empty:
        sql.close()
        return str(i)
        # return "\n\t".join(results)
        # return
    except Exception:
        result = traceback.format_exc()
        try:
            if lastitem:
                q.put(lastitem)
            sql.close()
        except Exception:
            result += '\n' + traceback.format_exc()
        return result


def microsecond_assign():
    num_processes = 15
    # result = sql.cursor.callproc('set_tstamp2_microseconds', [0, 5])
    # min_date = datetime.strptime('2014-02-14 08:16:22', '%Y-%m-%d %H:%M:%S')
    # max_date = datetime.strptime('2014-03-03 22:52:11', '%Y-%m-%d %H:%M:%S')
    min_date = datetime.min
    max_date = datetime.max
    # min_date = '2014-02-14 08:16:22'
    # max_date = '2014-02-14 08:16:42'
    # num_ranges = 4
    # partition_ranges = sql.getPartitionRanges(num_ranges, min_date, max_date)
    range_size = 10000
    # for pr in partition_ranges:
    #     print(pr)
    partition_ranges = get_partition_ranges_of_size((range_size, min_date, max_date))

    print('%d partition ranges' % len(partition_ranges))
    perform_partitions_work(partition_ranges, num_processes, microseconds_assign_consumer)


def get_partition_ranges_of_size(range_size, min_date, max_date):
    auth = json.load(open('../../oauth.json'))
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    result = sql.getPartitionRangesOfSize(range_size, min_date, max_date)
    sql.close()
    return result


def perform_partitions_work(partition_ranges, num_processes, consumer):
    start = time.time()
    # return
    # reset_progress = bool(len(sys.argv) > 1 and sys.argv[1] == '-r')

    manager = Manager()

    q = manager.Queue()
    for partition_range in partition_ranges:
        q.put(partition_range)

    pool = Pool(num_processes)
    for i in range(num_processes):
        pool.apply_async(
            consumer,
            (i, q,),
            callback=callback)
    pool.close()
    print('closed pool')
    try:
        print('waiting on pool')
        pool.join()
        print('pool finished')
    except KeyboardInterrupt:
        pool.terminate()

    print('done. took %s' % (time.time() - start))


def callback(data):
    print("Finished: %s" % (data,))


def microseconds_assign_consumer(i, q):
    auth = json.load(open('../../oauth.json'))
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    results = []
    lastitem = None
    try:
        while True:
            (start, end) = lastitem = q.get(timeout=5)
            # results.append("running range %s - %s" % (start, end))
            # stats = sql.cursor.callproc('get_tstamp_range_stats', (start, end, 0, 0, 0))
            results.append(sql.cursor.callproc('set_tstamp2', (start, end)))
            # print(result)
            sql.commit()
            # print("done running range %s - %s" % (start, end))
            # return stats + result
            # return result

    except KeyboardInterrupt:
        return "Ctrl-c, goodbye"

    except Empty:
        return "complete"
        # return "\n\t".join(results)
        # return
    except Exception as e:
        if lastitem:
            q.put(lastitem)
        return traceback.format_exc()
    finally:
        sql.close()


def terminate_pool_and_raise(exception, pool):
    pool.terminate()
    raise exception


if __name__ == '__main__':
    main()
