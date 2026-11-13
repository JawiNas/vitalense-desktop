/* VitaLense desktop app (Windows and Mac).
   A secure window around the same app as the website. Everything stays on the computer:
   data is kept in the app's own storage, links open in the normal browser,
   and new versions are downloaded from your GitHub releases. */
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_ID = 'com.vitalense.app';
let win = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId(APP_ID);
    buildMenu();
    createWindow();
    checkForUpdates();
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

/* ---------- window size and position are remembered between launches ---------- */
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch (e) { return {}; } }
function saveState() {
  if (!win || win.isDestroyed()) return;
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), max: win.isMaximized() })); } catch (e) { /* ignore */ }
}

function createWindow() {
  const st = loadState();
  win = new BrowserWindow({
    width: st.width || 1280, height: st.height || 860, x: st.x, y: st.y,
    minWidth: 380, minHeight: 600,
    title: 'VitaLense', backgroundColor: '#050817', show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: false,
      spellcheck: false,
      backgroundThrottling: false // keeps workout and rest timers accurate when the window is in the background
    }
  });
  if (st.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('close', saveState);
  win.loadFile(path.join(__dirname, 'www', 'index.html'), { hash: '/home' });

  // New windows and outside links open in the normal browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => { openOutside(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); openOutside(url); } });
  // The app never needs the camera, microphone or location; photos are picked from files.
  win.webContents.session.setPermissionRequestHandler((wc, permission, cb) => cb(['notifications', 'clipboard-sanitized-write', 'fullscreen'].includes(permission)));
}
function openOutside(url) { if (/^(https?:|mailto:)/i.test(url)) shell.openExternal(url); }

/* ---------- menu (hidden on Windows until Alt is pressed) ---------- */
function buildMenu() {
  const mac = process.platform === 'darwin';
  const go = (hash) => () => { if (win) win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(hash)}`).catch(() => {}); };
  const template = [
    ...(mac ? [{ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] }] : []),
    { label: 'File', submenu: [mac ? { role: 'close' } : { role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'Go', submenu: [
      { label: 'Home', accelerator: 'CmdOrCtrl+1', click: go('#/home') },
      { label: 'Body', accelerator: 'CmdOrCtrl+2', click: go('#/body') },
      { label: 'Plan', accelerator: 'CmdOrCtrl+3', click: go('#/plan') },
      { label: 'Train', accelerator: 'CmdOrCtrl+4', click: go('#/train') },
      { label: 'Fuel', accelerator: 'CmdOrCtrl+5', click: go('#/fuel') },
      { type: 'separator' },
      { label: 'Workout history', click: go('#/history') },
      { label: 'Strength and recovery', click: go('#/strength') },
      { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: go('#/settings') }
    ] },
    { label: 'View', submenu: [{ role: 'reload' }, ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' }]), { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { role: 'windowMenu' },
    { role: 'help', submenu: [{ label: 'Check for updates', click: () => checkForUpdates(true) }, { label: 'About VitaLense', click: about }] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
function about() {
  dialog.showMessageBox(win, { type: 'info', title: 'About VitaLense', message: `VitaLense ${app.getVersion()}`, detail: 'Made by Infrability, powered by AI Vortex.\nGeneral wellness guidance, not medical advice.', buttons: ['OK'] });
}

/* ---------- updates from GitHub releases ---------- */
function checkForUpdates(manual) {
  if (!app.isPackaged) { if (manual) dialog.showMessageBox(win, { message: 'Updates are checked in the installed app only.' }); return; }
  let updater;
  try { updater = require('electron-updater').autoUpdater; } catch (e) { return; }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.removeAllListeners();
  updater.on('update-downloaded', (info) => {
    dialog.showMessageBox(win, { type: 'info', buttons: ['Restart now', 'Later'], defaultId: 0, message: `VitaLense ${info.version} is ready`, detail: 'Restart to finish updating. Your data stays as it is.' })
      .then((r) => { if (r.response === 0) updater.quitAndInstall(); });
  });
  if (manual) {
    updater.once('update-not-available', () => dialog.showMessageBox(win, { message: 'You have the latest version of VitaLense.' }));
    updater.once('error', () => {
      // Unsigned Mac builds cannot update themselves, so offer the download page instead.
      const page = releasesPage();
      dialog.showMessageBox(win, { message: 'Could not update automatically right now.', detail: page ? 'You can download the newest version from the release page.' : '', buttons: page ? ['Open download page', 'OK'] : ['OK'], defaultId: 0 })
        .then((r) => { if (page && r.response === 0) shell.openExternal(page); });
    });
  } else updater.on('error', () => { /* offline or no releases yet: try again next launch */ });
  updater.checkForUpdates().catch(() => {});
}
// The release page comes from the update settings that the build writes into the app.
function releasesPage() {
  try {
    const y = fs.readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8');
    const o = /^owner:\s*['"]?([\w.-]+)/m.exec(y), r = /^repo:\s*['"]?([\w.-]+)/m.exec(y);
    if (o && r) return `https://github.com/${o[1]}/${r[1]}/releases/latest`;
  } catch (e) { /* not packaged */ }
  return null;
}
