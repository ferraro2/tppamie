import pymongo
from pymongo.errors import DuplicateKeyError


def main():
    addUserBannedInComments2ToLeftovers()
    # addInComments1ButNotComments2ToLeftovers()


# A few comments are missing in comments2, put them in leftovers.
# They're missing a video link but that's ok.
def addMsgInComments1ButNotComments2ToLeftovers():
    mongodb_client = pymongo.MongoClient('127.0.0.1:27017')
    amie_db = mongodb_client['amie']
    comments1_table = amie_db['comments']
    comments2_table = amie_db['comments2']
    comments_leftovers = amie_db['comments-leftovers']

    count = 0
    comments1 = comments1_table.find({})
    for comment1 in comments1:
        count += 1
        if count % 10000 == 0:
            print(count)
        node = comment1['node']
        try:
            # grab the comment if exists in comments2
            comment2 = comments2_table \
                .find({"_id": node['id']}) \
                .limit(1).next()
        except StopIteration:
            # good, the comment isn't in comments2
            new_comment = node
            new_comment['notIn2'] = True
            new_comment['_id'] = node['id']
            new_comment['video_id'] = None
            new_comment['contentOffsetSeconds'] = None
            comments_leftovers.insert_one(new_comment)
    mongodb_client.close()


# Merge one user's results from comments1 and comments2 where:
# the user's commenter data is present in comments1 but not in comments2
# because they were bannned in between when those two tables were created
def addUserBannedInComments2ToLeftovers():
    mongodb_client = pymongo.MongoClient('127.0.0.1:27017')
    amie_db = mongodb_client['amie']
    comments1_table = amie_db['comments']
    comments2_table = amie_db['comments2']
    comments_leftovers = amie_db['comments-leftovers']

    comments1 = comments1_table.find({"node.commenter.login": "mariosyoshi"})
    print('starting')
    count = 0
    for comment1 in comments1:
        count += 1
        if count % 1000 == 0:
            print(count)
        node = comment1['node']

        # print("node: %s" % node)
        try:
            # grab the comment and insert the merged one into leftovers
            comment2 = comments2_table.find_one({"_id": node['id']})
            # a few entries from comments 1 are missing in comments 2, ignore if None
            if comment2 is not None:
                new_comment = comment2
                new_comment['commenter'] = node['commenter']
                new_comment['restoreBannedIn2'] = True
                comments_leftovers.insert_one(new_comment)
        except DuplicateKeyError:
            pass  # ignore duplicates in case I ran this script before

    mongodb_client.close()


if __name__ == '__main__':
    main()


