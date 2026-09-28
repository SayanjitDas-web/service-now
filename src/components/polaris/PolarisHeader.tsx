'use client';

import React, { useState } from 'react';
import {
  Search,
  Star,
  History,
  Grid,
  ChevronDown,
  UserCheck,
  GraduationCap,
  Globe,
  Layers,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import ImpersonateModal from './ImpersonateModal';
import AccountMenu from './AccountMenu';
import GlobalSearchModal from './GlobalSearchModal';

interface PolarisHeaderProps {
  navOpenTab: 'all' | 'favorites' | 'history' | 'workspaces' | null;
  setNavOpenTab: (tab: 'all' | 'favorites' | 'history' | 'workspaces' | null) => void;
  onOpenPractice: () => void;
}

export default function PolarisHeader({
  navOpenTab,
  setNavOpenTab,
  onOpenPractice,
}: PolarisHeaderProps) {
  const {
    currentUser,
    actualUser,
    endImpersonation,
    currentScope,
    currentUpdateSet,
    setActiveView,
    isAdmin,
    canAccess,
  } = usePlatform();

  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);

  const isImpersonating = currentUser.sys_id !== actualUser.sys_id;

  const handleTabToggle = (tab: 'all' | 'favorites' | 'history' | 'workspaces') => {
    if (navOpenTab === tab) {
      setNavOpenTab(null);
    } else {
      setNavOpenTab(tab);
    }
  };

  return (
    <>
      {/* Impersonation Alert Banner */}
      {isImpersonating && (
        <div className="sn-impersonation-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} />
            <span>
              You are currently impersonating <strong>{currentUser.name}</strong> ({currentUser.user_name})
            </span>
          </div>
          <button
            className="sn-impersonation-end-btn"
            onClick={endImpersonation}
            title="Return to System Administrator"
          >
            End Impersonation
          </button>
        </div>
      )}

      {/* Main Unified Header */}
      <header className="sn-polaris-header">
        {/* Left: ServiceNow Logo & Nav Dropdowns */}
        <div className="sn-header-left">
          <div
            className="sn-logo-container"
            onClick={() => setActiveView({ type: 'list', table: 'incident' })}
            title="ServiceNow Platform Simulator - Home"
          >
            <div className="sn-logo-badge">NOW</div>
            <div className="sn-instance-label">
              <span>ServiceNow</span>
              <span className="sn-instance-sub">Washington DC • Polaris</span>
            </div>
          </div>

          <button
            className={`sn-nav-btn ${navOpenTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabToggle('all')}
            title="All Applications and Modules"
          >
            <span>All</span>
            <ChevronDown size={14} />
          </button>

          <button
            className={`sn-nav-btn ${navOpenTab === 'favorites' ? 'active' : ''}`}
            onClick={() => handleTabToggle('favorites')}
            title="Starred Favorites"
          >
            <Star size={14} />
            <span>Favorites</span>
            <ChevronDown size={14} />
          </button>

          <button
            className={`sn-nav-btn ${navOpenTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabToggle('history')}
            title="Recent Records and Lists"
          >
            <History size={14} />
            <span>History</span>
            <ChevronDown size={14} />
          </button>

          <button
            className={`sn-nav-btn ${navOpenTab === 'workspaces' ? 'active' : ''}`}
            onClick={() => handleTabToggle('workspaces')}
            title="Agent & Operations Workspaces"
          >
            <Grid size={14} />
            <span>Workspaces</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Center: Global Search Bar */}
        <div className="sn-header-center">
          <div
            className="sn-search-bar"
            onClick={() => setShowSearchModal(true)}
            role="button"
            tabIndex={0}
          >
            <Search size={15} color="#cbd5e1" />
            <input
              type="text"
              className="sn-search-input"
              placeholder="Search incidents, catalog, knowledge, users... (Ctrl + K)"
              readOnly
            />
          </div>
        </div>

        {/* Right: Scope, Update Set, Impersonation, Practice, Account */}
        <div className="sn-header-right">
          {/* Scope Picker */}
          <div
            className="sn-picker-pill"
            title="Current Application Scope"
            onClick={() => setShowScopeDropdown(!showScopeDropdown)}
          >
            <Globe size={13} color="#81b5a1" />
            <span>Scope: {currentScope}</span>
          </div>

          {/* Update Set Picker (admin-only) */}
          {canAccess('update_sets') && (
            <div
              className="sn-picker-pill"
              title="Active Update Set"
              onClick={() => setActiveView({ type: 'update_sets' })}
            >
              <Layers size={13} color="#cbd5e1" />
              <span>{currentUpdateSet?.name || 'Default [Global]'}</span>
            </div>
          )}

          {/* Interactive CSA & CAD Practice Lab Button */}
          <button
            className="sn-picker-pill"
            style={{
              background: 'linear-gradient(135deg, #00a389, #0284c7)',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              boxShadow: '0 2px 6px rgba(0, 163, 137, 0.35)',
            }}
            onClick={onOpenPractice}
            title="Open Interactive ServiceNow Certification & Practice Labs"
          >
            <GraduationCap size={15} />
            <span>Practice Labs</span>
          </button>

          {/* Impersonate User Button (admin-only, ServiceNow-style) */}
          {isAdmin && (
            <button
              className="sn-header-icon-btn"
              onClick={() => setShowImpersonateModal(true)}
              title="Impersonate User (administrators only)"
            >
              <UserCheck size={18} />
            </button>
          )}

          {/* Account: profile, theme, reset (admin), sign out */}
          <AccountMenu />
        </div>
      </header>

      {/* Modals */}
      {showImpersonateModal && isAdmin && (
        <ImpersonateModal onClose={() => setShowImpersonateModal(false)} />
      )}
      {showSearchModal && (
        <GlobalSearchModal onClose={() => setShowSearchModal(false)} />
      )}
    </>
  );
}
