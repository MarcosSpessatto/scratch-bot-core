build-bot:
	sudo rm -rf data
	mkdir -p data/esbackup
	mkdir -p data/esdata
	mkdir -p data/notebook_models
	chown 1000:1000 -R data/esbackup
	chown 1000:1000 -R data/esdata
	chown 1000:1000 -R data/notebook_models
	./docker/build-base.sh
	make train

train:
	docker build . -f docker/coach.Dockerfile -t scratchbotcore/coach:boilerplate
	docker-compose build bot

run-console:
	docker-compose run bot make run-console

create-elastic-index:
	docker-compose run --rm -v $(shell pwd)/analytics:/analytics bot python /analytics/setup_elastic.py

import-kibana-dashboards:
	docker-compose run --rm kibana python3.6 import_dashboards.py

configure-analytics:
	make create-elastic-index
	make import-kibana-dashboards

configure-rocket:
	docker-compose run --rm bot make config-rocket