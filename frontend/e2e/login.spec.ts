import { test, expect } from '@playwright/test';

// A fresh, unique email per test run avoids colliding with rows left over
// from a previous run (or from earlier manual testing against the same DB).
function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}@test.com`;
}

test.describe('Login flow', () => {
  test('registering a new user lands on the Employee dashboard', async ({ page }) => {
    const email = uniqueEmail('register');

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    await page.getByLabel('First name').fill('E2E');
    await page.getByLabel('Last name').fill('Test');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Registration always creates an EMPLOYEE (backend-enforced, see Step 3),
    // so the role router (Step 14) should land us on the Employee dashboard.
    await expect(page).toHaveURL(/\/employee\/dashboard$/);
    await expect(page.getByText(`Logged in as ${email}`)).toBeVisible();
  });

  test('logging in with the wrong password shows an error', async ({ page }) => {
    const email = uniqueEmail('wrongpw');

    // Create a real account first, so "wrong password" is genuinely testing
    // the password check, not just "user doesn't exist".
    await page.goto('/register');
    await page.getByLabel('First name').fill('E2E');
    await page.getByLabel('Last name').fill('Test');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/employee\/dashboard$/);

    // Now log out (clear storage) and try logging back in with a wrong password.
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('the-wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    // Must still be on the login page — a failed login should never navigate away.
    await expect(page).toHaveURL(/\/login$/);
  });

  test('visiting a protected route while logged out redirects to /login', async ({ page }) => {
    await page.goto('/employee/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  });
});
