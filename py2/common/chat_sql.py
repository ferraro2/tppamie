from __future__ import division, print_function
from sql_loader import SqlLoader
import mysql.connector
from mysql.connector import errorcode

class ChatSql(SqlLoader):
	# ----------------------------------------- Class Functions 	---------------------------------------------------------------	
	def __init__(self, database):
		config = {
		   #'user': 'root',
		   #'password': 'mysql',
		   'user': 'dhason',
		   'password': 'a',
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
	
	def insertMsg(self, values):
		self.cursor.execute( ("INSERT INTO messages "
		"(user_id, tstamp, me, whitelisted) "
		"VALUES (%s, %s, %s, %s)"), values)
	
	def insertMsgData(self, values):
		self.cursor.execute( ("INSERT INTO msg_data "
		"(msg_id, emote_locs, msg) "
		"VALUES (%s, %s, %s)"), values)
	
	def insertUser(self, values):
		self.cursor.execute( ("INSERT INTO users "
		"(username, color, moder, sub, turbo) "
		"VALUES (%s, %s, %s, %s, %s)"), values)
	
	# ----------------------------------------- Table Query ---------------------------------------------------------------	
	def queryUserIdByUsername(self, values):
		text = ('SELECT users.user_id FROM users WHERE users.username = %s')
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
	def updateUserStats(self, values):
		self.cursor.execute( ('UPDATE users '
		'SET moder=%s, sub=%s, turbo=%s '
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
		
		
		
		