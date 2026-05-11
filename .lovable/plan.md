# Plan: Gated Saves + Admin User List

## Goal
- Players can play freely without an account.
- Sign-in becomes **required** to use Save / Load (local or cloud).
- Every registered player is captured in a `profiles` table.
- You get an in-app `/admin` page that lists everyone, with an export.

---

## Part 1 — Database

New tables (migration):

**`profiles`** — auto-created on signup via trigger
- `user_id` (FK → auth.users, unique, cascade)
- `email`, `display_name`, `avatar_url`
- `last_family_played`, `last_seen_at`, `total_saves`
- `created_at`, `updated_at`

**`app_role`** enum (`admin`, `player`) and **`user_roles`** table
- Stored separately from profiles (security best practice — avoids privilege-escalation).
- `has_role(user_id, role)` SECURITY DEFINER function for RLS checks.

**Trigger**: `on_auth_user_created` → inserts a `profiles` row + assigns default `player` role.

**RLS**:
- Players can view/update only their own profile.
- Admins can view all profiles and all roles via `has_role(auth.uid(), 'admin')`.
- `cloud_saves` table already exists; admins also get read access for the admin view.

**Bootstrap**: After migration, I'll insert your `admin` role row using the email you confirm below.

---

## Part 2 — Gate Save/Load behind sign-in

- `SaveLoadDialog` already shows `CloudAuthPanel` for unauthenticated users. Change behavior so:
  - When signed out, the Save and Load tabs show a **"Sign in to save your progress"** prompt with the auth panel inline (no save slots visible).
  - Manage Saves / Export / Import remain available for already-downloaded JSON files only.
- Disable the autosave loop in `UltimateMafiaGame.tsx` while signed-out (current autosave silently writes to IndexedDB; we'll skip it cleanly with a one-time "Sign in to enable autosave" toast).
- Update the Save/Load button badge to read **"Sign in to save"** when signed out.

---

## Part 3 — `/admin` page

New route + page (`src/pages/Admin.tsx`):
- Guarded by `has_role(auth.uid(), 'admin')`. Non-admins get a 404-style message.
- Table view of all profiles:
  - Email, display name, signed-up date, last seen, last family played, save count.
  - Search box (by email), sortable columns, pagination (50/page).
- **Export CSV** button — downloads the full list.
- Row click → drawer showing that user's `cloud_saves` slots (slot, turn, family, save date).

Add a small "Admin" link in the main menu, only rendered when the current user has the admin role.

---

## Part 4 — Profile auto-update

Lightweight hook so `last_seen_at`, `last_family_played`, and `total_saves` stay current:
- `last_seen_at`: updated on app load if signed in.
- `last_family_played`: updated when a new game starts.
- `total_saves`: incremented inside `saveGame` after a successful cloud write.

---

## Out of scope
- Email verification gating (Lovable Cloud sends default verification emails; not blocking play).
- Banning/deleting users from the admin page (read-only v1).
- Admin analytics beyond the user list.

---

## Question before I start
What email address should be granted the `admin` role? (I'll seed it in the migration so you can open `/admin` immediately after signing up with that email.)
