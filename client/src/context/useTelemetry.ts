import { useContext } from 'react';
import { TelemetryContext } from './TelemetryContext';

export const useTelemetry = () => {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used within TelemetryProvider');
  return ctx;
};
