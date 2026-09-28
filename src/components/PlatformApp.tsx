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
import PracticeCenterModal from '@/components/learning/PracticeCenterModal';

function PlatformContent() {
  const { activeView, theme, compactDensity } = usePlatform();

  // Navigation tab open state: 'all' | 'favorites' | 'history' | 'workspaces' | null
  const [navOpenTab, setNavOpenTab] = useState<'all' | 'favorites' | 'history' | 'workspaces' | null>('all');
  const [isNavPinned, setIsNavPinned] = useState(true);
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  // Synchronize theme on HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
