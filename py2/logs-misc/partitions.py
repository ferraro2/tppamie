from __future__ import division, print_function

import json
import sys

paths = [r"../"]
for path in paths:
    sys.path.insert(0, path)

from common.chat_sql import ChatSql


def get_partition_ranges_of_time_interval(interval_duration, min_date, max_date):
    results = []
    while min_date < max_date:
        next_date = min_date + interval_duration
        if next_date >= max_date:
            next_date = max_date
        results.append((min_date, next_date))
        min_date = next_date
    return results


def get_partition_ranges_of_size(range_size, min_date, max_date):
    auth = json.load(open('../../config.json'))
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    result = sql.getPartitionRangesOfSize(range_size, min_date, max_date)
    sql.close()
    return result
