import { createContext } from 'react';
import { TelemetryContextType } from './types';

export const TelemetryContext = createContext<TelemetryContextType | null>(null);

export * from './types';
export * from './TelemetryProvider';
export * from './useTelemetry';
export * from '../types/user';
