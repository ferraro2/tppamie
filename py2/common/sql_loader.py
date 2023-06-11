from __future__ import division, print_function

import mysql.connector
from mysql.connector import errorcode

class SqlLoader:
	#sample config parameters
	# config = {
	  # 'user': 'cal',
	  # 'password': 'a',
	  # 'host': '127.0.0.1',
	  # 'database': 'tpp',
	# }

	
	#initialize an sql connection and cursor
	def __init__(self, config):
		#attempt mysql connect
		try:
			cnx = mysql.connector.connect(**config)
			cursor = cnx.cursor()
			#print("mysql connected")

		except mysql.connector.Error as err:
		  if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
			print("\tMysql: Something is wrong with your user name or password")
			exit(1)
		  elif err.errno == errorcode.ER_BAD_DB_ERROR:
			print("\tDatabase does not exist")
			exit(1)
		  else:
			print("SqlLoader.py: " + str(err))
			exit(1)
		
		#use database
		try:
			cnx.database = config['database']
		except mysql.connector.Error as err:
			print("SqlLoader.py: " + str(err))
			exit(1)
		else:
			#print("database {} loaded".format(config['database']))
			self.cnx = cnx
			self.cursor = cursor

	def commit(self):
		# print("Changes were committed.")
		self.cnx.commit()

	def rollback(self):
		self.cnx.rollback()

	def in_transaction(self):
		return self.cnx.in_transaction
		
	def close(self):
		# print("Connection closed.\n")
		self.cursor.close()
		self.cnx.close()
