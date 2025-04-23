# MCP Palette Makefile

.PHONY: build start test test-watch test-coverage test-validator test-components test-validation icon clean install

# Install dependencies
install:
	npm install

# Build the application
build:
	npm run electron:build

# Start the application in development mode
start:
	npm run electron:dev

# Download placeholder icon
icon:
	curl -s "https://via.placeholder.com/512x512/007BFF/FFFFFF" -o build/icon.png

# Run all tests
 test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

test-validator:
	npm run test:validator

test-components:
	npm run test:components

test-validation:
	npm run test:validation

# Clean build artifacts
clean:
	rm -rf dist/ build/icon.* release/
