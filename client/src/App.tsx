import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryProvider';
import { useTelemetry } from './context/useTelemetry';
import { TopNavbar } from './components/Navigation/TopNavbar';

import { Sidebar, NavView } from './components/Navigation/Sidebar';
import { SignInPage } from './features/auth/SignInPage';
import { FleetOverview } from './components/FleetOverview/FleetOverview';
import { VesselSchematic } from './components/VesselOperations/VesselSchematic';
import { CargoTanksView } from './features/cargo/CargoTanksView';
import { BallastTanksView } from './features/ballast/BallastTanksView';
import { TemperatureView } from './features/temperature/TemperatureView';
import { PressureView } from './features/pressure/PressureView';
import { AlarmCenter } from './components/AlarmCenter/AlarmCenter';
import { CloudGatewayFlow } from './features/cloud/CloudGatewayFlow';
import { CloudSessionsView } from './features/cloud/CloudSessionsView';
import { HistoryExportView } from './features/history/HistoryExportView';
import { UserManagementView } from './features/users/UserManagementView';
import { AuditTrail } from './components/AuditTrail/AuditTrail';
import { PersistentDraftBar } from './components/DraftMonitor/PersistentDraftBar';
import { Ship, RefreshCw } from 'lucide-react';
import './styles/theme.css';
import './styles/components.css';

const MainApplication: React.FC = () => {
  const { isAuthenticated, authLoading, setCurrentVesselId } = useTelemetry();
  // Default to CLOUD_SESSIONS post-authentication to establish cloud connection & telemetry retrieval first
  const [currentView, setCurrentView] = useState<NavView>('CLOUD_SESSIONS');
  const [cloudSubTab, setCloudSubTab] = useState<'VPS_STORAGE' | 'GATEWAY'>('VPS_STORAGE');

  if (authLoading) {
    return (
      <div className="login-screen-wrapper">
        <div className="login-card-container text-center p-8">
          <div className="login-logo-badge mx-auto mb-4">
            <Ship size={32} className="text-cyan animate-pulse" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Connecting to SCADA Security Gateway...</h2>
          <p className="text-muted text-xs flex-center gap-2">
            <RefreshCw size={14} className="spin text-cyan" />
            <span>Validating enterprise session token</span>
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInPage />;
  }

  const handleSelectVessel = (vesselId: string) => {
    setCurrentVesselId(vesselId);
    setCurrentView('VESSEL_OPERATIONS');
  };

  return (
    <div className="app-layout">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navbar with Vessel selector, clock, cloud status, profile */}
        <TopNavbar
          onNavigateToHistory={() => setCurrentView('HISTORY_EXPORT')}
          onNavigateToCloud={() => setCurrentView('CLOUD_SESSIONS')}
          onNavigateToUsers={() => setCurrentView('USERS')}
          onNavigateToAudit={() => setCurrentView('AUDIT')}
          onNavigateToAlarms={() => setCurrentView('ALARMS')}
        />

        {/* Persistent Vessel Draft Visualization: docked at the TOP below navbar */}
        <PersistentDraftBar />

        {/* Dynamic View Router */}
        <div className="content-scroll-area">
          {currentView === 'FLEET' && (
            <FleetOverview onSelectVessel={handleSelectVessel} />
          )}

          {currentView === 'VESSEL_OPERATIONS' && (
            <VesselSchematic onOpenTelemetryWorkspace={() => setCurrentView('CARGO_TANKS')} />
          )}

          {currentView === 'CARGO_TANKS' && <CargoTanksView />}

          {currentView === 'BALLAST_TANKS' && <BallastTanksView />}

          {currentView === 'TEMPERATURE' && <TemperatureView />}

          {currentView === 'PRESSURE' && <PressureView />}

          {currentView === 'ALARMS' && <AlarmCenter />}

          {currentView === 'CLOUD_SESSIONS' && (
            <div>
              <div className="flex gap-2 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <button
                  id="tab-vps-storage"
                  className={`btn btn-sm ${cloudSubTab === 'VPS_STORAGE' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCloudSubTab('VPS_STORAGE')}
                >
                  VPS Storage & Date Repository
                </button>
                <button
                  id="tab-cloud-gateway"
                  className={`btn btn-sm ${cloudSubTab === 'GATEWAY' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCloudSubTab('GATEWAY')}
                >
                  Onboarding Lifecycle Gateway
                </button>
              </div>
              {cloudSubTab === 'VPS_STORAGE' ? (
                <CloudSessionsView />
              ) : (
                <CloudGatewayFlow onEnterBridge={() => setCurrentView('VESSEL_OPERATIONS')} />
              )}
            </div>
          )}


          {currentView === 'HISTORY_EXPORT' && <HistoryExportView />}

          {currentView === 'USERS' && <UserManagementView />}

          {currentView === 'AUDIT' && <AuditTrail />}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <TelemetryProvider>
      <MainApplication />
    </TelemetryProvider>
  );
}
