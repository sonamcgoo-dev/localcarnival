"use strict";
/**
 * LocalCircus Desktop - Main Process
 *
 * Electron main process for the LocalCircus desktop application.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tray = exports.mainWindow = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const core_1 = require("@localcircus/core");
// Keep a global reference of the window object
let mainWindow = null;
exports.mainWindow = mainWindow;
let tray = null;
exports.tray = tray;
let isQuitting = false;
// Paths
const isDev = !electron_1.app.isPackaged;
const userDataPath = electron_1.app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const circusDataPath = path.join(userDataPath, '.localcircus');
// Create config directory
if (!fs.existsSync(circusDataPath)) {
    fs.mkdirSync(circusDataPath, { recursive: true });
}
// Global exception handler
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    electron_1.dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
function createWindow() {
    console.log('🎪 Creating LocalCircus window...');
    exports.mainWindow = mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
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
        exports.mainWindow = mainWindow = null;
    });
    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
}
function createTray() {
    // Create a simple tray icon (16x16 colored square)
    const icon = electron_1.nativeImage.createEmpty();
    exports.tray = tray = new electron_1.Tray(icon.isEmpty() ? electron_1.nativeImage.createFromBuffer(Buffer.alloc(256)) : icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
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
                electron_1.app.quit();
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
function sendToRenderer(channel, data) {
    mainWindow?.webContents.send(channel, data);
}
function setupIPC() {
    // Get system status
    electron_1.ipcMain.handle('get-status', async () => {
        try {
            const core = (0, core_1.getCore)();
            return core.getHealth();
        }
        catch (error) {
            return { status: 'error', error: String(error) };
        }
    });
    // Memory operations
    electron_1.ipcMain.handle('memory-set', async (_, key, value) => {
        try {
            const core = (0, core_1.getCore)();
            core.memory.remember(key, value);
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    });
    electron_1.ipcMain.handle('memory-get', async (_, key) => {
        try {
            const core = (0, core_1.getCore)();
            const entry = core.memory.recall(key);
            return { success: true, data: entry?.value };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    });
    electron_1.ipcMain.handle('memory-search', async (_, query) => {
        try {
            const core = (0, core_1.getCore)();
            const entries = core.memory.search(query);
            return { success: true, data: entries };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    });
    // Config operations
    electron_1.ipcMain.handle('get-config', async () => {
        try {
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
            return null;
        }
        catch (error) {
            return null;
        }
    });
    electron_1.ipcMain.handle('save-config', async (_, config) => {
        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    });
    // App paths
    electron_1.ipcMain.handle('get-paths', async () => {
        return {
            userData: userDataPath,
            circusData: circusDataPath,
            isDev
        };
    });
    // Window controls
    electron_1.ipcMain.handle('window-minimize', () => {
        mainWindow?.minimize();
    });
    electron_1.ipcMain.handle('window-maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.handle('window-close', () => {
        mainWindow?.hide();
    });
}
// App lifecycle
electron_1.app.whenReady().then(async () => {
    console.log('🎪 Starting LocalCircus Desktop...');
    // Initialize core
    try {
        const core = (0, core_1.getCore)();
        await core.start();
        console.log('✓ Ringmaster Core started');
    }
    catch (error) {
        console.error('Failed to start core:', error);
    }
    setupIPC();
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
        else {
            mainWindow?.show();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Don't quit, keep running in tray
    }
});
electron_1.app.on('before-quit', () => {
    isQuitting = true;
});
