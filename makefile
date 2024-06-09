install:
	bun install
	cd go/wordle && make build

start:
	bun run index.ts

pull:
	git pull

clean:
	rm -rf go/wordle/src/img
	mkdir -p go/wordle/src/img
	rm -rf node_modules
	rm src/commands/commands.json

deploy: pull install start

deploy-clean: pull clean install start
