# E2E Test Cases — Task Manager

```
Seeded Credentials
==================
Regular user:  user@taskmanager.dev  /  User1234!
Admin user:    admin@taskmanager.dev /  Admin1234!
App URL:       http://localhost:3000
```

---

## Auth Flows

### 1. Signup with valid data

**Preconditions:** No existing account with the test email.

**Steps:**
1. Navigate to `/signup`.
2. Enter a unique name, a valid email, and a password meeting requirements.
3. Submit the form.

**Expected result:** User is redirected to the dashboard (`/`). The header shows the user's name.

---

### 2. Signup with duplicate email

**Preconditions:** An account already exists with `user@taskmanager.dev`.

**Steps:**
1. Navigate to `/signup`.
2. Enter `user@taskmanager.dev` and any password.
3. Submit the form.

**Expected result:** A 409 error is shown inline (e.g., "Email already in use"). The form is not submitted successfully.

---

### 3. Signup with invalid email format

**Preconditions:** None.

**Steps:**
1. Navigate to `/signup`.
2. Enter `notanemail` in the email field.
3. Attempt to submit the form.

**Expected result:** Inline validation error appears on the email field. Form is not submitted to the server.

---

### 4. Login with valid credentials (regular user)

**Preconditions:** Seed has been run (`npx prisma db seed`).

**Steps:**
1. Navigate to `/login`.
2. Enter `user@taskmanager.dev` / `User1234!`.
3. Submit the form.

**Expected result:** User is redirected to the dashboard (`/`). Task list is visible. No "Admin" link in the header.

---

### 5. Login with valid credentials (admin user)

**Preconditions:** Seed has been run.

**Steps:**
1. Navigate to `/login`.
2. Enter `admin@taskmanager.dev` / `Admin1234!`.
3. Submit the form.

**Expected result:** User is redirected to the dashboard. An "Admin" link is visible in the header.

---

### 6. Login with wrong password

**Preconditions:** Seed has been run.

**Steps:**
1. Navigate to `/login`.
2. Enter `user@taskmanager.dev` and an incorrect password.
3. Submit the form.

**Expected result:** An error message is shown (e.g., "Invalid credentials"). The user remains on `/login`.

---

### 7. Session persists after page refresh

**Preconditions:** User is logged in as `user@taskmanager.dev`.

**Steps:**
1. Verify dashboard is visible.
2. Reload the page (F5 / Cmd+R).

**Expected result:** Dashboard is still shown. User is not redirected to `/login`.

---

### 8. Logout

**Preconditions:** User is logged in.

**Steps:**
1. Click the logout button in the header.
2. After redirect, attempt to navigate to `/`.

**Expected result:** User is redirected to `/login` after logout. Navigating to `/` again redirects back to `/login`, confirming the session cookie has been cleared.

---

## Task CRUD

### 9. Create task with title only

**Preconditions:** Logged in as regular user.

**Steps:**
1. Click "Create Task" / "New Task" button.
2. Enter a title (e.g., "My first task"). Leave all other fields blank.
3. Submit the form.

**Expected result:** Task appears in the list with status `TODO` and priority `MEDIUM`. Description and due date are empty.

---

### 10. Create task with all fields

**Preconditions:** Logged in as regular user.

**Steps:**
1. Click "Create Task".
2. Enter title "Full task", description "A description", status `IN_PROGRESS`, priority `HIGH`, and a future due date.
3. Submit the form.

**Expected result:** Task appears in the list with all fields correctly reflected.

---

### 11. Create task with empty title

**Preconditions:** Logged in as regular user.

**Steps:**
1. Click "Create Task".
2. Leave the title field empty.
3. Attempt to submit.

**Expected result:** Inline validation error appears on the title field ("Title is required" or equivalent). Form is not submitted to the server.

---

### 12. Edit task (change title and priority)

**Preconditions:** At least one task exists for the logged-in user.

**Steps:**
1. Click the edit button on an existing task.
2. Change the title and set priority to `LOW`.
3. Submit the form.

**Expected result:** The task row in the list reflects the updated title and priority without a full page reload.

---

### 13. Mark task as complete (optimistic update)

**Preconditions:** At least one task with status other than `DONE` exists.

**Steps:**
1. Click the mark-complete toggle/checkbox on a task.

**Expected result:** The task's status changes to `DONE` immediately in the UI (optimistic update) before the server responds. After server confirmation, the change persists.

---

### 14. Delete task (optimistic update)

**Preconditions:** At least one task exists.

**Steps:**
1. Click delete on a task and confirm the dialog.

**Expected result:** The task row disappears from the list immediately (optimistic update). After server confirmation, the task is gone on refresh.

---

### 15. Delete task — confirm dialog

**Preconditions:** At least one task exists.

**Steps:**
1. Click the delete button on a task.

**Expected result:** A confirmation dialog appears asking the user to confirm deletion. The task is only deleted after the user confirms.

---

## Filter / Search / Sort / Pagination

### 16. Filter by status "In Progress"

**Preconditions:** Tasks with different statuses exist (`TODO`, `IN_PROGRESS`, `DONE`).

**Steps:**
1. Select "In Progress" from the status filter.

**Expected result:** Only tasks with status `IN_PROGRESS` are shown.

---

### 17. Search by title keyword

**Preconditions:** Multiple tasks exist with different titles.

**Steps:**
1. Type a keyword that matches only some task titles in the search box.

**Expected result:** After debounce, only tasks whose titles contain the keyword are shown.

---

### 18. Sort by due date ascending

**Preconditions:** Multiple tasks exist with different due dates.

**Steps:**
1. Set sort to "Due Date" and direction to "Ascending".

**Expected result:** Tasks are ordered with the earliest due date first.

---

### 19. Sort by priority

**Preconditions:** Tasks with different priorities exist.

**Steps:**
1. Set sort to "Priority".

**Expected result:** Tasks are ordered by priority value (alphabetical enum order: HIGH → LOW → MEDIUM for ascending, or reverse for descending).

---

### 20. Filter + search + sort compose correctly

**Preconditions:** A variety of tasks exist.

**Steps:**
1. Set status filter to `TODO`.
2. Enter a search term.
3. Set sort to "Created At" descending.

**Expected result:** The result set matches all three constraints simultaneously — only `TODO` tasks whose titles match the search term, ordered by creation date descending.

---

### 21. Pagination: navigate to page 2

**Preconditions:** More tasks exist than the page size (default 10).

**Steps:**
1. Navigate to page 2 using the pagination control.

**Expected result:** The correct offset of tasks is shown (tasks 11–20 for page size 10). The page indicator reflects page 2.

---

## Admin

### 22. Admin sees "Admin" link in header

**Preconditions:** None.

**Steps:**
1. Log in as `admin@taskmanager.dev` / `Admin1234!`.

**Expected result:** An "Admin" link is visible in the header.

---

### 23. Admin visits `/admin` and sees all users' tasks

**Preconditions:** Both regular user and admin have tasks.

**Steps:**
1. Log in as admin.
2. Navigate to `/admin`.

**Expected result:** Tasks from all users are shown in the admin task list.

---

### 24. Admin task list has no edit or delete controls

**Preconditions:** Logged in as admin, on `/admin`.

**Steps:**
1. Inspect the task rows on the admin page.

**Expected result:** No edit buttons and no delete buttons are visible on task rows.

---

### 25. Regular user redirected from `/admin`

**Preconditions:** Logged in as regular user (`user@taskmanager.dev`).

**Steps:**
1. Navigate directly to `/admin`.

**Expected result:** User is redirected to the dashboard (`/`).

---

## Attachments

### 26. Upload a valid image file

**Preconditions:** Logged in as regular user. At least one task exists.

**Steps:**
1. Open the task detail sheet.
2. Use the attachment upload control to select a valid image file (≤ 5 MB, e.g., `.png` or `.jpg`).
3. Confirm the upload.

**Expected result:** The file appears in the attachment list with its file name. The attachment is persisted after page reload.

---

### 27. Upload a file larger than 5 MB

**Preconditions:** Logged in, task detail sheet open.

**Steps:**
1. Attempt to upload a file larger than 5 MB.

**Expected result:** An error message is shown (e.g., "File exceeds 5 MB limit"). The file is not added to the attachment list.

---

### 28. Upload an invalid file type

**Preconditions:** Logged in, task detail sheet open.

**Steps:**
1. Attempt to upload a `.exe` file (or another unsupported type).

**Expected result:** An error message is shown (e.g., "File type not allowed"). The file is not added to the attachment list.

---

### 29. Remove an attachment

**Preconditions:** A task has at least one attachment.

**Steps:**
1. Open the task detail sheet.
2. Click the remove/delete button on an attachment.

**Expected result:** The attachment is removed from the list. After page reload, it is no longer shown.

---

## Activity Log

### 30. Create a task — activity log entry

**Preconditions:** Logged in as regular user.

**Steps:**
1. Create a new task.
2. Open the task detail sheet and navigate to the activity log section.

**Expected result:** An entry with action `CREATED` (or "Task created") is visible at the top of the log.

---

### 31. Update task status — activity log entry

**Preconditions:** A task exists. Logged in as its owner.

**Steps:**
1. Change the task's status (e.g., from `TODO` to `IN_PROGRESS`).
2. Open the task detail sheet and check the activity log.

**Expected result:** An entry with action `STATUS_CHANGED` is visible, showing the previous and new status values.

---

### 32. Add attachment — activity log entry

**Preconditions:** A task exists. Logged in as its owner.

**Steps:**
1. Upload a valid attachment to the task.
2. Check the activity log for that task.

**Expected result:** An entry with action `ATTACHMENT_ADDED` is visible, including the file name in the metadata.

---

## Dark Mode

### 33. Toggle dark mode and verify persistence

**Preconditions:** App is loaded (any page, logged in or not).

**Steps:**
1. Click the dark mode toggle in the header.
2. Verify the theme switches (light → dark or dark → light).
3. Reload the page.

**Expected result:** The selected theme persists after reload. If dark mode was activated, the page reloads in dark mode.
