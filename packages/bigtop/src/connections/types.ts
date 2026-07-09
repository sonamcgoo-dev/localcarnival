/**
 * Connection Types
 * 
 * Types for node connections.
 */

import { Position } from '../canvas/types';

export interface ConnectionEndpoint {
  nodeId: string;
  portId: string;
}

export interface Connection {
  id: string;
  source: ConnectionEndpoint;
  target: ConnectionEndpoint;
  data?: any;
}

export interface ConnectionPath {
  start: Position;
  end: Position;
  controlPoints?: Position[];
}

export interface ConnectionStyle {
  color?: string;
  width?: number;
  dashed?: boolean;
  animated?: boolean;
}

export interface ConnectionConfig {
  id?: string;
  source: ConnectionEndpoint;
  target: ConnectionEndpoint;
  style?: ConnectionStyle;
  data?: any;
}
