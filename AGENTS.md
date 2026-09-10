# purchases-js — Development Guidelines

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

RevenueCat's official JavaScript/TypeScript SDK for web-based in-app billing. Supports Stripe and Paddle payment gateways with native paywall UI components built with Svelte.

**Related repositories:**
- **UI Components**: https://github.com/RevenueCat/purchases-ui-js — Shared UI components
- **Hybrid Common**: https://github.com/RevenueCat/purchases-hybrid-common — Shared types and mappings

When implementing features or debugging, check these repos for reference and patterns.

## Important: Public API Stability

**Do NOT introduce breaking changes to the public API.** The SDK is used by many production web apps.

**Safe changes:**
- Adding new optional parameters to existing methods
- Adding new classes, methods, or properties
- Bug fixes that don't change method signatures
- Internal implementation changes

**Requires explicit approval:**
- Removing or renaming public classes/methods/properties
- Changing method signatures (parameter types, required params)
- Changing return types
- Modifying behavior in ways that break existing integrations

The `api-report/` directory tracks the public API surface. Run `pnpm run extract-api` to validate API changes.

## Code Structure

```
purchases-js/
├── src/
│   ├── main.ts                      # Main entry point - Purchases class
│   ├── entities/                    # Type definitions & data models
│   ├── helpers/                     # Utility functions
│   ├── networking/                  # API communication
│   ├── ui/                          # Svelte UI components
│   ├── behavioural-events/          # Analytics & event tracking
│   ├── stripe/                      # Stripe payment integration
│   ├── paddle/                      # Paddle payment integration
│   └── tests/                       # Test suite
├── dist/                            # Build output (UMD + ESM + CSS)
├── examples/webbilling-demo/        # Demo application
├── api-report/                      # API documentation
├── .storybook/                      # Storybook configuration
└── fastlane/                        # Release automation
```

## Common Development Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm run build            # TypeScript + Vite build (UMD + ES)
pnpm run build:dev        # Development build
pnpm run build:dev-watch  # Watch mode development
pnpm run watch            # Vite watch mode

# Testing
pnpm run test             # Run tests with Vitest
pnpm run test:watch       # Watch mode testing
pnpm run test:typecheck   # TypeScript type checking
pnpm run typecheck        # Full typecheck without emit

# Code Quality
pnpm run lint             # Prettier check
pnpm run format           # Prettier formatting
pnpm run svelte-check     # Svelte template checking

# UI & Documentation
pnpm run storybook        # Run Storybook dev server (port 6006)
pnpm run build-storybook  # Build static Storybook
pnpm run extract-api      # Generate API documentation

# Package for local testing
pnpm run pack-build       # Build + npm pack
```

## Project Architecture

### Main Class: `Purchases` (src/main.ts)
- **Singleton Pattern**: `Purchases.sharedInstance` accessible via `getSharedInstance()`
- **Initialization**: `Purchases.configure(config)` — must be called first
- **Key Methods**:
  - `getOfferings()` — Fetch products & offerings
  - `purchasePackage()` — Process purchase
  - `getCustomerInfo()` — Get user subscription data
  - `logIn()` / `logOut()` — User authentication
  - `presentPaywall()` — Display native paywall UI

### Payment Gateways
- **Stripe** (`stripe/`) — Primary payment provider
- **Paddle** (`paddle/`) — Secondary payment provider
- **Simulated Store** — For testing

### UI Components
- Built with **Svelte 5** using runes syntax
- Components in `src/ui/` follow atomic design (atoms → molecules → organisms)
- **Storybook** documentation at port 6006

### Testing
- **Framework**: Vitest with jsdom environment
- **Component Testing**: @testing-library/svelte
- **API Mocking**: Mock Service Worker (MSW)

## Constraints / Support Policy

| Requirement | Version |
|-------------|---------|
| Node.js | ^22.18 or ^24.11 |
| pnpm | 10.23.0 |
| TypeScript | 5.7.2 |

## Testing

```bash
# Unit tests
pnpm run test

# Type checking
pnpm run typecheck

# Svelte validation
pnpm run svelte-check

# API surface validation
pnpm run extract-api
```

## Development Workflow

1. Install dependencies: `pnpm install`
2. Start dev server: `pnpm run build:dev-watch`
3. Run Storybook for UI development: `pnpm run storybook`
4. Make changes
5. Run tests: `pnpm run test`
6. Format code: `pnpm run format`
7. Validate types: `pnpm run typecheck`

## Pull Request Labels

When creating a pull request, **always add one of these labels** to categorize the change:

| Label | When to Use |
|-------|-------------|
| `pr:feat` | New user-facing features or enhancements |
| `pr:fix` | Bug fixes |
| `pr:other` | Internal changes, refactors, CI, docs, or anything that shouldn't trigger a release |

## When the Task is Ambiguous

1. Search for similar existing implementation in this repo first
2. Check purchases-ui-js for UI component patterns
3. If there's a pattern, follow it exactly
4. If not, propose options with tradeoffs and pick the safest default

## Guardrails

- **Don't invent APIs or file paths** — verify they exist before referencing them
- **Don't remove code you don't understand** — ask for context first
- **Don't make large refactors** unless explicitly requested
- **Keep diffs minimal** — only touch what's necessary, preserve existing formatting
- **Don't break the public API** — run `pnpm run extract-api` to validate
- **Follow Svelte 5 patterns** — use runes syntax (`$props()`, `$derived`)
- **Run format and lint** before committing
- **Never commit API keys or secrets** — do not stage or commit credentials or sensitive data
