from __future__ import absolute_import
from __future__ import division, print_function, unicode_literals

from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.text_rank import TextRankSummarizer as Summarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words
from flask import Flask, request, jsonify, Response
from pymongo import MongoClient
from datetime import datetime, timedelta
import nltk
import string
import re
import json
import dateutil.parser

nltk.download('punkt')

app = Flask(__name__)

client = MongoClient('mongo', 27017)
db = client['summarization']

LANGUAGE = "portuguese"
stemmer = Stemmer(LANGUAGE)

summarizer = Summarizer(stemmer)
summarizer.stop_words = get_stop_words(LANGUAGE)

@app.route('/save-message', methods=['POST'])
def save_message():
    messages = db['messages']
    message_to_save = request.json
    message_to_save['createdAt'] = dateutil.parser.parse(message_to_save['createdAt']) - timedelta(hours=3)
    message_to_save['updatedAt'] = dateutil.parser.parse(message_to_save['updatedAt']) - timedelta(hours=3)
    remove = string.punctuation
    pattern = r"[{}]".format(remove)
    message_to_save['text'] = re.sub(pattern, '', message_to_save['text'])
    messages.insert_one(message_to_save)
    return jsonify(success=True)

@app.route('/summary', methods=['GET'])
def get_summary():
    frequency = request.args.get('frequency')
    query = get_filter_by_date(frequency)
    messages = db['messages']
    documents = messages.find(query)
    SENTENCES_COUNT = fourty_percent(documents.count())
    chunks = []
    for document in documents:
        chunks.append(document['text'] + '. ')
    text_to_analyze = ''.join(chunks)
    parser = PlaintextParser.from_string(text_to_analyze, Tokenizer(LANGUAGE))
    sentence_chunks = []
    for sentence in summarizer(parser.document, SENTENCES_COUNT):
        sentence_chunks.append(str(sentence))
    return Response(json.dumps({"sentences": sentence_chunks}), mimetype='application/json')

def get_filter_by_date(frequency):
    if frequency == 'every_minute':
        return {
            'updatedAt': { '$lte': datetime.now(), '$gte': datetime.today() - timedelta(minutes=1) }
        }
    elif frequency == 'every_day_at_12':
        return {
            'updatedAt': { '$lte': datetime.now(), '$gte': datetime.today() - timedelta(hours=24) }
        }
    elif frequency == 'every_wed':
        return {
            'updatedAt': { '$lte': datetime.now(), '$gte': datetime.today() - timedelta(days=7) }
        }
    elif frequency == 'every_12':
        return {
            'updatedAt': { '$lte': datetime.now(), '$gte': datetime.today() - timedelta(hours=12) }
        }
    return {}

def fourty_percent(quantity):
    return int(round((40 * quantity)/100))

if __name__ == '__main__':
    app.run(host='0.0.0.0')