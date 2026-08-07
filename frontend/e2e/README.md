# E2E tests

These are real end-to-end tests — they drive an actual Chromium browser against
the actual running app, which talks to the actual backend API and database.
Nothing here is mocked.

**Before running `npm run test:e2e`, make sure:**
1. The Postgres container is running (`docker start onboarding-postgres` if needed)
2. The backend is running (`cd ../backend && npm run start:dev`)

Playwright's own `webServer` config starts the *frontend* automatically (on
port 3002, separate from your normal dev server on 3001), but it does not
start the backend or database — those are real external dependencies, not
something a frontend test config should be reaching into.
