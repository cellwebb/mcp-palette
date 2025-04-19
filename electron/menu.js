const { app, Menu, shell, BrowserWindow, dialog } = require('electron');
const path = require('path');

/**
 * Creates the application menu
 * @param {Object} options - Menu options
 * @param {Function} options.setupDefaultProfiles - Function to reset profiles to default
 * @param {Function} options.createUserMcpServersProfile - Function to create a user profile
 * @returns {Menu} The application menu
 */
function createAppMenu(options = {}) {
  const { setupDefaultProfiles, createUserMcpServersProfile } = options;
  
  const isMac = process.platform === 'darwin';
  
  const template = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Import Configuration',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow();
            if (mainWindow) {
              mainWindow.webContents.send('menu-import-config');
            }
          },
        },
        {
          label: 'Export Configuration',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow();
            if (mainWindow) {
              mainWindow.webContents.send('menu-export-config');
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // Profiles menu
    {
      label: 'Profiles',
      submenu: [
        {
          label: 'Create Profile with User MCP Servers',
          click: async () => {
            if (typeof createUserMcpServersProfile === 'function') {
              createUserMcpServersProfile();
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Reset to Default Profiles',
          click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow();
            if (!mainWindow) return;
            
            dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['Yes', 'No'],
              title: 'Confirm Reset',
              message: 'This will reset all profiles to default. Continue?'
            }).then(result => {
              if (result.response === 0) { // Yes button
                if (typeof setupDefaultProfiles === 'function') {
                  setupDefaultProfiles(true);
                }
                mainWindow.webContents.send('profiles-reset');
              }
            });
          },
        },
      ],
    },
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MCP Manager',
          click: async () => {
            const aboutWindow = new BrowserWindow({
              width: 500,
              height: 600,
              resizable: true,
              minimizable: false,
              maximizable: false,
              parent: BrowserWindow.getFocusedWindow(),
              modal: true,
              show: false,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
              }
            });
            
            // In development, load from the local file
            if (process.env.NODE_ENV === 'development') {
              aboutWindow.loadFile(path.join(__dirname, '../public/about.html'));
            } else {
              // In production, load from the bundled files
              aboutWindow.loadFile(path.join(__dirname, '../dist/about.html'));
            }
            
            aboutWindow.once('ready-to-show', () => {
              aboutWindow.show();
            });
          }
        },
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://modelcontextprotocol.io/');
          }
        },
        {
          label: 'Report an Issue',
          click: async () => {
            await shell.openExternal('https://github.com/modelcontextprotocol/issues');
          }
        }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  return menu;
}

module.exports = { createAppMenu };