install:
	bun install
	cd go/wordle && make build

start:
	bun run index.ts
