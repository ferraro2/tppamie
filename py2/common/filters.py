# -*- coding: utf-8 -*-
from __future__ import division, print_function, unicode_literals
import re, time, io

PBR_INPUTS = "(?:a|b|c|d|u|l|s|p|k|-)"

commandPat = re.compile(r"""
^
(
	!bet \s+ p?\d* \s+ \w* |
	!bet \s+ \w* \s+ p?\d* |
	\#bet\w+ \s+ p?\d* |
	\#.* |
	!balance |
	!""" + PBR_INPUTS + r"""+ |
	\#""" + PBR_INPUTS + r"""+ |
	!move \s """ + PBR_INPUTS + r"""+ |
)
$
""", re.VERBOSE | re.IGNORECASE)

WHITELIST = """!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~Ééヽ༼ຈل͜༽ﾉ♫ ┌┘ ♪─≡Σ✿◕‿◉͟͡°͜ʖつಠᕙᕗᕦᕤ♀♂"""

INPUT_WORDS = [
    "left", "right", "up", "down",
    "start", "select",
    "democracy", "anarchy", "wait",
    "move", "switch", "run", "item",
    "cup", "cdown", "cright", "cleft",
    "dup", "ddown", "dright", "dleft"]

INPUT_WORDS2 = (
    r"""
    (?:
        (?:r|l|<|>|left|right)?
        (?:
            (?:  # match cpad/dpad/lstick/rstick/analogstick etc
                (?:c|d|l|r|a)?
                (?:
                    (?:left)|(?:right)|(?:up)|(?:down)|
                    (?:e)|(?:s)|(?:w)|(?:n)|
                    (?:stick)|(?:spinl)|(?:spinr)
                )
            )|
            (?:a)|(?:b)|(?:x)|(?:y)|(?:l)|(?:r)|(?:z)|
            (?:zl)|(?:zr)|(?:sl)|(?:sr)|
            (?:start)|(?:select)|
            (?:cross)|(?:circle)|(?:triangle)|(?:square)|
            (?:democracy)|(?:anarchy)|(?:wait)|
            (?:move)|(?:switch)|(?:run)|(?:item)|
            (?:plus)|(?:minus)|(?:home)|(?:anarchy)|(?:democracy)|
            (?:with)|(?:catch)|(?:throw)|(?:bag)|(?:wait)|
            (?:lsb)|(?:rsb)|(?:status)|(?:items)|(?:poke)|
            (?:reuse)|(?:heal)|(?:mega)|(?:quit)|(?:back)|
            (?:cancel)|(?:exp)|(?:experience)|(?:p)|
            (?:\d+)
        )
    )"""
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
    commandMatch = commandPat.match(msg)
    return commandMatch is not None


def isInput(msg):
    if len(msg) <= 1:
        return True
    wordless = INPUT_WORDS_PAT.sub(' ', msg)
    inputMatch = ALL_INPUT_CHARS_PAT.match(wordless)
    return inputMatch is not None


ALL_INPUT_CHARS_PAT2 = re.compile(r"""
^
    \s*
    (?:
        """ + INPUT_WORDS2 + r"""
        \d*  # match the 9 in start9
    )
    (?:
        [\s+,\->]
        (?:
            """ + INPUT_WORDS2 + r"""
            \d*
        )
    )*
    [-]?
    \s*
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


def passesWhitelist(msg):
    for c in msg:
        if c not in WHITELIST:
            return False
    return True


# def isSpammy(msg):
# spamScore = 0
# for c in msg:
# if c in WHITELIST:
# continue
# val = ord(c)
# print(val)
# cyrillic and spilled drinks
# if 0x0400 <= val and val <= 0x04FF:
# spamScore += 1
# if 0x0300 <= val and val <= 0x036F:
# spamScore += 1
# if 9600 <= val and val <= 9632:
# spamScore += 1
# return spamScore > 5

def passesAllFilters(msg):
    return not (isInput2(msg) or isCommand(msg) or isMisty(msg) or not passesWhitelist(msg))


# expects a condensed message: ' '.join(msg.split()
def filterMsg(msg, field):
    if field == 'command' or field == 'cmd':
        return isCommand(msg)
    elif field == 'input':
        return isInput(msg)
    elif field == 'misty':
        return isMisty(msg)
    elif field == 'whitelist':
        return passesWhitelist(msg)


def main():
    test1()


def test1():
    failures = []
    positives = ['anarchy', 'AnarCHy', 'ANARCHY', '  anarchy', 'anarchy  ', 'anarchy+anarchy']
    positives += ['a+left', 'a,left', 'a+left+a']
    positives += ['start9', 'a+120,100', 'e+s-', 'lstick+e', 'RLEFT', '<left', 'lstart', 'lstart9']
    positives += ['']

    positives += ['!balance', '!bet 100 red', '!bet 514 tgqr']
    positives += ['!a', '!move a', '!-', '!c', '!move c', '!baba']
    positives += ['!aucl', '!ap', '!l']

    positives += ['beat misty']

    positives += [
        'ỏ̷͖͈̞̩͎̻̫̫̜͉̠̫͕̭̭̫̫̹̗̹͈̼̠̖͍͚̥͈̮̼͕̠̤̯̻̥̬̗̼̳̤̳̬̪̹͚̞̼̠͕̼̠̦͚̫͔̯̹͉͉̘͎͕̼̣̝͙̱̟̹̩̟̳̦̭͉̮̖̭̣̣̞̙̗̜̺̭̻̥͚͙̝̦̲̱͉͖͉̰̦͎̫̣̼͎͍̠̮͓̹̹͉̤̰̗̙͕͇͔̱͕̭͈̳̗̭͔̘̖̺̮̜̠͖̘͓̳͕̟̠̱̫̤͓͔̘̰̲͙͍͇̙͎̣̼̗̖͙̯͉̠̟͈͍͕̪͓̝̩ ỏ̷͖͈̞̩͎̻̫̫̜͉̠̫͕̭̭̫̫̹̗̹͈̼̠̖͍͚̥͈̮̼͕̠̤̯̻̥̬̗̼̳̤̳̬̪̹͚̞̼̠͕̼̠̦͚̫͔̯̹͉͉̘͎͕̼̣̝͙̱̟̹̩̟̳̦̭͉̮̖̭̣̣̞̙̗̜̺̭̻̥͚͙̝̦̲̱͉͖͉̰̦͎̫̣̼͎͍̠̮͓̹̹͉̤̰̗̙͕͇͔̱͕̭͈̳̗̭͔̘̖̺̮̜̠͖̘͓̳͕̟̠̱̫̤͓͔̘̰̲͙͍͇̙͎̣̼̗̖͙̯͉̠̟͈͍͕̪͓̝̩']

    positives += ['░░░░░▀▀▓▓▓▓▓▓ ▓▓▓▀░░░░░▄██▄░░░░░▀▓▓▓ ▓▓░░░░░▄▄██▀░░░░░░░░▓▓ ▓░░░░░▄██▀░░░▄█▄░░░░░▓ ▌░░░░░▀██▄▄▄████']

    positives += ['!bet p100 red', '!bet blue p20', '!bet P100 red', '!bet blue P20',
                  '#1', '#a', '#-', '#betred 200', '#betBLUE 105']

    negatives = ['badge from misty', 'ヽ༼ຈل͜ຈ༽ﾉ', '༼ つ ◕_◕ ༽つ']
    negatives += ['i like anarchy', 'anarchy is great', 'anarchy!', 'anarchy+anarchy+',
                  '+anarchy+anarchy+anarchy', '   anarchy+ ', 'anarchy, anarchy+,']
    negatives += ['select sect', 'a +left', '  a + left + b +   ']
    negatives += ['!a move a', '!- just stop', '!balance deky', '!babyrage']

    negatives += ['!bet 19246 red PogChamp']
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
