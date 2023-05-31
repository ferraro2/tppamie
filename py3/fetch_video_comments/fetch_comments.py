#!/usr/bin/env py3

import json
import requests
import time
import random
import sys

import pymongo
from multiprocessing import Pool


def main():
    pass
    # slices = calc_slices(0, 1880, 100)
    # print(slices)
    # print(len(slices))

    # fetch_multiprocess(slices)

    # fetch()


def calc_slices(start, end, per_slice):
    slices = []
    num = start
    while num < end:
        slices.append((num, num + per_slice))
        num += per_slice
    return slices


def fetch_multiprocess(slices):
    with Pool(len(slices)) as p:
        print(p.starmap(fetch, slices))


def fetch(videos_slice_start=0, videos_slice_end=-1):
    with open('all_tpp_videos.json') as f:
        videos = json.load(f)
    # Change to chronological order
    videos.reverse()
    videos = [v for v in videos if v['created_at'] > '2016-03-01T00:00:00Z']  # Prior videos have no comments at all

    # print(len(videos))
    # print(videos[182]['created_at'])
    # exit()

    if videos_slice_end == -1:
        videos_slice_end = len(videos)
    videos = videos[videos_slice_start:videos_slice_end]

    video_ids = [vid['id'] for vid in videos]

    mongodb_client = pymongo.MongoClient('127.0.0.1:27017')
    amie_db = mongodb_client['amie']
    comments_table = amie_db['comments']

    session = requests.Session()
    session.headers = json.load(open('gql_session_headers.json'))

    for video_index, video_id in enumerate(video_ids):
        num_page = 0
        num_comments_seen = 0
        num_comments_upserted = 0

        seconds_offset = 0
        cursor = 0
        is_first_page = True

        while cursor or is_first_page:
            if num_page % 100 == 0:
                print_progress(video_index, videos, num_page, num_comments_seen, num_comments_upserted)
            if cursor:
                response_json = fetch_one_response_json(session, video_id, cursor=cursor)
            else:
                response_json = fetch_one_response_json(session, video_id, seconds=seconds_offset)

            bulk_result = upsert_from_response_json(comments_table, response_json)
            if bulk_result:
                num_comments_seen += bulk_result.matched_count + bulk_result.upserted_count
                num_comments_upserted += bulk_result.upserted_count

            cursor = get_nextpage_cursor(response_json)

            # stop after first response
            # if is_first_page:
            #     with open("video_message_sample.json", "w") as outfile:
            #         outfile.write(json.dumps(response_json, indent=4))
            # if num_page == 1:
            #     exit(0)

            is_first_page = False
            num_page += 1

            # time.sleep(random.randint(0, 3))

        # if num_comments_seen > 3000:
        #     time.sleep(random.randint(60, 180))

        # assume all comments in the next videos are in the db already
        # if num_comments_matched != 0 and num_comments_upserted == 0:
        #     print("video had comments but none were upserted. Exiting early")
        #     return
    return 1


def print_progress(video_index, videos, page, num_comments_matched, num_comments_upserted):
    print(f"Fetching video {videos[video_index]['created_at']} {videos[video_index]['duration']}  "
          f"{video_index} / {len(videos)}, page {page}, "
          f"new comments so far in this video: {num_comments_upserted} / {num_comments_matched}")


def fetch_one_response_json(session, video_id, cursor=None, seconds=None):
    if cursor:
        start_or_cursor = f'"cursor": "{cursor}"'
    else:
        start_or_cursor = f'"contentOffsetSeconds": {seconds}'

    # I tried putting \"limit\":10, in the variables section but it did nothing. tried first, pageSize, edgeSize, etc etc etc
    response = session.post(
        'https://gql.twitch.tv/gql',
            "[{\"operationName\":\"VideoCommentsByOffsetOrCursor\"," +
            "\"variables\":{\"videoID\":\"" + str(video_id) + "\"," + start_or_cursor + "}," +
            "\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a\"}}}]",
        timeout=10)
    response.raise_for_status()
    response_json = response.json()

    if len(response_json) > 1:
        print('unexpexted jsonresponse. exiting')
        with open("badegg.json", "w") as outfile:
            outfile.write(json.dumps(response_json, indent=4))
        exit(1)

    return response_json


def upsert_from_response_json(table, response_json):
    edges = response_json[0]['data']['video']['comments']['edges']
    ops = []

    for edge in edges:
        ops.append(pymongo.UpdateOne(
            {"_id": edge['node']['id']},
            {
                "$setOnInsert": {"node": edge['node']}
            },
            upsert=True,
        ))

    bulk_result = None
    if ops:
        bulk_result = table.bulk_write(ops, ordered=False)

    return bulk_result


def get_nextpage_cursor(response_json):
    cursor = None
    if response_json[0]['data']['video']['comments']['pageInfo']['hasNextPage']:
        cursor = response_json[0]['data']['video']['comments']['edges'][-1]['cursor']
    return cursor


if __name__ == '__main__':
    main()
