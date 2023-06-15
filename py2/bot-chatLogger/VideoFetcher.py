import json
import requests
import re
import sys

sys.path.insert(0, r"../")
import common

USERID_TWITCHPLAYSPOKEMON = 56648155


class VideoFetcher:
    def __init__(self):
        auth = json.load(open('../../config.json'))['twitchAPI']
        header_client_id = auth['client_id']
        header_authorization = 'Bearer ' + auth['oauth']
        self.session = requests.Session()
        self.session.headers = {
            'Client-ID': header_client_id,
            'Authorization': header_authorization,
            'content-type': 'application/json'
        }

    def fetchSingleLatest(self):
        response = self.session.get(
            'https://api.twitch.tv/helix/videos',
            params={
                'user_id': USERID_TWITCHPLAYSPOKEMON,
                'sort': 'time',
                'type': 'archive',
                'first': '1',
            }
        )
        response.raise_for_status()
        response_json = response.json()
        return response_json['data'][0]

    def close(self):
        self.session.close()
