/**
 * AUTHENTICATION — Supabase Auth wrapper (credentials + sessions).
 *
 * Credentials live ONLY in Supabase Auth (auth.users). The sys_user profile
 * never stores passwords. Login accepts a ServiceNow `user_name`; we resolve
 * it to the Auth email via the sys_user directory, then call
 * supabase.auth.signInWithPassword. Sessions/logout flow through Supabase.
 */
'use client';

import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabase } from '../supabaseClient';
import type { SysUser } from './types';

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

export function requireSupabase() {
  const sb = getSupabase();
  if (!sb) throw new SupabaseNotConfiguredError();
  return sb;
}

export interface AuthSession {
  supabaseUser: SupabaseUser;
  session: Session;
}

/** Find the login email for a ServiceNow user_name (case-insensitive). */
export async function resolveEmailForUserName(userName: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const key = userName.trim();
  if (!key) return null;
  // Prefer an exact user_name match, fall back to treating input as email.
  const { data } = await sb
    .from('sys_user')
    .select('email,user_name')
    .ilike('user_name', key)
    .limit(1)
    .maybeSingle();
  if (data?.email) return data.email as string;
  if (key.includes('@')) {
    const byEmail = await sb
      .from('sys_user')
      .select('email')
      .ilike('email', key)
      .limit(1)
      .maybeSingle();
    if (byEmail.data?.email) return byEmail.data.email as string;
    return key;
  }
  return null;
}

/** Fetch a sys_user profile by user_name (used for active/locked pre-checks). */
export async function fetchSysUserByUserName(userName: string): Promise<SysUser | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('sys_user')
    .select('*')
    .ilike('user_name', userName.trim())
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as SysUser;
}

export type SignInResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string; locked?: boolean; inactive?: boolean };

const MAX_FAILED_LOGINS = 5;

/**
 * ServiceNow login: user_name + password -> Supabase session.
 * Enforces active + locked_out before attempting Auth, links auth_user_id
 * on first success, and tracks failed attempts (locks at MAX_FAILED_LOGINS).
 */
export async function signInWithUserName(
  userName: string,
  password: string
): Promise<SignInResult> {
  const sb = requireSupabase();
  const cleanName = userName.trim();
  if (!cleanName || !password) {
    return { ok: false, error: 'Enter your User ID and password.' };
  }

  // 1. Resolve profile for account-state checks + email mapping.
  const profile = await fetchSysUserByUserName(cleanName);
  if (!profile) {
    // Still allow raw-email login (bootstrap / invited Auth users).
    if (cleanName.includes('@')) {
      const { data, error } = await sb.auth.signInWithPassword({
        email: cleanName,
        password,
      });
      if (error || !data.session || !data.user) {
        return { ok: false, error: 'Invalid User ID or password.' };
      }
      return { ok: true, session: { supabaseUser: data.user, session: data.session } };
    }
    return { ok: false, error: 'Invalid User ID or password.' };
  }

  if (!profile.active) {
    return { ok: false, error: 'This account is deactivated. Contact your administrator.', inactive: true };
  }
  if (profile.locked_out) {
    return { ok: false, error: 'This account is locked. Contact your administrator to unlock it.', locked: true };
  }

  // 2. Authenticate against Supabase Auth (sole credential holder).
  const { data, error } = await sb.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (error || !data.session || !data.user) {
    // 3. Track failed attempts; lock the sys_user record at threshold.
    const nextCount = (profile.failed_login_count ?? 0) + 1;
    const shouldLock = nextCount >= MAX_FAILED_LOGINS;
    await sb
      .from('sys_user')
      .update({
        failed_login_count: nextCount,
        ...(shouldLock ? { locked_out: true } : {}),
      })
      .eq('id', profile.id);
    if (shouldLock) {
      return {
        ok: false,
        locked: true,
        error: `Too many failed attempts. Account ${profile.user_name} is now locked.`,
      };
    }
    return { ok: false, error: 'Invalid User ID or password.' };
  }

  // 4. Success: link Auth account + reset counters + stamp login.
  await sb
    .from('sys_user')
    .update({
      auth_user_id: data.user.id,
      failed_login_count: 0,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  return { ok: true, session: { supabaseUser: data.user, session: data.session } };
}

export interface SignUpInput {
  user_name: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  department?: string;
}

export type SignUpResult =
  | { ok: true; needsEmailConfirmation: boolean; authUserId: string | null }
  | { ok: false; error: string };

/**
 * Self-registration: creates the Supabase Auth account. The caller then
 * creates the sys_user profile (identity.createSysUserProfile) linked via
 * auth_user_id and grants the end_user role. If the project requires email
 * confirmation, no session is returned — the user must confirm first.
 */
export async function signUpAuthAccount(input: SignUpInput): Promise<SignUpResult> {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        user_name: input.user_name.trim(),
        first_name: input.first_name,
        last_name: input.last_name,
      },
    },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return { ok: false, error: 'That email is already registered. Try signing in instead.' };
    }
    return { ok: false, error: error.message };
  }
  const needsEmailConfirmation = !data.session;
  return {
    ok: true,
    needsEmailConfirmation,
    authUserId: data.user?.id ?? null,
  };
}

export async function signOutEverywhere(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getSupabaseSession(): Promise<AuthSession | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (!data.session || !data.session.user) return null;
  return { supabaseUser: data.session.user, session: data.session };
}

export function onSupabaseAuthStateChange(
  callback: (session: AuthSession | null) => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => undefined;
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) callback({ supabaseUser: session.user, session });
    else callback(null);
  });
  return () => data.subscription.unsubscribe();
}
