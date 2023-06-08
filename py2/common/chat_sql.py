from __future__ import division, print_function
from sql_loader import SqlLoader
import mysql.connector
from mysql.connector import errorcode
import random

#from common
import utils
import filters


TWITCH_COLORS = utils.getTwitchColorCodes()
TWITCH_COLORS_BY_NAME = utils.getTwitchColors()


class ChatSql(SqlLoader):
	# ----------------------------------------- Class Functions 	---------------------------------------------------------------
	def __init__(self, database, user, password):
		config = {
		   #'user': 'root',
		   #'password': 'mysql',
		   'user': user,
		   'password': password,
		  'host': '127.0.0.1',
		  'database': database
		}

		SqlLoader.__init__(self, config)

		# print("Database {} loaded.".format(config['database']))
		#mysql utf-8 cannot recognize certain four-byte unicode characters (or something like that).
		#  This would cause errors upon insertion.
		#in mysql, I converted varables below to having values utf8mb4_unicode_ci and utf8mb4
		#     show variables WHERE variable_name like "%";

		#https://mathiasbynens.be/notes/mysql-utf8mb4

		#I also had to alter the database, tables, and columns to use utf8mb4_unicode_ci
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
		self.cursor.execute( ("REPLACE INTO badges "
		"(badge_id, url_id, title, description) "
		"VALUES (%s, %s, %s, %s)"), values)

	def insertVideos(self, values):
		self.cursor.execute( ("INSERT INTO videos "
		"(video_id, created_at, published_at, duration, url) "
		"VALUES (%s, %s, %s, %s)"), values)

	def insertMsg(self, values):
		self.cursor.execute( ("INSERT INTO messages "
		"(user_id, tstamp, me, whitelisted) "
		"VALUES (%s, %s, %s, %s)"), values)

	def insertMsgData(self, values):
		self.cursor.execute( ("INSERT INTO msg_data "
		"(msg_id, emote_locs, msg, video_id, video_offset_seconds, display_name, color) "
		"VALUES (%s, %s, %s, %s, %s, %s, %s)"), values)

	def insertUser(self, values):
		self.cursor.execute( ("INSERT INTO users "
		"(username, twitch_id, color, moder, sub, turbo, display_name) "
		"VALUES (%s, %s, %s, %s, %s, %s, %s)"), values)

	def insert(self, table, items):
		command = "INSERT INTO %s (%s) VALUES (%s)" % \
				  (table,
				   ', '.join(items.keys()),
				   ', '.join(('%s',) * len(items)))
		# print(command)
		# print(items)
		self.cursor.execute(command, items.values())

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
				from messages where %s <= tstamp and tstamp < %s)
			select tstamp from msg
				where rn % %s = 1
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

	# ----------------------------------------- Table Update ---------------------------------------------------------------
	def update(self, table, items, criteria):
		command = "UPDATE %s SET %s WHERE %s" % \
				  (table,
				   ', '.join('%s=%%s' % key for key in items.keys()),
				   ' and '.join('%s=%%s' % key for key in criteria.keys()))
		#print(command)
		self.cursor.execute(command, items.values() + criteria.values())

	def updateUserFields(self, values):
		self.cursor.execute( ('UPDATE users '
		'SET moder=%s, sub=%s, turbo=%s, color=%s, display_name=%s, twitch_id=%s '
		'WHERE user_id=%s'), values)

	def updateUserColor(self, values):
		self.cursor.execute( ('UPDATE users '
		'SET color=%s '
		'WHERE user_id=%s'), values)

	def updateUserUsername(self, values):
		self.cursor.execute( ('UPDATE users '
		'SET username=%s '
		'WHERE user_id=%s'), values)

	def updateUserEmote(self, values):
		self.cursor.execute( ('UPDATE users '
		'SET emote_id=%s, emote_name=%s '
		'WHERE user_id=%s'), values)

	def updateUserColor(self, values):
		self.cursor.execute( ('UPDATE users '
		'SET color=%s '
		'WHERE user_id=%s'), values)

	def updateMsg(self, values):
		self.cursor.execute( ('UPDATE messages '
		'SET tstamp=%s, whitelisted=%s '
		'WHERE msg_id=%s'), values)

	def updateMsgData(self, values):
		self.cursor.execute( ('UPDATE msg_data '
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

	#cap message length at 1023 characters
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
		return [(tstamps[i], tstamps[i+1]) for i in range(len(tstamps) - 1)]


	def getPartitionRangesOfSize(self, partition_size, min_date=None, max_date=None):
		self.queryPartitionsOfSize((min_date, max_date, partition_size, max_date))
		tstamps = [row[0] for row in self.cursor.fetchall()]
		return [(tstamps[i], tstamps[i+1]) for i in range(len(tstamps) - 1)]


	def processNewMessage(self, username, twitchId, color, dispName, mod, sub, turbo, me,
				  emotes, mysqlDate, text, videoId, videoOffsetSeconds, badges):

		# sanitize the display name
		if dispName.lower() != username.lower():
			dispName = ''

		# message fields
		ignore = filters.isCommand(text) or filters.isMatchCommand(text) or filters\
			.isInput2(text) or filters.isMisty(text) or filters.isUserBot(username)
		# userId will be set properly
		# mysqlDate was passed in
		isWhitelisted = filters.passesCharacterWhitelist(text)

		# UPDATE USER

		# see if this username is already in the database
		self.queryUserIdAndColorByUsername((username,))
		userEntry = self.cursor.fetchone()
		if userEntry is not None:
			# if yes, get user id
			(userId, oldColor) = userEntry
			if not color:
				color = oldColor
			# quit if a second entry exists
			if self.cursor.fetchone() is not None:
				print("ERROR: more than one user ID found for username {}.".format(username))
				return
			updateData = {
				"moder": mod,
				"sub": sub,
				"turbo": turbo,
				"display_name": dispName,
				"twitch_id": twitchId,
				"color": color,
			}
			criteria = {
				"user_id": userId,
			}
			#print("Updating existing user %s %s" % (updateData, criteria))
			self.update('users', updateData, criteria)

		else:
			# if not, insert an entry and note the user id created
			# for new users, just write in the username and a random color
			# it'll be updated the next time the user inputs something
			color = TWITCH_COLORS[random.randint(0, len(TWITCH_COLORS) - 1)]
			newUserData = (username, twitchId, color, mod, sub, turbo, dispName)
			#print("Adding new user:\n\t{}".format(newUserData))
			self.insertUser(newUserData)
			userId = self.cursor.lastrowid

		# WRITE MESSAGE
		if not ignore:
			# and insert new message
			newMsgTuple = (userId, mysqlDate, me, isWhitelisted)
			#print("Inserting message metadata: "
				  # "\n\tmysqlDate: {} \n\tmysqlDate: {}\n\tme: {}\n\twhitelisted: {}"
				  # .format(mysqlDate, mysqlDate, me, isWhitelisted)
				  # .encode('utf-8'))
			self.insertMsg(newMsgTuple)
			msgId = self.cursor.lastrowid

			# and the data
			insertData = {
				'msg_id': msgId,
				'emote_locs': emotes,
				'msg': text,
				'video_id': videoId,
				'video_offset_seconds': videoOffsetSeconds,
				'display_name': dispName,
				'color': color,
			}
			#print(str(insertData).encode('utf-8'))
			self.insert('msg_data', insertData)

			for i, badge in enumerate(badges):
				insertData = {
					'msg_id': msgId,
					'badge_id': badge,
					'pos': i,
				}
				#print(str(insertData).encode('utf-8'))
				self.insert('msg_badges', insertData)

# print()

