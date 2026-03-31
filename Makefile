.PHONY: help
help:
	@echo "make build - Build the site"
	@echo "make deploy - Deploy the site"
	@echo "make functions - Deploy the functions"
	@echo "make start - Start the web app"
	@echo "make open - Open the web app"
	@echo "make add - Add to git and push to v18 -- required comment='your comment'"
	@echo "make push - Push to git"
	@echo "make help - Show this help message"

.PHONY: build
build:
	@echo "Building site..."
	ng build --optimization --aot --configuration production
	@echo "Finished started!"


.PHONY: deploy
deploy:
	@echo "Deploy hosting"
	ng build --optimization --aot --configuration production
	@echo "Deploy hosting"
	gcloud run deploy qbo-noble --source .


.PHONY: functions
functions:
	@echo "Deploy functions"
	firebase deploy --only functions


.PHONY: prod
prod:
	@echo "start web app"
	ng serve --watch=false --no-hmr --configuration production


.PHONY: start
dev:
	@echo "start web app"
	ng serve --watch=true --configuration development --inspect

.PHONY: start
start:
	@echo "start web app"
	ng serve --watch=false --no-hmr --configuration development

.PHONY: open
open:
	@echo "start web app"
	ng serve -o


.PHONY: add
add:
	@echo "push to git\n"
	git add .
	@echo "update\n"
	git commit -m '$(comment)'
	@echo "push to main\n"
	git push origin main

.PHONY: push
push:
	@echo "push"
	git push origin main

.PHONY: deploy-cloud-run
deploy-cloud-run:
	gcloud run deploy nobleledger \
		--source . \
		--region us-central1 \
		--allow-unauthenticated



