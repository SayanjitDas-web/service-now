'use client';

import React, { useState } from 'react';
import {
  Search,
  Star,
  History,
  Grid,
  ChevronDown,
  UserCheck,
  Settings,
  GraduationCap,
  Globe,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { usePlatform } from '@/lib/store';
import ImpersonateModal from './ImpersonateModal';
import InstanceSettingsModal from './InstanceSettingsModal';
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
  } = usePlatform();

  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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

        {/* Right: Scope, Update Set, Impersonation, Practice, Settings */}
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

          {/* Update Set Picker */}
          <div
            className="sn-picker-pill"
            title="Active Update Set"
            onClick={() => setActiveView({ type: 'update_sets' })}
          >
            <Layers size={13} color="#cbd5e1" />
            <span>{currentUpdateSet?.name || 'Default [Global]'}</span>
          </div>

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

          {/* Impersonate User Button */}
          <button
            className="sn-header-icon-btn"
            onClick={() => setShowImpersonateModal(true)}
            title="Impersonate User"
          >
            <UserCheck size={18} />
          </button>

          {/* Instance Settings / Supabase / ImageKit Config */}
          <button
            className="sn-header-icon-btn"
            onClick={() => setShowSettingsModal(true)}
            title="Instance Settings (Supabase, ImageKit, Themes)"
          >
            <Settings size={18} />
          </button>

          {/* Current User Badge */}
          <div
            className="sn-user-profile-btn"
            onClick={() => setShowSettingsModal(true)}
            title={`Logged in as ${currentUser.name} (${currentUser.user_name})`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="sn-user-avatar"
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
                {currentUser.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: '9.5px', color: '#81b5a1' }}>
                {currentUser.roles[0]?.toUpperCase() || 'USER'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      {showImpersonateModal && (
        <ImpersonateModal onClose={() => setShowImpersonateModal(false)} />
      )}
      {showSettingsModal && (
        <InstanceSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
      {showSearchModal && (
        <GlobalSearchModal onClose={() => setShowSearchModal(false)} />
      )}
    </>
  );
}
