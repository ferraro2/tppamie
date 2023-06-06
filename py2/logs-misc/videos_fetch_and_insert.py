import json
import requests
import re
import time

paths = [r"../common"]
for path in paths:
    sys.path.insert(0, path)

# from common
from chat_sql import ChatSql
import patterns


USERID_TWITCHPLAYSPOKEMON = 56648155


def main():
    with open("api_auth.json", "r") as infile:
        auth = json.load(open('api_auth.json'))

    results = fetch_videos(auth)

    with open("all_tpp_videos.json", "w") as outfile:
        outfile.write(json.dumps(results, indent=4))

    insert_videos(auth, results)


def insert_videos(auth, videos):
    sql = ChatSql('tpp_chat', auth['mysql']['user'], auth['mysql']['pass'])

    all_badges = {}

    for video in videos:
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


def fetch_videos(auth):
    header_client_id = auth['client_id']
    header_authorization = 'Bearer ' + auth['oauth']

    results = []

    session = requests.Session()
    session.headers = {
        'Client-ID': header_client_id,
        'Authorization': header_authorization,
        'content-type': 'application/json'
    }
    response = session.get(
        'https://api.twitch.tv/helix/videos',
        params={
            'user_id': USERID_TWITCHPLAYSPOKEMON,
            'sort': 'time',
            'type': 'archive'
        }
    )

    response.raise_for_status()
    response_json = response.json()
    results.extend(response_json['data'])

    # print(response_json)
    print(len(results))

    while response_json['pagination']:
        # time.sleep(2)
        response = session.get(
            'https://api.twitch.tv/helix/videos',
            params={
                'user_id': USERID_TWITCHPLAYSPOKEMON,
                'sort': 'time',
                'type': 'archive',
                'first': 100,
                'after': response_json['pagination']['cursor']
            }
        )

        response.raise_for_status()
        response_json = response.json()
        results.extend(response_json['data'])

        print(len(results))

    print(len(results))

    return results


if __name__ == '__main__':
    main()
