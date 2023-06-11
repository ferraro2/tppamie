from __future__ import division, print_function

import time
import traceback

from sql_loader import SqlLoader
import mysql.connector
from mysql.connector import errorcode, IntegrityError, InternalError
import random

# from common
import utils
import filters

TWITCH_COLORS = utils.getTwitchColorCodes()
TWITCH_COLORS_BY_NAME = utils.getTwitchColors()


class ChatSql(SqlLoader):
    # ----------------------------------------- Class Functions 	---------------------------------------------------------------
    def __init__(self, database, user, password):
        config = {
            # 'user': 'root',
            # 'password': 'mysql',
            'user': user,
            'password': password,
            'host': '127.0.0.1',
            'database': database,
            'buffered': True,
        }

        SqlLoader.__init__(self, config)

        # print("Database {} loaded.".format(config['database']))
        # mysql utf-8 cannot recognize certain four-byte unicode characters (or something like that).
        #  This would cause errors upon insertion.
        # in mysql, I converted varables below to having values utf8mb4_unicode_ci and utf8mb4
        #     show variables WHERE variable_name like "%";

        # https://mathiasbynens.be/notes/mysql-utf8mb4

        # I also had to alter the database, tables, and columns to use utf8mb4_unicode_ci
        self.cursor.execute("SET NAMES utf8mb4")

    def createTables(self):
        for name, ddl in ChatSql.TABLES.iteritems():
            try:
                print("\tCreating table {}: ".format(name), end='')
                self.cursor.execute(ddl)
            except mysql.connector.Error as err:
                if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                    print("already exists.")
                else:
                    print("chat_sql.py: " + err)
            else:
                print("OK")

    # ----------------------------------------- Table Insertion ---------------------------------------------------------------

    def insertBadges(self, values):
        self.cursor.execute(("INSERT INTO badges "
                             "(badge_id, url_id, title, description) "
                             "VALUES (%s, %s, %s, %s)"), values)

    def insertVideos(self, values):
        self.cursor.execute(("INSERT INTO videos "
                             "(video_id, created_at, published_at, duration, url) "
                             "VALUES (%s, %s, %s, %s)"), values)

    def insertMsg(self, values):
        self.cursor.execute(("INSERT INTO messages "
                             "(user_id, tstamp, me, whitelisted) "
                             "VALUES (%s, %s, %s, %s)"), values)

    def insertMsgData(self, values):
        self.cursor.execute(("INSERT INTO msg_data "
                             "(msg_id, emote_locs, msg, video_id, video_offset_seconds, display_name, color) "
                             "VALUES (%s, %s, %s, %s, %s, %s, %s)"), values)

    def insertUser(self, values):
        self.cursor.execute(("INSERT INTO users "
                             "(username, twitch_id, color, moder, sub, turbo, display_name, updated_at) "
                             "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"), values)

    def insert(self, table, items, duplicateUpdateItems=None):
        command = "INSERT INTO %s (%s) VALUES (%s)" % \
                  (table,
                   ', '.join(items.keys()),
                   ', '.join(('%s',) * len(items)))
        values = items.values()
        if duplicateUpdateItems:
            command += " ON DUPLICATE KEY UPDATE " \
                       + ', '.join(("%s=%%s" % k for k in duplicateUpdateItems.keys()))
            values += duplicateUpdateItems.values()
        self.cursor.execute(command, values)

    # ----------------------------------------- Table Query ---------------------------------------------------------------
    def queryPartitions(self, values):
        text = ("""with msg as (select tstamp, ROW_NUMBER()OVER() as rn 
				from messages where %s <= tstamp and tstamp < %s)
			select tstamp from msg
				where rn % ceil((select count(*) from msg) / %s) = 1
			union select(%s);""")
        self.cursor.execute(text, values)

    def queryPartitionsOfSize(self, values):
        text = ("""with msg as (select tstamp, ROW_NUMBER()OVER() as rn 
				from messages where %s <= tstamp and tstamp < %s order by tstamp asc)
			select tstamp from msg where rn % %s = 1
			union select(%s);""")
        self.cursor.execute(text, values)

    def queryUserIdByUsername(self, values):
        text = ('SELECT users.user_id FROM users WHERE users.username = %s')
        self.cursor.execute(text, values)

    def queryUserIdAndColorByUsername(self, values):
        text = ('SELECT user_id, color FROM users WHERE users.username = %s')
        self.cursor.execute(text, values)

    # def queryMsgByUsername(self, values):
    # text = ('SELECT m.msg_id, tstamp, msg_id FROM messages, users '
    # 'WHERE users.username = %s AND users.user_id = messages.user_id ORDER BY tstamp asc')
    # self.cursor.execute(text, values)

    def queryMsgByTuple(self, values):
        text = ("""SELECT m.msg_id, tstamp, msg
		FROM messages as m, users as u, msg_data as md
		WHERE username = %s AND u.user_id = m.user_id
		AND m.msg_id = md.msg_id AND tstamp = %s AND msg = %s""")
        self.cursor.execute(text, values)

    # def queryAllMsg(self):
    # text = ("""
    # SELECT m.tstamp, u.username, m.me, m.msg FROM
    # (SELECT user_id, tstamp, msg_id, me, msg FROM messages
    # ORDER BY messages.tstamp asc LIMIT 100000
    # ) m, users as u WHERE u.user_id = m.user_id;""")
    # self.cursor.execute(text)
    def getUsersInIdRange(self, values):
        text = ("""SELECT user_id FROM users
		WHERE user_id >= %s AND user_id < %s""")
        self.cursor.execute(text, values)

    def getMessagesInIdRange(self, values):
        text = ("""SELECT m.msg_id, tstamp, msg
		FROM messages as m, msg_data as md
		WHERE m.msg_id = md.msg_id AND
		m.msg_id >= %s AND m.msg_id < %s""")
        self.cursor.execute(text, values)

    def queryMessagesWithDataInTstampRange(self, values):
        text = ("""SELECT m.msg_id, tstamp, msg
		FROM messages as m, msg_data as md
		WHERE m.msg_id = md.msg_id AND
		m.msg_id >= %s AND m.msg_id < %s""")
        self.cursor.execute(text, values)

    def queryDuplicateMessage(self, values):
        text = ("""SELECT m.msg_id
        FROM messages m join msg_data md using(msg_id)
        WHERE m.user_id = %s AND m.tstamp = %s AND md.msg = %s""")
        self.cursor.execute(text, values)

    # ----------------------------------------- Table Update ---------------------------------------------------------------
    def update(self, table, items, criteria):
        command = "UPDATE %s SET %s WHERE %s" % \
                  (table,
                   ', '.join('%s=%%s' % key for key in items.keys()),
                   ' and '.join('%s=%%s' % key for key in criteria.keys()))
        # print(command)
        self.cursor.execute(command, items.values() + criteria.values())

    def updateUserFields(self, values):
        self.cursor.execute(('UPDATE users '
                             'SET moder=%s, sub=%s, turbo=%s, color=%s, display_name=%s, twitch_id=%s '
                             'WHERE user_id=%s'), values)

    def updateUserColor(self, values):
        self.cursor.execute(('UPDATE users '
                             'SET color=%s '
                             'WHERE user_id=%s'), values)

    def updateUserUsername(self, values):
        self.cursor.execute(('UPDATE users '
                             'SET username=%s '
                             'WHERE user_id=%s'), values)

    def updateUserEmote(self, values):
        self.cursor.execute(('UPDATE users '
                             'SET emote_id=%s, emote_name=%s '
                             'WHERE user_id=%s'), values)

    def updateUserColor(self, values):
        self.cursor.execute(('UPDATE users '
                             'SET color=%s '
                             'WHERE user_id=%s'), values)

    def updateMsg(self, values):
        self.cursor.execute(('UPDATE messages '
                             'SET tstamp=%s, whitelisted=%s '
                             'WHERE msg_id=%s'), values)

    def updateMsgData(self, values):
        self.cursor.execute(('UPDATE msg_data '
                             'SET emote_locs=%s '
                             'WHERE msg_id=%s'), values)

    # ----------------------------------------- Table Creation ---------------------------------------------------------------
    TABLES = {}
    TABLES['users'] = (
        "CREATE TABLE `users` ("
        "`user_id` int UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,"
        "`username` char(25) NOT NULL,"
        "`emote_id` int UNSIGNED NOT NULL default 0,"
        "`emote_name` varchar(35) NOT NULL default '',"
        "`color` char(6) NOT NULL default '',"
        "`moder` tinyint NOT NULL default 0,"
        "`sub` tinyint NOT NULL default 0,"
        "`turbo` tinyint NOT NULL default 0,"
        "INDEX `username` (`username`)"
        ")")

    # cap message length at 1023 characters
    TABLES['messages'] = (
        "CREATE TABLE `messages` ("
        "`msg_id` int UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,"
        "`user_id` int UNSIGNED NOT NULL,"
        "`tstamp` TIMESTAMP NOT NULL,"
        "`me` tinyint NOT NULL default 0,"
        "`whitelisted` tinyint NOT NULL default 0,"
        "`emote_locs` TEXT NOT NULL,"
        "`msg` TEXT NOT NULL,"
        "INDEX `tstamp` (`tstamp`)"
        ")")

    TABLES['msg_data'] = (
        "CREATE TABLE `msg_data` ("
        "`msg_id` int UNSIGNED NOT NULL PRIMARY KEY,"
        "`emote_locs` TEXT NOT NULL,"
        "`msg` TEXT NOT NULL"
        ")")

    def getPartitionRanges(self, num_partitions, min_date=None, max_date=None):
        self.queryPartitions((min_date, max_date, num_partitions, max_date))
        tstamps = [row[0] for row in self.cursor.fetchall()]
        return [(tstamps[i], tstamps[i + 1]) for i in range(len(tstamps) - 1)]

    def getPartitionRangesOfSize(self, partition_size, min_date=None, max_date=None):
        self.queryPartitionsOfSize((min_date, max_date, partition_size, max_date))
        tstamps = [row[0] for row in self.cursor.fetchall()]
        return [(str(tstamps[i]), str(tstamps[i + 1])) for i in range(len(tstamps) - 1)]

    def processNewMessage(self, username, twitchId, color, dispName, mod, sub, turbo, is_action,
						  emotes, dateStr, text, videoId, videoOffsetSeconds, badges):

        # sanitize the display name
        # if dispName.lower() != username.lower():
        #     dispName = ''
        attempts = 0
        while True:
            try:
                (userId, color) = self._insertOrUpdateUser(
                    username, color, mod, sub, turbo, twitchId, dispName, dateStr)
                self.commit()

                if filters.isMisty(text):
                    return
                if self._isDuplicateMessage(userId, dateStr, text):
                    return
                    # raise Exception("duplicate message: %s %s %s" % (dateStr, userId, text))

                msgId = self._insertMessage(userId, username, is_action, dateStr, text)
                self._insertMsgData(msgId, emotes, text, videoId, videoOffsetSeconds, dispName, color)
                self._insertMsgBadges(msgId, badges)
                self.commit()
            except (IntegrityError, InternalError):
                print('message processing failed with %s' % traceback.format_exc())
                print('in transaction: %s' % self.in_transaction)
                attempts += 1
                if attempts >= 5:
                    raise Exception('could not insert message after several attempts')
                else:
                    print('sleeping before attempting again')
                    # user in db already thanks to another thread
                    # but the fresh insert may not be available in our locked data set.  Refresh it
                    if self.in_transaction():
                        self.rollback()
                    time.sleep(attempts * attempts)  # wait a bit

    def _isDuplicateMessage(self, userId, dateStr, text):
        self.queryDuplicateMessage((userId, dateStr, text))
        if self.cursor.fetchone() is not None:
            return True

    def _insertMessage(self, userId, username, is_action, dateStr, text):
        messagesInsertItems = {
            "user_id": userId,
            "tstamp": dateStr,
            "is_action": is_action,
            "is_bot": filters.isUserBot(username),
            "is_input": filters.isInput2(text),
            "is_command": filters.isCommand(text),
            "is_match_command": filters.isMatchCommand(text),
            "has_unwhitelisted_chars": not filters.passesCharacterWhitelist2(text),
        }
        # print("Inserting message metadata: "
        # "\n\tmysqlDate: {} \n\tmysqlDate: {}\n\tme: {}\n\twhitelisted: {}"
        # .format(mysqlDate, mysqlDate, me, isWhitelisted)
        # .encode('utf-8'))
        self.insert('messages', messagesInsertItems)

        return self.cursor.lastrowid  # msg_id of our inserted message

    def _insertMsgData(self, msgId, emotes, text, videoId, videoOffsetSeconds, dispName, color):
        msgDataInsertItems = {
            'msg_id': msgId,
            'emote_locs': emotes,
            'msg': text,
            'video_id': videoId,
            'video_offset_seconds': videoOffsetSeconds,
            'display_name': dispName,
            'color': color,
        }
        # print(str(insertData).encode('utf-8'))
        self.insert('msg_data', msgDataInsertItems)

    def _insertMsgBadges(self, msgId, badges):
        # and the msg_badges
        for i, badge in enumerate(badges):
            msgBadgesInsertItems = {
                'msg_id': msgId,
                'badge_id': badge,
                'pos': i,
            }
            # print(str(insertData).encode('utf-8'))
            self.insert('msg_badges', msgBadgesInsertItems)

    def _queryIdAndColor(self, username, color):
        # see if this username is already in the database
        # we need to know what color so we can store it in the msg_data table,
        # and the color isn't provided for user without a color
        self.queryUserIdAndColorByUsername((username,))
        userAndColor = self.cursor.fetchone()
        if userAndColor is not None:
            # quit if a second entry exists
            if self.cursor.fetchone() is not None:
                raise Exception("ERROR: more than one user ID found for username {}.".format(username))
            return userAndColor
        else:
            return None

    def updateUserIfInDB(self, userId, username, color, mod, sub, turbo, twitchId, dispName, dateStr):# if yes, get user id

        updateData = {
            "moder": mod,
            "sub": sub,
            "turbo": turbo,
            "display_name": dispName,
            "twitch_id": twitchId,
            "color": color,
            "updated_at": dateStr,
        }
        criteria = {
            "user_id": userId,
        }
        # print("Updating existing user: %s %s" % (updateData, criteria))
        self.update('users', updateData, criteria)
        return color

    def _insertUser(self, username, color, mod, sub, turbo, twitchId, dispName, dateStr):
        # print("inserting user %s " % username)
        # if not, insert an entry and note the user id created
        # for new users, just write in the username and a random color
        # it'll be updated the next time the user inputs something
        if color is None or len(color) != 6:
            color = TWITCH_COLORS[random.randint(0, len(TWITCH_COLORS) - 1)]
        newUserData = (username, twitchId, color, mod, sub, turbo, dispName, dateStr)
        # print("Trying to add new user: {}".format(newUserData))
        self.insertUser(newUserData)
        return self.cursor.lastrowid, color  # user's assigned user_id

    def _insertOrUpdateUser(self, username, color, mod, sub, turbo, twitchId, dispName, dateStr):
        idAndColor = self._queryIdAndColor(username, color)
        if not idAndColor:
            # insert if that didn't work- user not in db
            idAndColor = self._insertUser(username, color, mod, sub, turbo, twitchId, dispName, dateStr)
            return idAndColor
        else:
            (userId, color) = idAndColor
            self.updateUserIfInDB(userId, username, color, mod, sub, turbo, twitchId, dispName, dateStr)
            return idAndColor
