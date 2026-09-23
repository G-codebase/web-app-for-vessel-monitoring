import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { TopNavbar } from './components/Navigation/TopNavbar';
import { Sidebar, NavView } from './components/Navigation/Sidebar';
import { FleetOverview } from './components/FleetOverview/FleetOverview';
import { VesselSchematic } from './components/VesselOperations/VesselSchematic';
import { TelemetryWorkspace } from './components/TelemetryWorkspace/TelemetryWorkspace';
import { AlarmCenter } from './components/AlarmCenter/AlarmCenter';
import { DraftMonitor } from './components/DraftMonitor/DraftMonitor';
import { ManifoldMonitor } from './components/ManifoldMonitor/ManifoldMonitor';
import { OperationalAnalytics } from './components/Analytics/OperationalAnalytics';
import { AuditTrail } from './components/AuditTrail/AuditTrail';
import { ReportsCenter } from './components/Reports/ReportsCenter';
import './styles/theme.css';
import './styles/components.css';

const MainApplication: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('VESSEL_OPERATIONS');
  const [selectedWorkspaceTankId, setSelectedWorkspaceTankId] = useState<string>('C05');

  const handleSelectVessel = (vesselId: string) => {
    setCurrentView('VESSEL_OPERATIONS');
  };

  const handleOpenTelemetryWorkspace = (tankId: string) => {
    setSelectedWorkspaceTankId(tankId);
    setCurrentView('TELEMETRY');
  };

  return (
    <div className="app-layout">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navbar with Vessel selector, clock, role switcher, simulation */}
        <TopNavbar />

        {/* Dynamic View Router */}
        {currentView === 'FLEET' && (
          <FleetOverview onSelectVessel={handleSelectVessel} />
        )}

        {currentView === 'VESSEL_OPERATIONS' && (
          <VesselSchematic
            onOpenTelemetryWorkspace={handleOpenTelemetryWorkspace}
          />
        )}

        {currentView === 'TELEMETRY' && (
          <TelemetryWorkspace initialTankId={selectedWorkspaceTankId} />
        )}

        {currentView === 'ALARMS' && <AlarmCenter />}

        {currentView === 'DRAFT' && <DraftMonitor />}

        {currentView === 'MANIFOLD' && <ManifoldMonitor />}

        {currentView === 'ANALYTICS' && <OperationalAnalytics />}

        {currentView === 'AUDIT' && <AuditTrail />}

        {currentView === 'REPORTS' && <ReportsCenter />}
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
