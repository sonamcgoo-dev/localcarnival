/**
 * LocalCircus Desktop - Preload Script
 * 
 * Secure bridge between main and renderer processes.
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('localcircus', {
  // Status
  getStatus: () => ipcRenderer.invoke('get-status'),
  
  // Memory operations
  memory: {
    set: (key: string, value: any) => ipcRenderer.invoke('memory-set', key, value),
    get: (key: string) => ipcRenderer.invoke('memory-get', key),
    search: (query: string) => ipcRenderer.invoke('memory-search', query)
  },
  
  // Config
  config: {
    get: () => ipcRenderer.invoke('get-config'),
    save: (config: any) => ipcRenderer.invoke('save-config', config)
  },
  
  // Paths
  getPaths: () => ipcRenderer.invoke('get-paths'),
  
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close')
  },
  
  // Event listeners
  on: (channel: string, callback: (data: any) => void) => {
    const validChannels = ['action', 'status-update', 'notification'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, data) => callback(data));
    }
  },
  
  removeListener: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.removeListener(channel, callback);
  }
});

// Type declaration for TypeScript
declare global {
  interface Window {
    localcircus: {
      getStatus: () => Promise<any>;
      memory: {
        set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
        get: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
        search: (query: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      };
      config: {
        get: () => Promise<any>;
        save: (config: any) => Promise<{ success: boolean; error?: string }>;
      };
      getPaths: () => Promise<{ userData: string; circusData: string; isDev: boolean }>;
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      on: (channel: string, callback: (data: any) => void) => void;
      removeListener: (channel: string, callback: (data: any) => void) => void;
    };
  }
}
