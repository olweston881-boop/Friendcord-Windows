// Friendcord desktop app: a window that opens your Friendcord site.
const { app, BrowserWindow, shell, session } = require('electron');

// If your site address ever changes, change it here and rebuild.
const SITE_URL = 'https://gama-p0e9.onrender.com';
const ORIGIN = new URL(SITE_URL).origin;

const OFFLINE_PAGE = 'data:text/html;charset=utf-8,' + encodeURIComponent(
  '<body style="background:#313338;color:#dbdee1;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">' +
  '<div style="text-align:center"><h2>Connecting to Friendcord...</h2>' +
  '<p>The server may be waking up. Trying again automatically.</p></div></body>');

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#313338',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadURL(SITE_URL);

  // Links to other websites open in the normal browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (new URL(url).origin !== ORIGIN) { e.preventDefault(); shell.openExternal(url); }
  });

  // If the server is asleep or offline, show a message and keep retrying
  win.webContents.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3 || url === OFFLINE_PAGE) return;
    win.loadURL(OFFLINE_PAGE);
    setTimeout(() => { if (win && !win.isDestroyed()) win.loadURL(SITE_URL); }, 5000);
  });
  win.on('closed', () => { win = null; });
}

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  // Only your site may use the microphone (for voice channels); everything else is denied
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback, details) => {
    callback(permission === 'media' && (details.requestingUrl || '').startsWith(ORIGIN));
  });
  session.defaultSession.setPermissionCheckHandler((wc, permission, origin) => {
    return permission === 'media' && (origin || '').startsWith(ORIGIN);
  });
  createWindow();
});

app.on('window-all-closed', () => app.quit());
