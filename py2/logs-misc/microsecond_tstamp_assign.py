from __future__ import division, print_function

import contextlib
import json
import signal
import traceback
import math
from Queue import Queue
from multiprocessing import Manager, Pool

import requests
from collections import namedtuple
import time
from datetime import datetime
import random
import sys

paths = [r"../common"]
for path in paths:
    sys.path.insert(0, path)

#from common

from chat_sql import ChatSql


def main():
    num_processes = 6
    auth = json.load(open('../../oauth.json'))
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    # result = sql.cursor.callproc('set_tstamp2_microseconds', [0, 5])
    # min_date = datetime.strptime('2014-02-14 08:16:22', '%Y-%m-%d %H:%M:%S')
    # max_date = datetime.strptime('2014-03-03 22:52:11', '%Y-%m-%d %H:%M:%S')
    min_date = datetime.min
    max_date = datetime.max
    # min_date = '2014-02-14 08:16:22'
    # max_date = '2014-02-14 08:16:42'
    # num_ranges = 4
    # partition_ranges = sql.getPartitionRanges(num_ranges, min_date, max_date)
    range_size = 50000
    partition_ranges = sql.getPartitionRangesOfSize(range_size, min_date, max_date)

    print('%d partition ranges' % len(partition_ranges))
    # for pr in partition_ranges:
    #     print(pr)
    sql.close()
    start = time.time()
    # return
    # reset_progress = bool(len(sys.argv) > 1 and sys.argv[1] == '-r')

    pool = Pool(num_processes)
    for partition_range in partition_ranges:
        pool.apply_async(
            records_work_consumer,
            partition_range,
            callback=callback)
    pool.close()
    print('closed pool')
    try:
        print('join pool')
        pool.join()
        print('joined pool')
    except KeyboardInterrupt:
        pool.terminate()

    print('done. took %s' % (time.time() - start))


def callback(data):
    # print("Finished: %s" % (data,))
    pass


def records_work_consumer(start, end):
    try:
        # print("running range %s - %s" % (start, end))
        auth = json.load(open('../../oauth.json'))
        sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
        # stats = sql.cursor.callproc('get_tstamp_range_stats', (start, end, 0, 0, 0))
        # print(result)
        result = sql.cursor.callproc('set_tstamp2', (start, end))
        sql.commit()
        sql.close()
        # print("done running range %s - %s" % (start, end))
        # return stats + result
        return result

    except KeyboardInterrupt:
        raise Exception("Ctrl-c, goodbye")
    # except Exception as e:
    #     p


def terminate_pool_and_raise(exception, pool):
    pool.terminate()
    raise exception


if __name__ == '__main__':
    main()
