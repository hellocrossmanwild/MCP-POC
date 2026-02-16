# Contributing

Thanks for your interest in contributing to the MCP Recruitment Pipeline.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/mcp-recruitment-pipeline.git`
3. Install dependencies: `npm install`
4. Set up PostgreSQL and copy `.env.example` to `.env`
5. Run migrations: `npm run migrate`
6. Seed the database: `npm run seed`
7. Start the dev server: `npm run dev`

## Development Workflow

- Run tests before submitting: `npm test`
- Run the linter: `npm run lint`
- Check test coverage: `npm run test:coverage`

## Code Style

- TypeScript strict mode is enforced
- All exported functions must have JSDoc comments
- Database queries must use parameterised values (never string interpolation)
- No `any` types

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear, descriptive commits
3. Ensure all tests pass and coverage doesn't drop
4. Open a PR with a description of what changed and why

## Adding New MCP Tools

1. Add the query function to `src/tools.ts` with JSDoc
2. Register the tool in `createMcpServer()` in `src/index.ts` with a Zod schema
3. Add the migration SQL to a new file in `migrations/`
4. Write unit tests in `__tests__/unit/tools.test.ts`
5. Write integration tests in `__tests__/integration/database.test.ts`
6. Update `README.md` with the new tool

## Reporting Issues

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Server logs if applicable

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
