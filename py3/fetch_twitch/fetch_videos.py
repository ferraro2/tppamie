import json
import requests
import time

USERID_TWITCHPLAYSPOKEMON = 56648155


def main():
    with open("api_auth.json", "r") as infile:
        auth = json.load(open('api_auth.json'))
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

    with open("all_tpp_videos.json", "w") as outfile:
        outfile.write(json.dumps(results, indent=4))


if __name__ == '__main__':
    main()
