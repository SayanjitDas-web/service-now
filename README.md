# ServiceNow Platform Simulator (Washington DC • Polaris Next Experience)

An authentic, comprehensive, 1:1 clone of the **ServiceNow Enterprise Platform** designed for administrators, developers, students, and certification candidates preparing for **CSA (Certified System Administrator)**, **CAD (Certified Application Developer)**, and **ITSM Implementation Specialist**.

Built with **Next.js (App Router, Turbopack)**, **Vanilla CSS (Polaris Design System)**, **Supabase (PostgreSQL Cloud Persistence)**, and **ImageKit (Media & Attachment Delivery)**.

---

## 🌟 Key Features & Workflow Architecture

### 1. Unified Navigation (Polaris Next Experience)
- **ServiceNow Instance Banner**: Instance branding, scope selector (`Global`), and active Update Set indicator.
- **Filter Navigator (`type filter text`)**: Collapsible, searchable tree of platform applications and modules.
- **Polaris Header Tabs**:
  - **All**: Hierarchical tree of applications (Incident, Problem, Change, Service Catalog, Knowledge, CMDB, System Definition, System Administration, Custom Apps).
  - **Favorites**: Starred modules and records with quick access.
  - **History**: Chronological audit trail of recently visited records and lists.
  - **Workspaces**: Quick jump to ITSM Agent Workspace and Service Operations Workspace (SOW).
- **ServiceNow Identity (Supabase)**: `sys_user` profiles, Supabase Auth sessions, user → group → role → ACL authorization, and an admin Identity Console for users/roles/groups/access.
- **User Impersonation (admin-only)**: Realistic admin impersonation modal to switch personas between *System Administrator*, *Beth Anglin (ITIL)*, *David Loo (Change Manager)*, *Fred Luddy*, and *Abel Tuter (End User)*. Displays the iconic yellow impersonation banner with one-click return.
- **Global Zing/AI Search (`Ctrl + K`)**: Unified search across incidents, problems, changes, catalog items, knowledge articles, and users.

### 2. List View Engine (ServiceNow List v2 / Polaris List)
- **Table Header & Record Counts**: Real-time counts, quick keyword search, and `+ New` record creation.
- **Breadcrumb Bar with Condition Builder**: Interactive breadcrumb trail (`All > Active = true > Priority = 1 - Critical`).
- **Condition Builder (Funnel Icon)**: Compound filter builder supporting fields, operators (`is`, `is not`, `contains`, `starts with`, `greater than`, `less than`), and `AND` clauses.
- **Column Quick Search**: In-line search inputs beneath each table column.
- **Column Sorting**: Single-click ascending and descending sorting.
- **Personalize List Columns (Slushbucket UI)**: Dual-listbox dialog with `Available` vs `Selected` columns and `Move Up` / `Move Down` sequence reordering.
- **Bulk Record Actions**: Checkbox multi-select with `Delete Selected` and `Export XML`.

### 3. Form View Engine (ServiceNow Form)
- **Form Header & UI Actions**: `Save` (keeps on form), `Update` / `Submit` (commits and returns to list), `Resolve` (validates close notes), `Close Incident`, `Create Problem`, `Create Change`, and `Delete`.
- **Reference Fields**:
  - **Magnifying Glass Lookup**: Interactive dialog to browse and select from target tables (`sys_user`, `cmdb_ci`, `sys_user_group`).
  - **Info `(i)` Preview Card**: Hover and click mini-card displaying referenced user profile (email, phone, location, department) or CI technical details.
- **Validation**: Mandatory field asterisks (`*`) and ServiceNow error bars preventing submission if mandatory fields are missing.
- **Form Tabs & Sections**:
  - **Notes & Activity Stream**: Internal technical **Work notes** (yellow), customer-facing **Additional comments** (purple), and chronological activity timeline.
  - **Related Records**: Problem, Change Request, and Parent Incident linkage.
  - **Resolution Information**: Resolution code, mandatory resolution notes, resolved by, and resolved at timestamps.
- **Related Lists**: Tabbed related lists at the bottom including **Task SLAs** (with progress bars and breach timers) and **Affected CIs**.
- **Attachment Management**: Direct file uploads powered by **ImageKit** with file size, thumbnail preview, and direct download links.

### 4. Core Developer & System Administration Engines
- **Scripts - Background (`sys.scripts.do`)**:
  - Authentic server-side JavaScript sandbox with a full **GlideRecord** interpreter!
  - Supports `new GlideRecord('incident')`, `gr.addQuery()`, `gr.query()`, `gr.next()`, `gr.setValue()`, `gr.update()`, `gr.insert()`, and `gr.deleteRecord()`.
  - Supports **GlideSystem (`gs`)**: `gs.print()`, `gs.log()`, `gs.getUserID()`, `gs.getUserName()`, `gs.nowDateTime()`, `gs.beginningOfToday()`.
  - Includes pre-loaded CSA/CAD certification practice templates.
- **Client Scripts (`sys_script_client`)**:
  - Define `onLoad`, `onChange`, and `onSubmit` scripts.
  - Live **`g_form` sandbox**: `g_form.getValue()`, `g_form.setValue()`, `g_form.setMandatory()`, `g_form.addInfoMessage()`, `g_form.addErrorMessage()`, and `g_user.hasRole()`.
- **Business Rules (`sys_script`)**:
  - Server-side database triggers with `before`, `after`, `async`, and `display` timing on Insert, Update, and Delete operations.
  - Built-in Priority calculation engine implementing the standard ITIL **Impact × Urgency matrix**.
- **Flow Designer**:
  - Visual automation canvas with Trigger cards (Record Created/Updated), Action steps (*Send Email*, *Create Task*, *Ask for Approval*, *Update Record*), and a **Test Flow** execution engine with step-by-step logs.
- **Tables & Columns Data Dictionary (`sys_db_object`)**:
  - Inspect platform schema and base tables.
  - Create new custom tables with automatic `u_` prefix, table inheritance (`task`, `cmdb_ci`), and custom column definitions.
- **Update Sets (`sys_update_set`)**:
  - Track customizations in the current active Update Set.
  - "Make Current", "Complete", and **Export to XML** for migration.
- **Service Catalog**:
  - End-user portal to order Hardware (MacBook Pro), Software licenses (JetBrains), Cloud Sandboxes, and MFA resets.
  - Dynamic catalog variables form and automated workflow generating **REQ** -> **RITM** -> **SCTASK**.

### 5. Interactive Practice & Certification Labs
Click the **"Practice Labs"** button in the top header to access guided hands-on scenarios:
- **Lab 1 (CSA)**: Role-Based Access & User Impersonation.
- **Lab 2 (ITSM)**: High Severity Incident Triage & Resolution.
- **Lab 3 (CSA)**: Custom Application Table & Schema Architecture.
- **Lab 4 (CAD)**: Client Script (`g_form`) UI Policy Simulator.
- **Lab 5 (ITSM)**: Service Catalog Request & RITM Fulfillment.

Each lab includes instructions, exam tips, and a **"Verify Task Completion"** button that inspects the real platform state and checks your work!

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling**: Vanilla CSS with ServiceNow Polaris design system tokens (Light, Dark, and High-Contrast themes)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL cloud database with automatic browser fallback)
- **Media & CDN**: [ImageKit](https://imagekit.io/) (Image & attachment uploads, transforms, and CDN delivery)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 ServiceNow-Style Authentication & Identity (Next.js + Supabase)

The platform starts at a **sign-in gate** backed by a ServiceNow-structured
identity model. Full setup: [`supabase/README.md`](supabase/README.md).

- **Identity** (`sys_user`): `user_name`, `email`, `active`, `locked_out`,
  `first_name`, `last_name`, `department`, `manager`, `title`, `phone`, `location`.
  Profiles never store passwords.
- **Authentication** (Supabase Auth): email + password in `auth.users`,
  sessions + logout via `supabase.auth`. Login accepts the ServiceNow User ID,
  resolves it to the Auth email, enforces `active`/`locked_out`, links
  `auth_user_id` on first sign-in, and locks the account after 5 failures.
- **Authorization** (user → group → role → ACL): direct `sys_user_role` grants
  plus inherited roles via `sys_group_member` → `sys_group_role`; every
  resource/operation (`incident`, `problem`, `change_request`, `sc_req_item`,
  `kb_knowledge`, `catalog`, `sys_user` × `read/create/update/delete`) is
  evaluated against `sys_acl` in `src/lib/identity/authorization.ts`, with
  Supabase RLS as the database backstop. `store.aclCan()` is the shared entry
  point for all future ITSM modules.
- **Demo accounts** (create matching Auth users per `supabase/README.md`):
  - `admin / Admin123!` (admin, security_admin, itil)
  - `beth.anglin / Beth123!` (itil)
  - `david.loo / David123!` (itil, approver)
  - `fred.luddy / Fred123!` (admin, itil)
  - `abel.tuter / Abel123!` (end_user)
  - `itil.user / Itil123!` (itil)
- **Admin console** (admin only): All → User Administration → Identity Console —
  create users (Auth + profile + roles/groups), activate/deactivate,
  lock/unlock, grant/revoke roles, add/remove group memberships, and inspect
  the live ACL matrix.
- **Account menu** (avatar, top-right): profile + effective roles, Polaris theme,
  compact density, demo-data reset (admin), and sign out.
- **Offline fallback**: without Supabase env vars the simulator runs locally
  (browser vault + mirrored ACL policy) with full functionality.

## ☁️ Connecting Supabase & ImageKit

Server-managed only via environment variables (the gear-based in-app editor was removed).

Create a `.env.local` file based on `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_your_key
IMAGEKIT_PRIVATE_KEY=private_your_key
```

*Note: If credentials are not provided, the platform automatically runs in LocalStorage Simulator mode with 100% full functionality.*
