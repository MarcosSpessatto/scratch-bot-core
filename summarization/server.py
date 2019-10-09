from __future__ import absolute_import
from __future__ import division, print_function, unicode_literals

from sumy.parsers.html import HtmlParser
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer as Summarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words
from flask import Flask, request, jsonify, Response
from pymongo import MongoClient
import nltk
import string
import re
import json

nltk.download('punkt')

app = Flask(__name__)

client = MongoClient('mongo', 27017)
db = client['summarization']

LANGUAGE = "portuguese"
SENTENCES_COUNT = 2
stemmer = Stemmer(LANGUAGE)

summarizer = Summarizer(stemmer)
summarizer.stop_words = get_stop_words(LANGUAGE)

@app.route('/save-message', methods=['POST'])
def save_message():
    messages = db['messages']
    message_to_save = request.json
    remove = string.punctuation
    pattern = r"[{}]".format(remove)
    message_to_save['text'] = re.sub(pattern, '', message_to_save['text'])
    messages.insert_one(message_to_save)
    return jsonify(success=True)

@app.route('/summary', methods=['GET'])
def get_summary():
    messages = db['messages']
    documents = messages.find({})
    chunks = []
    for document in documents:
        chunks.append(document['text'] + '. ')
    text_to_analyze = ''.join(chunks)
    parser = PlaintextParser.from_string(text_to_analyze, Tokenizer(LANGUAGE))
    sentence_chunks = []
    for sentence in summarizer(parser.document, SENTENCES_COUNT):
        sentence_chunks.append(str(sentence))
    return Response(json.dumps({"sentences": sentence_chunks}), mimetype='application/json')


if __name__ == '__main__':
    app.run(host='0.0.0.0')