import json
import requests
import time
import sys
import re

paths = [r"../common"]
for path in paths:
    sys.path.insert(0, path)

# from common
from chat_sql import ChatSql
import patterns

USERID_TWITCHPLAYSPOKEMON = "56648155"



def main():
    auth = json.load(open('../../oauth.json'))

    (tpp_badges, global_badges) = fetch(auth['twitchAPI'])

    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])

    all_badges = {}

    for badge_set in all_badges:
        for badge in badge_set['versions']:
            all_badges[badge_set['set_id'] + '/' + badge['id']] = badge

    # do tpp_badges second so that any duplicates give the tpp version
    for badge_set in tpp_badges:
        for badge in badge_set['versions']:
            all_badges[badge_set['set_id'] + '/' + badge['id']] = badge

    for badge_id, badge in all_badges.items():
        title = badge['title']
        description = badge['description']
        match = re.match(patterns.badgeUrlPat, badge['image_url_1x'])
        if match:
            url_id = match.group('url')
            sql.insertBadges((badge_id, url_id, title, description))
        else:
            print("badge didn't match url pattern")
            print(badge)
            # sql.close()
            # return

    sql.commit()
    sql.close()


def fetch(auth):
    header_client_id = auth['client_id']
    header_authorization = 'Bearer ' + auth['oauth']

    session = requests.Session()
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

    with open("tpp_badges.json", "w") as outfile:
        outfile.write(json.dumps(tpp_badges, indent=4))

    with open("global_badges.json", "w") as outfile:
        outfile.write(json.dumps(global_badges, indent=4))

    return tpp_badges, global_badges


if __name__ == '__main__':
    main()
