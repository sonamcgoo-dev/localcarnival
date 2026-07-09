/**
 * LocalCircus Desktop - Main Process
 * 
 * Electron main process for the LocalCircus desktop application.
 */

import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { getCore } from '@localcircus/core';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Paths
const isDev = !app.isPackaged;
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const circusDataPath = path.join(userDataPath, '.localcircus');

// Create config directory
if (!fs.existsSync(circusDataPath)) {
  fs.mkdirSync(circusDataPath, { recursive: true });
}

// Global exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

function createWindow() {
  console.log('🎪 Creating LocalCircus window...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'LocalCircus',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false,
    frame: true,
    titleBarStyle: 'default'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('🎪 LocalCircus window ready!');
  });

  // Handle close to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
    }
    return true;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  // Create a simple tray icon (16x16 colored square)
  const icon = nativeImage.createEmpty();
  
  tray = new Tray(icon.isEmpty() ? nativeImage.createFromBuffer(Buffer.alloc(256)) : icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open LocalCircus',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: 'Status',
      submenu: [
        { label: 'Memory: 0 entries', enabled: false },
        { label: 'Tasks: 0 active', enabled: false },
        { label: 'Uptime: Running', enabled: false }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quick Actions',
      submenu: [
        { label: '🔍 Browse Zoo', click: () => sendToRenderer('action', 'zoo') },
        { label: '🎨 Create Artifact', click: () => sendToRenderer('action', 'forge') },
        { label: '⚡ Run Workflow', click: () => sendToRenderer('action', 'workflows') }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit LocalCircus',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('🎪 LocalCircus');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function sendToRenderer(channel: string, data: any) {
  mainWindow?.webContents.send(channel, data);
}

function setupIPC() {
  // Get system status
  ipcMain.handle('get-status', async () => {
    try {
      const core = getCore();
      return core.getHealth();
    } catch (error) {
      return { status: 'error', error: String(error) };
    }
  });

  // Memory operations
  ipcMain.handle('memory-set', async (_, key: string, value: any) => {
    try {
      const core = getCore();
      core.remember(key, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('memory-get', async (_, key: string) => {
    try {
      const core = getCore();
      const value = core.recall(key);
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('memory-search', async (_, query: string) => {
    try {
      const core = getCore();
      const entries = core.getMemory().search(query);
      return { success: true, data: entries };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Config operations
  ipcMain.handle('get-config', async () => {
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      return null;
    } catch (error) {
      return null;
    }
  });

  ipcMain.handle('save-config', async (_, config: any) => {
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // App paths
  ipcMain.handle('get-paths', async () => {
    return {
      userData: userDataPath,
      circusData: circusDataPath,
      isDev
    };
  });

  // Window controls
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    mainWindow?.hide();
  });
}

// App lifecycle
app.whenReady().then(async () => {
  console.log('🎪 Starting LocalCircus Desktop...');
  
  // Initialize core
  try {
    const core = getCore();
    await core.start();
    console.log('✓ Ringmaster Core started');
  } catch (error) {
    console.error('Failed to start core:', error);
  }

  setupIPC();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit, keep running in tray
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Export for testing
export { mainWindow, tray };
