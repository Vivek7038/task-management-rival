// Seeded accounts required before running these tests (npx prisma db seed):
//   user@taskmanager.dev  /  User1234!
//   admin@taskmanager.dev / Admin1234!

import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test('Login with valid regular user', async ({ page }) => {
  await login(page, 'user@taskmanager.dev', 'User1234!');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
});

test('Login with wrong password', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'user@taskmanager.dev');
  await page.fill('#password', 'WrongPassword!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('Session persists after refresh', async ({ page }) => {
  await login(page, 'user@taskmanager.dev', 'User1234!');
  await page.reload();
  await expect(page).toHaveURL('/');
});

test('Logout', async ({ page }) => {
  await login(page, 'user@taskmanager.dev', 'User1234!');
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL('/login');
});

test('Signup with valid new user', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('#name', 'Test User');
  await page.fill('#email', `test-${Date.now()}@example.com`);
  await page.fill('#password', 'NewUser1234!');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/');
});

test('Signup with duplicate email', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('#name', 'Duplicate User');
  await page.fill('#email', 'user@taskmanager.dev');
  await page.fill('#password', 'NewUser1234!');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
