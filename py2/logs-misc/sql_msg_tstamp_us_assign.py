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

from common.chat_sql import ChatSql


# old script to add microseconds to messages with same tstamp, so they can sort by tstamp
def main():
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
    perform_partitions_work(partition_ranges, num_processes, partition_consumer)


def partition_consumer(i, q):
    auth = json.load(open('../../config.json'))
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


if __name__ == '__main__':
    main()
