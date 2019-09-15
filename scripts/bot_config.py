#!/usr/bin/env python3

import json
import logging
import requests
import os
# == Log Config ==

logger = logging.getLogger('Bot Config')
logger.setLevel(logging.INFO)

ch = logging.StreamHandler()
ch.setLevel(logging.INFO)

formatter = logging.Formatter(
    '%(asctime)s :: %(name)s :: %(levelname)s :: %(message)s'
)

ch.setFormatter(formatter)

logger.addHandler(ch)


host = os.getenv('ROCKETCHAT_URL', 'http://rocketchat:3000')
if host[-1] == '/':
    host = host[:-1]

if not host.startswith('http://'):
    host = 'http://' + host

path = '/api/v1/login'

bot = {
    'name': os.getenv('ROCKETCHAT_BOT_NAME', 'Rocket Cat'),
    'username': os.getenv('ROCKETCHAT_BOT_USERNAME', 'rocket.cat'),
    'password': os.getenv('ROCKETCHAT_BOT_PASSWORD', 'rocket.cat'),
}

admin_name = os.getenv('ROCKETCHAT_ADMIN_USERNAME', 'admin')
admin_password = os.getenv('ROCKETCHAT_ADMIN_PASSWORD', 'admin')

user_header = None


def api(endpoint, values=None, is_post=True):
    requests.adapters.DEFAULT_RETRIES = 5

    if endpoint[0] == '/':
        endpoint = endpoint[1:]

    url = host + '/api/v1/' + endpoint

    data = None
    if values:
        data = json.dumps(values)
    if is_post:
        response = requests.post(url, data=data, headers=user_header)
    else:
        response = requests.get(url, data=data, headers=user_header)

    if response.json()['success'] is True:
        logger.info('Success {} :: {}'.format(url, response.json()))
    else:
        logger.error('ERROR {} :: {}'.format(url, response.json()))
        raise EnvironmentError

    return response.json()


def api_post(endpoint, values=None):
    return api(endpoint, values)


def api_get(endpoint, values=None):
    return api(endpoint, values, False)


def get_authentication_token():
    login_data = {'username': admin_name, 'password': admin_password}
    response = requests.post(host + path, data=json.dumps(login_data))

    if response.json()['status'] == 'success':
        logger.info('Login suceeded')

        authToken = response.json()['data']['authToken']
        userId = response.json()['data']['userId']
        user_header = {
            'X-Auth-Token': authToken,
            'X-User-Id': userId,
            'Content-Type': 'application/json'
        }

        return user_header


def update_bot_user():
    try:
        api_post('users.update', {
                 'userId': bot['username'],
                 'data': { 'password': bot['password'], 'email': 'rocket.cat@rocket.cat' }
                 })
    except Exception:
        print("User already created.")


def create_livechat_agent():
    response = api_post('livechat/users/agent', {'username': bot['username']})
    return response['user']['_id']

def create_department(bot_agent_id):
    get_departments_url = host + '/api/v1/livechat/department'

    get_departments_response = requests.get(
        get_departments_url,
        headers=user_header
    )

    number_of_departments = len(get_departments_response.json()['departments'])

    if number_of_departments == 0:
        api_post('livechat/department', {
            'department': {
                'enabled': True,
                'showOnRegistration': True,
                'showOnOfflineForm': False,
                'name': 'department',
                'description': 'default department',
                'email': 'rocket.cat@rocket.cat'
            },
            'agents': [{
                'agentId': bot['username'],
                'username': bot['username'],
                'count': 0,
                'order': 0
            }]
        })


if __name__ == '__main__':
    logger.info('===== Automatic env configuration =====')

    try:
        user_header = get_authentication_token()
    except Exception:
        print("\n\n --------- Rocket Chat Unavailable! --------\n\n")

    if user_header:
        logger.info('>> Update user')
        update_bot_user()

        logger.info('>> Create livechat agent')
        bot_agent_id = create_livechat_agent()

        logger.info('>> Create livechat department')
        create_department(bot_agent_id)

    else:
        logger.error('Login Failed')
