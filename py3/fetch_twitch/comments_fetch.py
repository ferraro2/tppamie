#!/usr/bin/env py3
import contextlib
import json
import queue
import signal
import traceback
from queue import Queue
from multiprocessing import Manager, Pool

import requests
from collections import namedtuple
import time
import random
import sys

import pymongo
from pymongo.errors import CollectionInvalid

"""
Terms:
    video = video dict from twitch Helix videos endpoint
    video_progress = progress for each video, in terms of comment-fetching. 
        Start fetching comments at offest of 0 seconds and advance from there.
        Mark completed when done.
        Populates <VIDEOS_PROGRESS_TABLE_NAME> table. 
    {
        "video": <video>, 
        "completed": <bool>, 
        "offset_seconds": <int>
    }  
    gqlComment = chat message dict from twitch GQL VideoCommentsByOffsetOrCursor endpoint
    comment = gqlComment with added field of video_id = <video['id']>.
        Populates <COMMENTS_TABLE_NAME> table.
        
Usage:
     - populate gql_session_headers.json
     - run this script
     
    If this script exits midway because twitch invalidates your authentication,
    update the changing fields of gql_session_headers.json and run it again
    to resume progress.
    
    To clear progress, run this script with the -r option.  This marks all videos as 
    unprocessed, but does not delete any fetched comments. 
"""

MONGO_SERVER_URI = '127.0.0.1:27017'
VIDEOS_JSON_FILENAME = 'all_tpp_videos.json'
DB_NAME = 'amie'
VIDEOS_PROGRESS_TABLE_NAME = 'videos_progress'
COMMENTS_TABLE_NAME = 'comments2'
NUM_PROCESSES = 10
PRINT_PROGRESS_PER_N_PAGES = 500
VIDEOS_PROGRESS_SORT_CREATED_AT = pymongo.ASCENDING

# must clear progress with -r for this to update
ONLY_VIDEOS_AFTER_DATE = '2016-03-02T00:00:00Z'

VideoWork = namedtuple("VideoWork", "video offset_seconds queue_pos")


def main():
    reset_progress = bool(len(sys.argv) > 1 and sys.argv[1] == '-r')

    with Manager() as manager:
        video_work_queue = manager.Queue()
        populate_video_work_queue(video_work_queue, reset_progress)

        total_queued = video_work_queue.qsize()

        # Each process grabs a VideoWork and fetches the remaining comments for that video
        with Pool(NUM_PROCESSES) as pool:
            for i in range(NUM_PROCESSES):
                pool.apply_async(
                    video_work_consumer,
                    (video_work_queue, total_queued),
                    error_callback=lambda err: terminate_pool_and_raise(err, pool))
            pool.close()
            try:
                pool.join()
            except KeyboardInterrupt:
                pool.terminate()


def video_work_consumer(video_work_queue: Queue, total_queued):
    while True:
        mongodb_client = pymongo.MongoClient(MONGO_SERVER_URI)
        db = mongodb_client[DB_NAME]
        try:
            video_work: VideoWork = video_work_queue.get(block=False)
            video = video_work.video
            offset_seconds = video_work.offset_seconds
            created_at = video['created_at']
            print(f"Starting video  {created_at} at {offset_seconds}s "
                  f"({video_work.queue_pos + 1} / "
                  f"{total_queued})")
            fetch_video_comments_after_offset(db, video, offset_seconds)

            db[VIDEOS_PROGRESS_TABLE_NAME].update_one(
                {"video.created_at": created_at},
                {"$set": {"completed": True}},
            )

        except queue.Empty:
            return
        except KeyboardInterrupt:
            raise Exception("Ctrl-c, goodbye")


def terminate_pool_and_raise(exception, pool):
    pool.terminate()
    raise exception


def populate_video_work_queue(video_work_queue, reset_progress):
    mongodb_client = pymongo.MongoClient(MONGO_SERVER_URI)
    db = mongodb_client[DB_NAME]

    create_fetch_progress_table(db)
    if reset_progress:
        reset_video_progress(db)

    # There's one VideoWork entry per video. Just stuff them all in the queue in chronological order
    for i, uncompleted_video_progress in enumerate(find_uncompleted_videos_progress(db)):
        video_work_queue.put(
            VideoWork(
                video=uncompleted_video_progress['video'],
                offset_seconds=uncompleted_video_progress['offset_seconds'],
                queue_pos=i,
            )
        )
    mongodb_client.close()
    return video_work_queue


def fetch_video_comments_after_offset(db, video, offset_seconds):
    session = requests.Session()
    session.headers = json.load(open('gql_session_headers.json'))

    video_id = video['id']
    num_page = 1
    num_comments_seen = 0
    num_comments_upserted = 0

    cursor = 0
    is_first_page = True

    while cursor or is_first_page:
        if num_page % PRINT_PROGRESS_PER_N_PAGES == 1:
            print_page_progress(video, num_page, num_comments_seen, num_comments_upserted)
        if cursor:
            response_json = fetch_one_response_json(session, video_id, cursor=cursor)
        else:
            response_json = fetch_one_response_json(session, video_id, seconds=offset_seconds)

        bulk_result = upsert_from_response_json(db, response_json, video_id)
        if bulk_result:
            num_comments_seen += bulk_result.matched_count + bulk_result.upserted_count
            num_comments_upserted += bulk_result.upserted_count

        cursor = get_nextpage_cursor(response_json)

        if cursor:
            latest_offset_seconds = get_latest_comment_seconds_offset(response_json)
            update_video_progress(db, video['created_at'], latest_offset_seconds)

        # write a sample file
        # if is_first_page:
        #     with open("video_message_sample.json", "w") as outfile:
        #         outfile.write(json.dumps(response_json, indent=4))
        #         print("response written to sample json")

        # stop after first response
        # if num_page == 1:
        #     exit(0)

        is_first_page = False
        num_page += 1


def get_latest_comment_seconds_offset(response_json):
    # print(response_json[0]['data']['video']['comments']['edges'])
    return response_json[0]['data']['video']['comments']['edges'][-1:][0]['node']['contentOffsetSeconds']


def update_video_progress(db, created_at, offset_seconds):
    result = db[VIDEOS_PROGRESS_TABLE_NAME].update_one(
        {"video.created_at": created_at},
        {"$set": {"offset_seconds": offset_seconds}},
    )


def read_videos_from_json(filepath):
    with open(filepath) as f:
        videos = json.load(f)
    videos.sort(key=lambda e: e['created_at'])
    return videos


def create_fetch_progress_table(db):
    with contextlib.suppress(CollectionInvalid):
        db.create_collection(VIDEOS_PROGRESS_TABLE_NAME)


def reset_video_progress(db):
    db[VIDEOS_PROGRESS_TABLE_NAME].delete_many({})
    videos = read_videos_from_json(VIDEOS_JSON_FILENAME)
    insert_unstarted_fetch_progress(db, videos)


def insert_unstarted_fetch_progress(db, videos):
    ops = []
    for video in videos:
        created_at = video['created_at']
        # videos prior to this date have no comments so exclude them
        if ONLY_VIDEOS_AFTER_DATE < created_at:
            ops.append(pymongo.InsertOne({
                "completed": False,
                "offset_seconds": 0,
                "video": video,
            }))
    db[VIDEOS_PROGRESS_TABLE_NAME].bulk_write(ops, ordered=False)


def find_uncompleted_videos_progress(db):
    return (db[VIDEOS_PROGRESS_TABLE_NAME]
            .find({"completed": False})
            .sort("video.created_at", direction=VIDEOS_PROGRESS_SORT_CREATED_AT)
            )


def print_page_progress(video, page, num_comments_matched, num_comments_upserted):
    print(f"\tFetching video {video['created_at']} {video['duration']}"
          f" page {page},"
          f" new comments so far in this video: {num_comments_upserted} / {num_comments_matched}")


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
        with open("badegg.json", "w") as outfile:
            outfile.write(json.dumps(response_json, indent=4))
        raise Exception('unexpexted jsonresponse. exiting')

    return response_json


def upsert_from_response_json(db, response_json, video_id):
    table = db[COMMENTS_TABLE_NAME]
    try:
        edges = response_json[0]['data']['video']['comments']['edges']
    except TypeError as e:
        raise Exception("Exception likely due to stale GQL credentials", e)
    ops = []

    for edge in edges:
        node = edge['node']
        node['video_id'] = video_id
        ops.append(pymongo.UpdateOne(
            {"_id": node['id']},
            {
                "$setOnInsert": node
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
