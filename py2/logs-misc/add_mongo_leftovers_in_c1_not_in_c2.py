import json
import traceback
from Queue import Empty
from datetime import datetime, timedelta

import pymongo
from pymongo.errors import DuplicateKeyError

from db_partition_multiprocesser import perform_partitions_work
from partitions import get_partition_ranges_of_time_interval

# note- resizing pycharm terminal to see what processes finished is bugged and
# can delete a few lines printed to the terminal.  Scroll instead, or resize
# terminal before a ctrl-c


TPPVISUALS_LOGS_END_DATE = datetime.strptime('2016-12-06T05:23:08.426', '%Y-%m-%dT%H:%M:%S.%f')


# A few comments are missing in comments2, put them in leftovers.
# They're missing a video link but that's ok.
def main():
    num_processes = 12
    min_date = TPPVISUALS_LOGS_END_DATE
    # min_date = datetime.strptime('2017-06-03T21:05:34.075', '%Y-%m-%dT%H:%M:%S.%f')
    max_date = datetime.utcnow()
    # max_date = datetime.strptime('2016-12-16T15:25:42.425', '%Y-%m-%dT%H:%M:%S.%f')
    # min_date = datetime.strptime('2023-05-30T15:25:42.425', '%Y-%m-%dT%H:%M:%S.%f')
    # max_date = datetime.strptime('2016-12-16T15:25:42.425', '%Y-%m-%dT%H:%M:%S.%f')
    interval_size = timedelta(minutes=20)
    partition_ranges = get_partition_ranges_of_time_interval(interval_size, min_date, max_date)
    # for pr in partition_ranges:
    #     print(pr)

    print('%d partition ranges' % len(partition_ranges))
    perform_partitions_work(partition_ranges, num_processes, partition_consumer)


def partition_consumer(i, q):
    mongodb_client = pymongo.MongoClient('127.0.0.1:27017')
    amie_db = mongodb_client['amie']
    comments1_table = amie_db['comments']
    comments2_table = amie_db['comments2']
    comments_leftovers_table = amie_db['comments-leftovers']
    lastitem = None
    try:
        while True:
            (start, end) = lastitem = q.get(block=False)
            start_str = datetime.strftime(start, '%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            end_str = datetime.strftime(end, '%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            # let the 1st thread print its progress
            if i == 0:
                print("running range %s - %s" % (start_str, end_str))

            comments = comments1_table \
                .find({"node.createdAt": {"$gte": start_str, "$lt": end_str}}) \
                .sort("node.createdAt")
            process_comments(comments, comments2_table, comments_leftovers_table)

    except KeyboardInterrupt:
        return "%d Ctrl-c, goodbye" % i
    except Empty:
        mongodb_client.close()
        return str(i)
    except Exception:
        print('exception')
        print(traceback.format_exc())
        result = str(i) + traceback.format_exc()
        try:
            if lastitem:
                q.put(lastitem)
            mongodb_client.close()
        except Exception:
            result += '\n' + traceback.format_exc()
        return result


def process_comments(comments, comments2_table, comments_leftovers_table):
    ops = []
    for comment in comments:
        node = comment['node']
        # grab the comment if exists in comments2
        comment2 = comments2_table.find_one({"_id": node['id']})
        if comment2 is None:
            # good, the comment isn't in comments2
            new_comment = node
            new_comment['leftoverType'] = 'notIn2'
            new_comment['_id'] = node['id']
            new_comment['video_id'] = None
            new_comment['contentOffsetSeconds'] = None
            ops.append(pymongo.InsertOne(new_comment))
    if ops:
        # print("inserting: \n%s" % new_comment)
        bulk_result = comments_leftovers_table.bulk_write(ops, ordered=False)


if __name__ == '__main__':
    main()
