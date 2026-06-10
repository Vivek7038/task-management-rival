// Seeded accounts required before running these tests (npx prisma db seed):
//   user@taskmanager.dev  /  User1234!
//   admin@taskmanager.dev / Admin1234!

import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test('Admin login shows Admin link', async ({ page }) => {
  await login(page, 'admin@taskmanager.dev', 'Admin1234!');
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
});

test('Admin visits /admin', async ({ page }) => {
  await login(page, 'admin@taskmanager.dev', 'Admin1234!');
  await page.goto('/admin');
  await expect(page).toHaveURL('/admin');
  await expect(page.getByRole('heading', { name: /Admin.*All Tasks/i })).toBeVisible();
});

test('Regular user visits /admin', async ({ page }) => {
  await login(page, 'user@taskmanager.dev', 'User1234!');
  await page.goto('/admin');
  await expect(page).toHaveURL('/');
});
