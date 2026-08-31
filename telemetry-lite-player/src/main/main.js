const { app, BrowserWindow, ipcMain, dialog, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { parseFile } = require('music-metadata');
const Store = require('electron-store');

const store = new Store({
  name: 'library',
  defaults: {
    playlists: [],
    automations: [],
    lastFolder: null
  }
});

const isDev = !app.isPackaged;
const SUPPORTED_EXT = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 820,
    minHeight: 560,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

// ---- IPC: pick a folder and return playable tracks with metadata ----
ipcMain.handle('library:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const folder = result.filePaths[0];
  store.set('lastFolder', folder);
  return scanFolder(folder);
});

ipcMain.handle('library:rescanLast', async () => {
  const folder = store.get('lastFolder');
  if (!folder || !fs.existsSync(folder)) return null;
  return scanFolder(folder);
});

async function scanFolder(folder) {
  const files = fs
    .readdirSync(folder)
    .filter((f) => SUPPORTED_EXT.includes(path.extname(f).toLowerCase()));

  const tracks = [];
  for (const file of files) {
    const fullPath = path.join(folder, file);
    let meta = {};
    try {
      const parsed = await parseFile(fullPath, { duration: true });
      meta = {
        title: parsed.common.title || path.basename(file, path.extname(file)),
        artist: parsed.common.artist || 'Unknown Artist',
        album: parsed.common.album || '',
        duration: parsed.format.duration || 0
      };
    } catch (err) {
      meta = {
        title: path.basename(file, path.extname(file)),
        artist: 'Unknown Artist',
        album: '',
        duration: 0
      };
    }
    tracks.push({ id: fullPath, path: fullPath, ...meta });
  }
  return { folder, tracks };
}

// ---- IPC: playlists persistence ----
ipcMain.handle('playlists:getAll', () => store.get('playlists'));
ipcMain.handle('playlists:save', (_e, playlists) => {
  store.set('playlists', playlists);
  return true;
});

// ---- IPC: automations persistence ----
ipcMain.handle('automations:getAll', () => store.get('automations'));
ipcMain.handle('automations:save', (_e, automations) => {
  store.set('automations', automations);
  return true;
});

// ---- System power events -> forward to renderer for automation rules ----
app.whenReady().then(() => {
  createWindow();

  powerMonitor.on('suspend', () => {
    mainWindow?.webContents.send('system:event', 'suspend');
  });
  powerMonitor.on('resume', () => {
    mainWindow?.webContents.send('system:event', 'resume');
  });
  powerMonitor.on('lock-screen', () => {
    mainWindow?.webContents.send('system:event', 'lock-screen');
  });
  powerMonitor.on('unlock-screen', () => {
    mainWindow?.webContents.send('system:event', 'unlock-screen');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
