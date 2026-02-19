# Contributing to CareOps

Thank you for your interest in contributing to CareOps! We welcome bug reports,
feature suggestions, and pull requests from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

---

## Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating,
you are expected to uphold this code. Please report unacceptable behaviour to
**amarzeus.dev@gmail.com**.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/careops-app.git
   cd careops-app
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Copy** `.env.example` to `.env` and fill in required values.
5. **Run** database migrations:
   ```bash
   npx prisma db push
   ```
6. **Start** the development server:
   ```bash
   npm run dev
   ```

---

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes, ensuring all tests pass:
   ```bash
   npm run lint
   npm test
   ```
3. Commit your changes (see [Commit Messages](#commit-messages)).
4. Push to your fork and open a Pull Request against `main`.

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

| Type       | Use for                              |
| ---------- | ------------------------------------ |
| `feat`     | A new feature                        |
| `fix`      | A bug fix                            |
| `docs`     | Documentation only changes           |
| `refactor` | Code change that is neither fix/feat |
| `test`     | Adding or fixing tests               |
| `chore`    | Build process or tooling changes     |

**Example:** `feat: add voice reminder scheduling for bookings`

---

## Pull Request Process

1. Ensure your branch is up to date with `main` before opening a PR.
2. Fill in the PR template completely.
3. Link any related issues using `Closes #<issue-number>`.
4. At least one maintainer review is required before merging.
5. All CI checks (lint, test) must pass.

---

## Coding Standards

- **TypeScript** everywhere — no `any` unless unavoidable (and justified with a comment).
- Use absolute imports (`@/`) instead of deep relative paths.
- Keep React components small and composable.
- Follow existing file naming conventions enforced by ESLint.
- Add or update **unit tests** (Vitest) for non-trivial logic.
- Run `npm run format` (Prettier) before committing.

---

## Questions?

Open a [Discussion](https://github.com/amarzeus/careops-app/discussions) or email
**amarzeus.dev@gmail.com**.
