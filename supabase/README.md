# ServiceNow Identity on Supabase — Setup

This project implements a ServiceNow-style authentication and identity system
on **Next.js + Supabase only**:

- **Identity** — `public.sys_user` (the `sys_user` record: `user_name`, `email`,
  `active`, `locked_out`, `first_name`, `last_name`, `department`, `manager_id`,
  …). No passwords are stored here.
- **Authentication** — Supabase Auth (`auth.users` holds credentials,
  sessions, refresh tokens). Linked via `sys_user.auth_user_id`.
- **Authorization** — `sys_role`, `sys_group`, `sys_user_role` (direct grants),
  `sys_group_member` (membership), `sys_group_role` (group → role inheritance),
  `sys_acl` (resource + operation → required role/group). Evaluated
  user → group → role → ACL in `src/lib/identity/authorization.ts`, with RLS
  as the database backstop.

## 1. Apply the migration

Supabase Dashboard → SQL Editor → New Query → paste the full contents of
`supabase/migrations/0001_servicenow_identity.sql` → Run.

This creates tables, helper functions (`current_sys_user_id()`,
`current_effective_roles()`, `session_has_role()`, `session_is_admin()`),
RLS policies, and seeds:

- Roles: `admin`, `security_admin`, `itil`, `approver`, `end_user`, `knowledge`
- Groups: Service Desk, Network Engineering, Database Administrators,
  Hardware & Asset Support, Software Applications (all grant `itil`)
- ACLs for `incident`, `problem`, `change_request`, `sc_req_item`,
  `kb_knowledge`, `catalog`, `sys_user`
- Demo `sys_user` profiles with `auth_user_id = NULL` (linked on first sign-in)

## 2. Auth settings (practice instance)

Authentication → Sign In / Sign Up → **disable “Confirm email”** for instant
practice logins. (If left enabled, sign-up succeeds but the user must confirm
the email before the first session — the UI explains this.)

## 3. Create Auth users for the demo personas

Authentication → Users → Add user → Create new user for each persona
(check “Auto Confirm User” if email confirmation is on):

| sys_user (User ID) | email (must match seed)            | password   |
|--------------------|------------------------------------|------------|
| admin              | admin@service-now.simulator        | Admin123!  |
| beth.anglin        | beth.anglin@service-now.simulator  | Beth123!   |
| david.loo          | david.loo@service-now.simulator    | David123!  |
| fred.luddy         | fred.luddy@service-now.simulator   | Fred123!   |
| abel.tuter         | abel.tuter@service-now.simulator   | Abel123!   |
| itil.user          | itil.user@service-now.simulator    | Itil123!   |

On first sign-in the app matches the Auth email to the seeded `sys_user`
row and fills `auth_user_id`, resets `failed_login_count`, and stamps
`last_login_at`. No SQL needed for linking.

## 4. How sign-in works (code)

`src/lib/identity/authentication.ts` → `signInWithUserName(user_name, password)`:

1. Look up `sys_user` by `user_name` → enforce `active` / `locked_out`.
2. `supabase.auth.signInWithPassword({ email, password })` (sole credential check).
3. Link `auth_user_id`, reset failures, stamp login. On failure, increment
   `failed_login_count` and set `locked_out` at 5 attempts.
4. `fetchFullIdentity(authUserId)` loads profile + direct roles + group
   memberships + inherited roles + ACLs (`src/lib/identity/identity.ts`).
5. `evaluateAcl()` (`src/lib/identity/authorization.ts`) gates every
   resource/operation; `store.aclCan(resource, op)` is the shared entry point
   for Incident / Problem / Change / Request / Knowledge modules.

## 5. Admin console

Sign in as `admin` → All → User Administration → Identity Console:

- Users: search, create (Auth account + profile + roles/groups in one step),
  activate/deactivate, lock/unlock.
- Roles / Groups: directory of `sys_role` / `sys_group`.
- Access Control: live `sys_acl` matrix (resource × operation → requirement).

## 6. Offline fallback

Without Supabase env vars the app runs the local simulator (salted-hash vault
in the browser, seed personas, mirrored ACL policy in
`authorization.ts → canOffline`). The Identity Console shows a “not connected”
notice in that mode.
