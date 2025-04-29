# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- `npm install` - Install dependencies
- `npm start` - Start development server with webpack
- `npm run build` - Build production bundle
- `npm test` - Run all tests
- `npm test -- tests/daisyworld.test.js` - Run specific test file
- `npm test -- -t "should update model"` - Run tests matching pattern
- `node server.js` - Start simple HTTP server

## Code Style Guidelines
- Use ES modules with `import`/`export` syntax
- Maintain 2-space indentation
- Use JSDoc comments for classes and functions
- Class names use PascalCase, functions use camelCase
- Follow getter/setter pattern for object properties
- Keep files organized by concern (model, UI, test)
- Implement explicit error handling for user interactions
- Use const/let appropriately, avoid var
- Handle DOM manipulation in UI components only
- Keep logic and display separate (Model-View separation)