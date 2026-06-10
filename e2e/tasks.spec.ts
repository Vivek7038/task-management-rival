// Seeded accounts required before running these tests (npx prisma db seed):
//   user@taskmanager.dev  /  User1234!
//   admin@taskmanager.dev / Admin1234!

import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.beforeEach(async ({ page }) => {
  await login(page, 'user@taskmanager.dev', 'User1234!');
});

test('Create task with title only', async ({ page }) => {
  const title = `E2E Title Only ${Date.now()}`;
  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});

test('Create task with all fields', async ({ page }) => {
  const title = `E2E Full Task ${Date.now()}`;
  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill('E2E description text');
  await page.getByLabel('Status').selectOption('IN_PROGRESS');
  await page.getByLabel('Priority').selectOption('HIGH');
  // Due date is an <input type="datetime-local">, which requires a full
  // local datetime value (YYYY-MM-DDTHH:mm). It must be in the future —
  // past dates are rejected by validation — so compute a date ~1 year out.
  const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const futureValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T00:00`;
  await page.getByLabel('Due date').fill(futureValue);
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText(title)).toBeVisible();
});

test('Create task with empty title', async ({ page }) => {
  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText('Title is required')).toBeVisible();
  await expect(page.getByLabel('Title')).toBeVisible();
});

test('Create task with past due date is rejected', async ({ page }) => {
  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('Title').fill(`E2E Past Due ${Date.now()}`);
  // A date well in the past must be rejected by validation.
  const past = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const pastValue = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}T00:00`;
  await page.getByLabel('Due date').fill(pastValue);
  await page.getByRole('button', { name: 'Create task' }).click();
  // Form stays open with an inline error; task is not created.
  await expect(page.getByText('Due date cannot be in the past')).toBeVisible();
  await expect(page.getByLabel('Due date')).toBeVisible();
});

test('Edit task', async ({ page }) => {
  const originalTitle = `E2E Edit Original ${Date.now()}`;
  const updatedTitle = `E2E Edit Updated ${Date.now()}`;

  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('Title').fill(originalTitle);
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText(originalTitle)).toBeVisible();

  await page.getByRole('button', { name: 'Edit task' }).first().click();
  await page.getByLabel('Title').fill(updatedTitle);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(updatedTitle)).toBeVisible();
});

test('Mark task as complete', async ({ page }) => {
  const title = `E2E Complete Task ${Date.now()}`;
  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole('button', { name: 'Mark complete' }).first().click();
  await expect(page.getByRole('button', { name: 'Mark incomplete' }).first()).toBeVisible();
});

test('Delete task', async ({ page }) => {
  const title = `E2E Delete Task ${Date.now()}`;
  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByText(title)).toBeVisible();

  await page.getByRole('button', { name: 'Delete task' }).first().click();
  await expect(page.getByRole('heading', { name: 'Delete task' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  // exact match avoids also matching the confirm dialog's description text,
  // which embeds the title ("Are you sure you want to delete "…"?").
  await expect(page.getByText(title, { exact: true })).not.toBeVisible();
});

test('Filter by status', async ({ page }) => {
  // The status filter is a dropdown menu; items have role "menuitem".
  await page.getByRole('button', { name: 'All' }).click();
  await page.getByRole('menuitem', { name: 'In Progress' }).click();
  // The trigger label reflects the active filter once applied.
  await expect(page.getByRole('button', { name: 'In Progress' })).toBeVisible();
});

test('Search by title', async ({ page }) => {
  const title = `E2E Search Task ${Date.now()}`;
  const otherTitle = `E2E Other Task ${Date.now()}`;

  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();

  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByLabel('Title').fill(otherTitle);
  await page.getByRole('button', { name: 'Create task' }).click();

  await page.getByPlaceholder('Search tasks…').fill(title);
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText(otherTitle)).not.toBeVisible();
});

test('Sort by due date', async ({ page }) => {
  // The sort trigger button is labelled with the current sort field,
  // which defaults to "Date Created". Items have role "menuitem".
  await page.getByRole('button', { name: 'Date Created' }).click();
  await page.getByRole('menuitem', { name: 'Due Date' }).click();
  // Trigger label updates to the selected sort field once applied.
  await expect(page.getByRole('button', { name: 'Due Date' })).toBeVisible();
});
