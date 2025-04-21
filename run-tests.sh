#!/bin/bash

# Make the script executable with: chmod +x run-tests.sh

# Run tests for the MCP validation system
echo "Running MCP Validator tests..."
npx jest src/utils/validation/__tests__/mcpValidator.test.js

# Run tests for ValidationBadge component
echo "Running ValidationBadge tests..."
npx jest src/components/validation/__tests__/ValidationBadge.test.jsx

# Run tests for ValidationDetails component
echo "Running ValidationDetails tests..."
npx jest src/components/validation/__tests__/ValidationDetails.test.jsx

# Run tests for ServerJsonViewer integration
echo "Running ServerJsonViewer integration tests..."
npx jest src/components/__tests__/ServerJsonViewer.test.jsx

# Run tests for MasterServerForm integration
echo "Running MasterServerForm integration tests..."
npx jest src/components/__tests__/MasterServerForm.test.jsx

# Run all tests
echo "Running all tests..."
npx jest
