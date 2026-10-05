'use client';

import React, { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import { usePlatform } from '@/lib/store';
import { DEFAULT_DEMO_CREDENTIALS } from '@/lib/authUtils';

export default function LoginView() {
  const { login, register, authError, clearAuthError, isAuthLoading } = usePlatform();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [userName, setUserName] = useState('admin');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(userName, password);
      } else {
        await register({ user_name: userName, name: fullName, email, password });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    clearAuthError();
    setMode('login');
    setUserName(u);
    setPassword(p);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1b2e3c 0%, #204e46 55%, #0f172a 100%)',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', gap: '24px', maxWidth: '920px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Brand panel */}
        <div
          style={{
            flex: '1 1 340px',
            maxWidth: '440px',
            color: '#fff',
            padding: '32px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ background: '#00a389', color: '#fff', fontWeight: 800, padding: '4px 10px', borderRadius: '4px' }}>
              NOW
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>ServiceNow Platform</span>
          </div>
          <h1 style={{ fontSize: '26px', lineHeight: 1.25, marginBottom: '10px' }}>
            Sign in to your
            <br />
            instance simulator
          </h1>
          <p style={{ fontSize: '13.5px', color: '#cbd5e1', marginBottom: '18px' }}>
            ServiceNow-style identity: sign in with your sys_user User ID. Credentials are held
            by Supabase Auth, the profile lives in sys_user, and access flows
            user → group → role → ACL.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#e2e8f0' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldCheck size={15} color="#7fd3c2" />
              <span>Passwords never touch sys_user — Supabase Auth only</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Lock size={15} color="#7fd3c2" />
              <span>Supabase sessions; deactivated or locked accounts cannot sign in</span>
            </div>
          </div>

          <div style={{ marginTop: '22px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#7fd3c2', marginBottom: '8px' }}>
              ADMINISTRATOR ACCOUNT
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DEFAULT_DEMO_CREDENTIALS.map((d) => (
                <button
                  key={d.user_name}
                  onClick={() => fillDemo(d.user_name, d.password)}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    background: 'rgba(255,255,255,0.08)',
                    fontWeight: 600,
                  }}
                  title={`User ID: ${d.user_name} / Password: ${d.password}`}
                >
                  {d.user_name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div
          style={{
            flex: '1 1 340px',
            maxWidth: '420px',
            background: 'var(--now-bg-surface, #fff)',
            borderRadius: '10px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '22px 24px 0' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    clearAuthError();
                    setMode(m);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    background: mode === m ? '#e6f7f4' : '#f1f5f9',
                    color: mode === m ? '#0f766e' : '#64748b',
                    border: mode === m ? '1px solid #00a389' : '1px solid #e2e8f0',
                  }}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              {mode === 'login' ? 'Welcome back' : 'Join the service portal'}
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', marginBottom: '14px' }}>
              {mode === 'login'
                ? 'Use your instance User ID and password.'
                : 'Self-registration creates an end-user portal account.'}
            </p>

            {authError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                }}
              >
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mode === 'register' && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Full name</label>
                    <input
                      className="sn-field-input"
                      placeholder="e.g. Ava Martinez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Email</label>
                    <input
                      className="sn-field-input"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </>
              )}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>User ID</label>
                <input
                  className="sn-field-input"
                  placeholder="admin"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="sn-field-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'login' ? '••••••••' : 'Min 8 chars, upper + lower + number'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    style={{ paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '8px', top: '8px', color: '#94a3b8' }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || isAuthLoading}
                className="sn-btn sn-btn-primary"
                style={{ marginTop: '6px', justifyContent: 'center', width: '100%' }}
              >
                {mode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
                <span>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create portal account'}</span>
              </button>
            </form>

            <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                DEFAULT ADMINISTRATOR ACCOUNT
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.7, fontFamily: 'var(--font-mono, monospace)' }}>
                {DEFAULT_DEMO_CREDENTIALS.map((d) => (
                  <div key={d.user_name}>
                    {d.user_name} / {d.password}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 24px 18px', fontSize: '11px', color: '#94a3b8' }}>
            Protected by instance ACLs: admin tools, user tables, and impersonation require elevated roles.
          </div>
        </div>
      </div>
    </div>
  );
}
