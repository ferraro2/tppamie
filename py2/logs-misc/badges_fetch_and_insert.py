import json
import traceback

import requests
import time
import sys
import re

paths = [r"../"]
for path in paths:
    sys.path.insert(0, path)

# from common
from common import patterns
from common.chat_sql import ChatSql

USERID_TWITCHPLAYSPOKEMON = "56648155"


def main():
    while True:
        try:
            fetch_and_insert()
            print('done, sleeping')
            time.sleep(60)
        except Exception:
            traceback.print_exc()
            time.sleep(60)
        except KeyboardInterrupt:
            return


def fetch_and_insert():
    auth = json.load(open('../../config.json'))

    (tpp_badges, global_badges) = fetch(auth['twitchAPI'])

    # print(tpp_badges)
    # return

    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])
    try:
        all_badges = {}

        global_count = 0
        tpp_count = 0

        for badge_set in global_badges:
            for badge in badge_set['versions']:
                all_badges[badge_set['set_id'] + '/' + badge['id']] = badge
                global_count += 1

        # do tpp_badges second so that duplicates give the tpp version
        for badge_set in tpp_badges:
            for badge in badge_set['versions']:
                all_badges[badge_set['set_id'] + '/' + badge['id']] = badge
                tpp_count += 1

        print("fetch found %d global badge sets and %d tpp badge sets"
              " (expecting ~217 and ~62)\n"
              "total to insert after combining: %d (expecting ~264)"
              % (global_count, tpp_count, len(all_badges)))

        print('Attempting inserts into badges table')
        for badge_id, badge in all_badges.items():
            match = re.match(patterns.badgeUrlPat, badge['image_url_1x'])
            if match:
                url_id = match.group('url')
            else:
                raise Exception("badge %s didn't match url pattern" % badge)
            badge_insert = {
                "badge_id": badge_id,
                "title": badge['title'],
                "description": badge['description'],
                "url_id": url_id,
            }
            badge_update = badge_insert.copy()
            del badge_update['badge_id']
            # print(badge_insert)
            sql.insert("badges", badge_insert, duplicateUpdateItems=badge_update)
            sql.commit()
    finally:
        sql.close()


def fetch(auth):
    print('attempting fetch')
    header_client_id = auth['client_id']
    header_authorization = 'Bearer ' + auth['oauth']

    session = requests.Session()
    try:
        session.headers = {
            'Client-ID': header_client_id,
            'Authorization': header_authorization,
            'content-type': 'application/json'
        }
        response = session.get(
            'https://api.twitch.tv/helix/chat/badges?broadcaster_id=' + USERID_TWITCHPLAYSPOKEMON,
            params={
            }
        )
        response.raise_for_status()
        tpp_badges = response.json()['data']


        response = session.get(
            'https://api.twitch.tv/helix/chat/badges/global',
            params={
            }
        )
        response.raise_for_status()
        global_badges = response.json()['data']

        with open("tpp_badges.gitignore.json", "w") as outfile:
            outfile.write(json.dumps(tpp_badges, indent=4))

        with open("global_badges.gitignore.json", "w") as outfile:
            outfile.write(json.dumps(global_badges, indent=4))

        return tpp_badges, global_badges
    finally:
        session.close()


if __name__ == '__main__':
    main()
