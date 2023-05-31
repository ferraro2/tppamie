import json
import requests
import time


############################################################################################################
############################################################################################################
# This is a lightly modified copy of  https://gist.github.com/tung/20de3e992ca3a6629843e8169dc0398e
############################################################################################################
############################################################################################################

#!/usr/bin/env python3

#
# A script to download chat from a Twitch VOD and print it to a terminal.
# Chat will be downloaded all the way until it ends.
#
# Usage: TWITCH_CLIENT_ID=0123456789abcdef0123456789abcde twitch-vod-chat.py [video_id] [start]
#
# This script could break at any time, because Twitch's chat API is
# undocumented and likes to change at any time; in fact, this script was
# created because Twitch got rid of rechat.twitch.tv.
#

import json
import os
import requests
import sys
import time
import types


def time_to_hhmmss(t):
    hours = int(t // 3600)
    minutes = int((t - hours * 3600) // 60)
    seconds = int(t - hours * 3600 - minutes * 60)
    milliseconds = int((t - hours * 3600 - minutes * 60 - seconds) * 1000)
    return "{0}:{1:02}:{2:02}.{3:<03}".format(hours, minutes, seconds, milliseconds)


def lighten_color(color):
    r = color.r * 3 // 4 + 63
    g = color.g * 3 // 4 + 63
    b = color.b * 3 // 4 + 63
    return types.SimpleNamespace(r=r, g=g, b=b)


def message_color(comment):
    color_by_name = {
            'white': (255, 255, 255),
            'black': (0, 0, 0),
            'red': (255, 0, 0),
            'green': (0, 255, 0),
            'blue': (0, 0, 255),
            'yellow': (255, 255, 0),
            'gray': (128, 128, 128),
            'magenta': (255, 0, 255),
            'cyan': (0, 255, 255)
            }
    r = 128
    g = 128
    b = 128
    if 'userColor' in comment['message'] and comment['message']['userColor']:
        user_color = comment['message']['userColor']
        if len(user_color) == 7 and user_color[0] == '#':
            r = int(user_color[1:3], 16)
            g = int(user_color[3:5], 16)
            b = int(user_color[5:7], 16)
        elif user_color in color_by_name:
            c = color_by_name[user_color]
            r = c[0]
            g = c[1]
            b = c[2]
    return types.SimpleNamespace(r=r, g=g, b=b)


def badge_icons(message):
    b = ''
    if 'userBadges' in message:
        for badge in message['userBadges']:
            if badge['setID'] == 'broadcaster':
                b += '🎥'
            elif badge['setID'] == 'moderator':
                b += '⚔'
            elif badge['setID'] == 'subscriber':
                b += '★'
            elif badge['setID'] == 'staff':
                b += '⛨'
    return b


def simple_name(commenter):
    if commenter == None:
        return "(null)"
    name = commenter['login']
    display_name = commenter['displayName']
    if display_name:
        c = display_name[0].lower()
        if (c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == '_':
            name = display_name
    return name


def format_message(comment):
    time = comment['contentOffsetSeconds']
    badges = badge_icons(comment['message'])
    name = simple_name(comment['commenter'])
    color = lighten_color(message_color(comment))

    message = "".join([f['text'] for f in comment['message']['fragments']])
    #if comment['message']['is_action']:
    #    message = '\033[38;2;' + str(color.r) + ';' + str(color.g) + ';' + str(color.b) + 'm' + message + '\033[0m'

    nick = '\033[38;2;{c.r};{c.g};{c.b}m<{badges}{name}>\033[0m'.format(badges=badges, name=name, c=color)
    if 'userBadges' in comment['message']:
        is_broadcaster = False
        for badge in comment['message']['userBadges']:
            if badge['setID'] == 'broadcaster':
                is_broadcaster = True
                break
        if is_broadcaster:
            nick = '\033[7m' + nick

    return "\033[94m{time}\033[0m {nick} {message}".format(time=time_to_hhmmss(time), nick=nick, message=message)


def print_response_messages(data, start):
    for comment in data['comments']['edges']:
        if comment['node']['contentOffsetSeconds'] < start:
            continue
        print(format_message(comment['node']))


################################################################################

if len(sys.argv) < 3 or 'TWITCH_CLIENT_ID' not in os.environ:
    print('Usage: TWITCH_CLIENT_ID=[client_id] {0} [video_id] [start]'.format(sys.argv[0]), file=sys.stderr)
    sys.exit(1)
video_id = sys.argv[1]
start = int(sys.argv[2])

session = requests.Session()
session.headers = { 'Client-ID': os.environ['TWITCH_CLIENT_ID'], 'content-type': 'application/json' }

response = session.post(
    'https://gql.twitch.tv/gql',
    "[{\"operationName\":\"VideoCommentsByOffsetOrCursor\"," +
        "\"variables\":{\"videoID\":\"" + video_id + "\",\"contentOffsetSeconds\":" + str(start) + "}," +
        "\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a\"}}}]",
    timeout=10)
response.raise_for_status()
data = response.json()

print_response_messages(data[0]['data']['video'], start)

cursor = None
if data[0]['data']['video']['comments']['pageInfo']['hasNextPage']:
    cursor = data[0]['data']['video']['comments']['edges'][-1]['cursor']
    time.sleep(0.1)

print("POSTING WITH CURSOR")
while cursor:
    response = session.post(
        'https://gql.twitch.tv/gql',
        "[{\"operationName\":\"VideoCommentsByOffsetOrCursor\"," +
            "\"variables\":{\"videoID\":\"" + video_id + "\",\"cursor\":\"" + cursor + "\"}," +
            "\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a\"}}}]",
        timeout=10)
    response.raise_for_status()
    data = response.json()

    print_response_messages(data[0]['data']['video'], start)

    if data[0]['data']['video']['comments']['pageInfo']['hasNextPage']:
        cursor = data[0]['data']['video']['comments']['edges'][-1]['cursor']
        time.sleep(0.1)
    else:
        cursor = None