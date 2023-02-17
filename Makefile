install:
	npm ci

page-loader:
	npx babel-node bin/page-loader -o ./__fixtures__ https://ru.hexlet.io/courses

debug:
	DEBUG=page-loader page-loader --output tmp https://hexlet.io/courses

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

publish:
	npm publish --dry-run

.PHONY: test