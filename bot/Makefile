config-rocket:
	python /scripts/bot_config.py

run-console:
	rasa shell -m ../models -vv
	
evaluate:
	rasa run -m /models/dialogue -vv --endpoints endpoints.yml --enable_api 

run-actions:
	rasa run actions --actions actions