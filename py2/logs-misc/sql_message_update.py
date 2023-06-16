from __future__ import division, print_function

import json
import traceback
from Queue import Queue, Empty
from datetime import datetime, timedelta
import sys

from db_partition_multiprocesser import perform_partitions_work
from partitions import get_partition_ranges_of_size

paths = [r"../"]
for path in paths:
    sys.path.insert(0, path)

from common import filters
from common.chat_sql import ChatSql


# go through all messages and modify them in some way
# e.g. if our input regex is modified, we can update the flags with this
def main():
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
    perform_partitions_work(partition_ranges, num_processes, partition_consumer)


def partition_consumer(i, q):
    auth = json.load(open('../../config.json'))
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


if __name__ == '__main__':
    main()
