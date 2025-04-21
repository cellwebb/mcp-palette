#!/bin/bash

# Make the script executable with: chmod +x run-tests.sh

# Run specific test categories
echo "========== Running MCP Validator tests =========="
npm run test:validator

echo ""
echo "========== Running Validation Component tests =========="
npm run test:validation

echo ""
echo "========== Running Component Integration tests =========="
npm run test:components

echo ""
echo "========== Running All Tests with Coverage =========="
npm run test:coverage
