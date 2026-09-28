'use client';

import type { Role, User } from './types';

/**
 * Account auth utilities for the ServiceNow simulator.
 * - Local credential vault (salted SHA-256) persisted in localStorage.
 * - Session persistence in localStorage.
 * - Opportunistic Supabase Auth: if a Supabase client is configured AND the
 *   deployment uses Supabase Auth, callers can try it first, then fall back
 *   to the local vault so the simulator works 100% offline.
 */

export interface StoredCredential {
  userName: string; // lowercase user_name
  sysId: string;
  salt: string;
  passwordHash: string;
}

export interface RegisterInput {
  user_name: string;
  name: string;
  email: string;
  password: string;
}

const CREDENTIALS_KEY = 'sn_auth_credentials';
const SESSION_KEY = 'sn_auth_session';
const CUSTOM_USERS_KEY = 'sn_auth_custom_users';

/** Default demo passwords for seeded personas. Shown on the login screen. */
export const DEFAULT_DEMO_CREDENTIALS: { user_name: string; password: string }[] = [
  { user_name: 'admin', password: 'Admin123!' },
  { user_name: 'beth.anglin', password: 'Beth123!' },
  { user_name: 'david.loo', password: 'David123!' },
  { user_name: 'fred.luddy', password: 'Fred123!' },
  { user_name: 'abel.tuter', password: 'Abel123!' },
  { user_name: 'itil.user', password: 'Itil123!' },
];

function randomSalt(bytes = 16): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function sha256Hex(input: string): Promise<string> {
  // Prefer WebCrypto; fall back to a deterministic FNV/cyrb-style hash for
  // non-secure contexts (file://, older browsers) so auth never hard-crashes.
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fall through to FNV fallback
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ (c + 31), 16777619);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  // Stretch the fallback a little to deter trivial reversal.
  let out = hex(h1) + hex(h2);
  for (let r = 0; r < 3; r++) {
    out = hex(h1 ^ out.charCodeAt(r)) + hex(h2 ^ out.charCodeAt(out.length - 1 - r)) + out;
  }
  return out.slice(0, 64);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}::${password}`);
}

export function loadCredentials(): Record<string, StoredCredential> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, StoredCredential>;
  } catch {
    // ignore corrupt vault
  }
  return {};
}

export function saveCredentials(vault: Record<string, StoredCredential>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(vault));
}

export function loadSessionUserName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export function saveSession(userName: string | null) {
  if (typeof window === 'undefined') return;
  if (userName) localStorage.setItem(SESSION_KEY, userName.toLowerCase());
  else localStorage.removeItem(SESSION_KEY);
}

export function loadCustomUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_USERS_KEY);
    if (raw) return JSON.parse(raw) as User[];
  } catch {
    // ignore
  }
  return [];
}

export function saveCustomUsers(users: User[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users));
}

export async function seedDefaultCredentials(allUsers: User[]): Promise<Record<string, StoredCredential>> {
  const vault = loadCredentials();
  let mutated = false;
  for (const demo of DEFAULT_DEMO_CREDENTIALS) {
    const key = demo.user_name.toLowerCase();
    const match = allUsers.find((u) => u.user_name.toLowerCase() === key);
    if (!match) continue;
    if (!vault[key]) {
      const salt = randomSalt();
      const passwordHash = await hashPassword(demo.password, salt);
      vault[key] = { userName: key, sysId: match.sys_id, salt, passwordHash };
      mutated = true;
    }
  }
  if (mutated) saveCredentials(vault);
  return vault;
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include a number.';
  return null;
}

export function validateUserName(userName: string): string | null {
  const v = userName.trim();
  if (v.length < 3) return 'User ID must be at least 3 characters.';
  if (!/^[a-z0-9._-]+$/i.test(v)) return 'User ID may only contain letters, numbers, dot, underscore or dash.';
  return null;
}

/** Views that require elevated platform roles (ServiceNow-style ACL). */
export type AdminOnlyView =
  | 'script_background'
  | 'client_scripts'
  | 'business_rules'
  | 'flow_designer'
  | 'tables_dictionary'
  | 'update_sets';

export const ADMIN_ONLY_VIEWS: AdminOnlyView[] = [
  'script_background',
  'client_scripts',
  'business_rules',
  'flow_designer',
  'tables_dictionary',
  'update_sets',
];

export function userHasRole(user: User | null | undefined, role: Role): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

export function userIsAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.roles.includes('admin') || user.roles.includes('security_admin');
}

export function userCanAccessView(
  user: User | null | undefined,
  viewType: string,
  table?: string
): boolean {
  if (!user) return false;
  // End users get a scoped portal: catalog, knowledge, and their own requests.
  // ITIL + admins get full ITSM; admins additionally get dev/system admin tools.
  if (ADMIN_ONLY_VIEWS.includes(viewType as AdminOnlyView)) {
    return userIsAdmin(user);
  }
  if (viewType === 'list' && table === 'sys_user') {
    return userIsAdmin(user) || user.roles.includes('itil');
  }
  if (user.roles.includes('end_user') && !user.roles.includes('itil') && !userIsAdmin(user)) {
    if (viewType === 'catalog' || viewType === 'catalog_item') return true;
    if (viewType === 'list' && (table === 'kb_knowledge' || table === 'sc_req_item')) return true;
    if (viewType === 'form' && (table === 'sc_req_item' || table === 'kb_knowledge')) return true;
    // End users may view their own incidents but not problem/change config lists.
    if (viewType === 'list' && table === 'incident') return true;
    if (viewType === 'form' && table === 'incident') return true;
    return false;
  }
  return true;
}
