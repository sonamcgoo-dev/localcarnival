"use strict";
/**
 * LocalCircus Desktop - Preload Script
 *
 * Secure bridge between main and renderer processes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods to the renderer process
electron_1.contextBridge.exposeInMainWorld('localcircus', {
    // Status
    getStatus: () => electron_1.ipcRenderer.invoke('get-status'),
    // Memory operations
    memory: {
        set: (key, value) => electron_1.ipcRenderer.invoke('memory-set', key, value),
        get: (key) => electron_1.ipcRenderer.invoke('memory-get', key),
        search: (query) => electron_1.ipcRenderer.invoke('memory-search', query)
    },
    // Config
    config: {
        get: () => electron_1.ipcRenderer.invoke('get-config'),
        save: (config) => electron_1.ipcRenderer.invoke('save-config', config)
    },
    // Paths
    getPaths: () => electron_1.ipcRenderer.invoke('get-paths'),
    // Window controls
    window: {
        minimize: () => electron_1.ipcRenderer.invoke('window-minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('window-maximize'),
        close: () => electron_1.ipcRenderer.invoke('window-close')
    },
    // Event listeners
    on: (channel, callback) => {
        const validChannels = ['action', 'status-update', 'notification'];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, (_, data) => callback(data));
        }
    },
    removeListener: (channel, callback) => {
        electron_1.ipcRenderer.removeListener(channel, callback);
    }
});
