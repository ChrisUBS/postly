import pymongo, certifi, os
from dotenv import load_dotenv
load_dotenv()

client = pymongo.MongoClient(
    os.getenv("CONNECTION_STRING"), 
    tlsCAFile=certifi.where()
)
db = client.get_database(os.getenv("DB_NAME"))