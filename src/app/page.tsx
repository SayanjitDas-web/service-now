'use client';

import dynamic from 'next/dynamic';

const PlatformApp = dynamic(() => import('@/components/PlatformApp'), {
  ssr: false,
  loading: () => (
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
      <div style={{ fontSize: '13px', color: '#81b5a1' }}>
        Loading Washington DC • Polaris Workspace...
      </div>
    </div>
  ),
});

export default function Page() {
  return <PlatformApp />;
}
