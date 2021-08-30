API_DIR?=`pwd`/api

api-dev:
	docker build -t picture-upload-api:latest api
	docker run --rm -it -v $(API_DIR):/var/www/html -p 3002:80 picture-upload-api:latest

frontend-dev:
	cd frontend && yarn start
