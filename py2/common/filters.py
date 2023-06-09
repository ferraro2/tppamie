# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals
import re, time, io
from emojilist import EMOJI

PBR_INPUTS = r"[\dabcdulspk-]{0,4}"
HASH_INPUTS = r"[\dabcdulspk-]{0,2}"

commandPat = re.compile(r"""
^!.*
""", re.VERBOSE | re.IGNORECASE)

matchCommandPat = re.compile(r"""
^
    \s*
    (?:
        !bet\s+.* |
        \#bet\s*(?:red|blue).* |
        !balance\s?.* |
        !""" + PBR_INPUTS + r""" |
        \#""" + HASH_INPUTS + r""" |
        \#""" + HASH_INPUTS + r""" |
        !move \s """ + PBR_INPUTS + r""" |
    )
    \s*
$
""", re.VERBOSE | re.IGNORECASE)


WHITELIST = """!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~Ééヽ༼ຈل͜༽ﾉ♫ ┌┘ ♪─≡Σ✿◕‿◉͟͡°͜ʖつಠᕙᕗᕦᕤ♀♂"""

CHAR_WHITELIST = u"""€♤□♢■♧•♡°☆¤》▪♂µノè¡¿༼ つ ◕‿◕✿ ༽つ…ヽ༼ຈل͜ຈ༽ﾉ ༼ ºل͟º ༽୧
    ༼ ͡◉ل͜ ͡◉༽୨ (ง ͠° ل͜ °)ง ヽ༼ʘ̚ل͜ʘ̚༽ﾉ୧༼ಠ益ಠ༽୨乁( ◔ ౪◔)ㄏ─=≡Σ((( つ◕ل͜◕)つ (ง •̀_•
    )ง┌(° ͜ʖ͡°)┘(ง ͠ ͠° ل͜ °)งᕙ༼◕ل͜◕༽ᕗ.༼ຈل͜ຈ༽ﾉ༼ ºل͟º ༽ ୧༼ ͡◉ل͜ ͡◉༽୨ (ง ͠° ل͜ °)ง ヽ
    ༼ʘ̚ل͜ʘ̚༽ﾉ୧༼ಠ益ಠ༽୨乁( ◔ ౪◔)ㄏ─=≡Σ((( つ◕ل͜◕)つ (ง •̀_•́)ง┌(° ͜ʖ͡°)┘(ง ͠ ͠° ل͜°)งᕙ
    ༼◕ل͜◕༽ᕗ└┐(﻿ ͡° ͜ʖ ͡°)└༼ - ل͜ - ༽┐ヽ༼.ل͜.༽ﾉヽ༼ຈل͜ຈ༽ノ♀ᕦຈلﾉ༼ຈ༽لᕤ¢[̲$̲(̲ ͡° ͜ʖ ͡°̲)̲$̲]
    卅ù?ß×└┐☐☑( ͡° ͜ʖ ͡°)ヽ༼ຈل͜ರೃ༽ﾉヽ༼ຈل͜ຈ༽ﾉ༼ つ ◕_◕ ༽つヽ༼ຈل͜ຈ༽ﾉ༼ຈل͜ຈ༽♫┌༼ຈل͜ຈ༽ʕ ·ᴥ·ʔ¯\_(ツ)_/¯ジッ
ᕕ(ᐛ)ᕗ 
    ┘♪♪’“”£!¨§æø´áéíóúçüäåñöéÉÑÇ abcdefghijklmnopqrstuvwxyz
    1234567890`~!@#$%^&*()_+-=[]{};':\",.<>/?\\|¥·₽
àáaäèéêëìíîïòóôöæùúûüçñß¡¿€¢£Ōō⨕""" + "".join(EMOJI)
CHARS_NOT_IN_WHITELIST_PAT = re.compile(r"[^" + re.escape("".join(set(CHAR_WHITELIST))) + "]", re.IGNORECASE)

INPUT_WORDS = [
    "left", "right", "up", "down",
    "start", "select",
    "democracy", "anarchy", "wait",
    "move", "switch", "run", "item",
    "cup", "cdown", "cright", "cleft",
    "dup", "ddown", "dright", "dleft"]

INPUT_WORDS2 = (
    r"""
    (?:r|l|<|>|left|right)?
    (?:
        # match cpad/dpad/lstick/rstick/analogstick etc
        [cdlra]? (?:
            left|right|up|down|
            e|s|w|n|
            stick|spinl|spinr
        )
        |
        a|b|x|y|l|r|z|
        zl|zr|sl|sr|
        start|select|
        cross|circle|triangle|square|
        democracy|anarchy|wait|
        move|switch|run|item|
        plus|minus|home|
        with|catch|throw|bag|
        lsb|rsb|status|items|poke|
        reuse|heal|mega|quit|back|
        cancel|exp|experience|p|
        \d+
    )
    """
)

INPUT_WORDS_REGEX = r"({})".format("|".join(INPUT_WORDS))

INPUT_WORDS_PAT = re.compile(INPUT_WORDS_REGEX, re.IGNORECASE)
ALL_INPUT_CHARS_PAT = re.compile(r'^[abxyzlr\d\s+,]+$', re.IGNORECASE)

MISTY_WORDS_PAT = re.compile("""
(
    misty |
    whitney |
    milk |
    guys |
    we have to |
    we need to |
    fist |
    mist |
    beat |
    udder
)
""", re.IGNORECASE | re.VERBOSE)


def isCommand(msg):
    return commandPat.match(msg) is not None


def isMatchCommand(msg):
    return matchCommandPat.match(msg) is not None


def isInput(msg):
    if len(msg) <= 1:
        return True
    wordless = INPUT_WORDS_PAT.sub(' ', msg)
    inputMatch = ALL_INPUT_CHARS_PAT.match(wordless)
    return inputMatch is not None


ALL_INPUT_CHARS_PAT2 = re.compile(r"""
^
    \s*
    """ + INPUT_WORDS2 + r"""
    \d*  # match the 9 in start9
    (?:
        [+,\-><~]+
        """ + INPUT_WORDS2 + r"""
        \d*
    )*
    [+-~><]?
    \s*
$
""", re.IGNORECASE | re.VERBOSE)


BOT_USERNAMENAMES = re.compile(r"""
^
    tpp|tppinfobot|tppbankbot|tppbalancebot|visualizebot|tpphelpbot|tppsimulator
$
""", re.IGNORECASE | re.VERBOSE)


def isInput2(msg):
    if len(msg) <= 1:
        return True
    inputMatch = ALL_INPUT_CHARS_PAT2.match(msg)
    return inputMatch is not None


def isMisty(msg):
    score = 0
    for match in MISTY_WORDS_PAT.finditer(msg):
        score += 1
    return score >= 2


def passesCharacterWhitelist(msg):
    for c in msg:
        if c not in WHITELIST:
            return False
    return True


def passesCharacterWhitelist2(msg):
    return not any(True for _ in CHARS_NOT_IN_WHITELIST_PAT.finditer(msg))


def isUserBot(username):
    return BOT_USERNAMENAMES.match(username) is not None


def passesAllFilters(msg):
    return not (isInput2(msg) or isMatchCommand(msg) or isMisty(msg) or not passesCharacterWhitelist2(msg))


# expects a condensed message: ' '.join(msg.split()
def filterMsg(msg, field):
    if field == 'command' or field == 'cmd':
        return isCommand(msg)
    elif field == 'input':
        return isInput(msg)
    elif field == 'misty':
        return isMisty(msg)
    elif field == 'whitelist':
        return passesCharacterWhitelist(msg)


def main():
    test1()


def test1():
    failures = []
    positives = ['anarchy', 'AnarCHy', 'ANARCHY', '  anarchy', 'anarchy  ', 'anarchy+anarchy']
    positives += ['a+left', 'a,left', 'a+left+a']
    positives += ['start9', 'a+120,100', 'e+s-', 'lstick+e', 'RLEFT', '<left', 'lstart', 'lstart9']
    positives += ['a', 'b', 'start', 'l', 'zl', '>l']

    positives += ['!balance', '!bet 100 red', '!bet 514 tgqr']
    positives += ['!a', '!move a', '!-', '!c', '!3', '!move c', '!baba']
    positives += ['!aucl', '!ap', '!l']

    positives += ['beat misty']

    positives += [
        'ỏ̷͖͈̞̩͎̻̫̫̜͉̠̫͕̭̭̫̫̹̗̹͈̼̠̖͍͚̥͈̮̼͕̠̤̯̻̥̬̗̼̳̤̳̬̪̹͚̞̼̠͕̼̠̦͚̫͔̯̹͉͉̘͎͕̼̣̝͙̱̟̹̩̟̳̦̭͉̮̖̭̣̣̞̙̗̜̺̭̻̥͚͙̝̦̲̱͉͖͉̰̦͎̫̣̼͎͍̠̮͓̹̹͉̤̰̗̙͕͇͔̱͕̭͈̳̗̭͔̘̖̺̮̜̠͖̘͓̳͕̟̠̱̫̤͓͔̘̰̲͙͍͇̙͎̣̼̗̖͙̯͉̠̟͈͍͕̪͓̝̩ ỏ̷͖͈̞̩͎̻̫̫̜͉̠̫͕̭̭̫̫̹̗̹͈̼̠̖͍͚̥͈̮̼͕̠̤̯̻̥̬̗̼̳̤̳̬̪̹͚̞̼̠͕̼̠̦͚̫͔̯̹͉͉̘͎͕̼̣̝͙̱̟̹̩̟̳̦̭͉̮̖̭̣̣̞̙̗̜̺̭̻̥͚͙̝̦̲̱͉͖͉̰̦͎̫̣̼͎͍̠̮͓̹̹͉̤̰̗̙͕͇͔̱͕̭͈̳̗̭͔̘̖̺̮̜̠͖̘͓̳͕̟̠̱̫̤͓͔̘̰̲͙͍͇̙͎̣̼̗̖͙̯͉̠̟͈͍͕̪͓̝̩']

    positives += ['░░░░░▀▀▓▓▓▓▓▓ ▓▓▓▀░░░░░▄██▄░░░░░▀▓▓▓ ▓▓░░░░░▄▄██▀░░░░░░░░▓▓ ▓░░░░░▄██▀░░░▄█▄░░░░░▓ ▌░░░░░▀██▄▄▄████']
    positives += ['!bet 19246 red PogChamp', '!balance deky', '   anarchy+ ', 'anarchy+anarchy+']


    positives += ['!bet p100 red', '!bet blue p20', '!bet P100 red', '!bet blue P20',
                  '#1', '#a', '#-', '#betred 200', '#betBLUE 105']

    negatives = ['badge from misty', 'ヽ༼ຈل͜ຈ༽ﾉ', '༼ つ ◕_◕ ༽つ']
    negatives += ['i like anarchy', 'anarchy is great', 'anarchy!', 'anarchy, anarchy+,',
                  '+anarchy+anarchy+anarchy']
    negatives += ['select sect', 'a +left', '  a + left + b +   ']
    negatives += ['select a']
    negatives += ['!a move a', '!- just stop', '!babyrage']

    negatives += ['   left4baba anarchy105812 +1035,3  ', ' lara baba wait4baba1234 ']

    # condense
    positives = [' '.join(msg.split()) for msg in positives]
    negatives = [' '.join(msg.split()) for msg in negatives]

    # test is-worthy messages
    for msg in positives:
        if passesAllFilters(msg):
            failures.append(msg)

    # print positive results
    if failures:
        print("FAILED: The following messages were NOT ignored:")
        for fail in failures:
            print(fail.encode('utf-8'))
    else:
        print("All positive tests passed.")

    # test real messages
    failures = []
    for msg in negatives:
        if not passesAllFilters(msg):
            failures.append(msg)

    # print negative results
    if failures:
        print("FAILED: The following messages were ignored:")
        for fail in failures:
            print(fail.encode('utf-8'))
    else:
        print("All negative tests passed.")


if __name__ == "__main__":
    main()

