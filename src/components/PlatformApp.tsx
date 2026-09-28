'use client';

import React, { useState, useEffect } from 'react';
import { PlatformProvider, usePlatform } from '@/lib/store';
import PolarisHeader from '@/components/polaris/PolarisHeader';
import PolarisNavMenu from '@/components/polaris/PolarisNavMenu';
import ListView from '@/components/list/ListView';
import FormView from '@/components/form/FormView';
import ServiceCatalogView from '@/components/catalog/ServiceCatalogView';
import ScriptBackground from '@/components/dev-tools/ScriptBackground';
import ClientScriptsManager from '@/components/dev-tools/ClientScriptsManager';
import BusinessRulesManager from '@/components/dev-tools/BusinessRulesManager';
import FlowDesigner from '@/components/dev-tools/FlowDesigner';
import TablesDictionary from '@/components/dev-tools/TablesDictionary';
import UpdateSetsManager from '@/components/dev-tools/UpdateSetsManager';
import UserAdministration from '@/components/admin/UserAdministration';
import PracticeCenterModal from '@/components/learning/PracticeCenterModal';
import LoginView from '@/components/auth/LoginView';
import { ShieldAlert } from 'lucide-react';

function AccessDenied({ title, detail }: { title: string; detail: string }) {
  const { setActiveView } = usePlatform();
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
      <ShieldAlert size={36} style={{ margin: '0 auto 12px', color: '#dc2626' }} />
      <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--now-text-main)' }}>{title}</h2>
      <p style={{ fontSize: '13px', color: 'var(--now-text-secondary)', margin: '8px 0 16px' }}>{detail}</p>
      <button className="sn-btn sn-btn-primary" onClick={() => setActiveView({ type: 'catalog' })}>
        Go to Service Portal
      </button>
    </div>
  );
}

function PlatformContent() {
  const {
    activeView,
    theme,
    compactDensity,
    isAuthenticated,
    isAuthLoading,
    canAccess,
    currentUser,
  } = usePlatform();

  // Navigation tab open state: 'all' | 'favorites' | 'history' | 'workspaces' | null
  const [navOpenTab, setNavOpenTab] = useState<'all' | 'favorites' | 'history' | 'workspaces' | null>('all');
  const [isNavPinned, setIsNavPinned] = useState(true);
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  // Synchronize theme on HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Role-aware defaults are enforced by `canAccess` + AccessDenied below;
  // no forced redirects so user navigation is never fought.

  // Global hotkeys (Ctrl+K for search, Esc to close menus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.sn-search-bar') as HTMLElement;
        searchInput?.click();
      }
      if (e.key === 'Escape') {
        if (!isNavPinned) {
          setNavOpenTab(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNavPinned]);

  if (isAuthLoading) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1b2e3c',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              background: '#00a389',
              color: 'white',
              fontWeight: 800,
              fontSize: '16px',
              padding: '4px 10px',
              borderRadius: '4px',
            }}
          >
            NOW
          </div>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>ServiceNow Platform</span>
        </div>
        <div style={{ fontSize: '13px', color: '#81b5a1' }}>Restoring secure session…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const viewAllowed = (() => {
    if (activeView.type === 'list') return canAccess('list', activeView.table);
    if (activeView.type === 'form') return canAccess('form', activeView.table);
    return canAccess(activeView.type);
  })();

  return (
    <div
      className={`sn-root-container ${compactDensity ? 'compact' : ''}`}
      data-theme={theme}
    >
      {/* Polaris Unified Navigation Header */}
      <PolarisHeader
        navOpenTab={navOpenTab}
        setNavOpenTab={setNavOpenTab}
        onOpenPractice={() => setShowPracticeModal(true)}
      />

      {/* Main Content Area */}
      <div className="sn-content-body">
        {/* Navigation Sidebar / Drawer */}
        {navOpenTab && (
          <div style={{ width: isNavPinned ? 'var(--sn-nav-width)' : '0px', flexShrink: 0, position: 'relative' }}>
            <PolarisNavMenu
              navOpenTab={navOpenTab}
              onClose={() => setNavOpenTab(null)}
              isPinned={isNavPinned}
              onTogglePin={() => setIsNavPinned(!isNavPinned)}
            />
          </div>
        )}

        {/* Main Viewport */}
        <main className="sn-main-viewport">
          {!viewAllowed ? (
            <AccessDenied
              title="Access denied — insufficient role"
              detail={`Your account (${currentUser.user_name}) does not have the role required for this module. Administrators can impersonate other personas to test access.`}
            />
          ) : (
            <>
              {activeView.type === 'list' && <ListView tableName={activeView.table} />}
              {activeView.type === 'form' && (
                <FormView tableName={activeView.table} sysId={activeView.sys_id} />
              )}
              {activeView.type === 'catalog' && <ServiceCatalogView />}
              {activeView.type === 'script_background' && <ScriptBackground />}
              {activeView.type === 'client_scripts' && <ClientScriptsManager />}
              {activeView.type === 'business_rules' && <BusinessRulesManager />}
              {activeView.type === 'flow_designer' && <FlowDesigner />}
              {activeView.type === 'tables_dictionary' && <TablesDictionary />}
              {activeView.type === 'update_sets' && <UpdateSetsManager />}
              {activeView.type === 'user_administration' && <UserAdministration />}
            </>
          )}
        </main>
      </div>

      {/* Interactive Certification Practice Labs Modal */}
      {showPracticeModal && (
        <PracticeCenterModal onClose={() => setShowPracticeModal(false)} />
      )}
    </div>
  );
}

export default function PlatformApp() {
  return (
    <PlatformProvider>
      <PlatformContent />
    </PlatformProvider>
  );
}
