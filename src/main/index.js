import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { execFile } from 'child_process'
import util from 'util'

const execFilePromise = util.promisify(execFile)
const allowedCommands = new Set([
  '--version',
  'list',
  'current',
  'list-remote',
  'default',
  'install',
  'uninstall'
])
const versionArgumentPattern = /^(?:v?\d+(?:\.\d+){0,2}|latest|lts(?:\/[\w.-]+)?)$/i

function parseFnmCommand(command) {
  if (typeof command !== 'string' || command.trim() === '') {
    throw new Error('Invalid FNM command.')
  }

  const parts = command.trim().split(/\s+/)
  const [name, ...args] = parts

  if (!allowedCommands.has(name)) {
    throw new Error('Unsupported FNM command.')
  }

  if (name === '--version' || name === 'list' || name === 'current' || name === 'list-remote') {
    if (args.length > 0) throw new Error('This FNM command does not accept arguments.')
  } else if (args.length !== 1 || !versionArgumentPattern.test(args[0])) {
    throw new Error('Invalid Node.js version.')
  }

  return [name, ...args]
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 380,
    height: 560,
    minWidth: 340,
    minHeight: 480,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createApplicationMenu() {
  const menuTemplate = [
    {
      label: 'File',
      submenu: [{ role: 'quit', label: 'Exit' }]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
}

app.whenReady().then(() => {
  app.setName('NodeShift')
  electronApp.setAppUserModelId('com.nodeshift.app')
  createApplicationMenu()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Run validated FNM commands in the main process.
  ipcMain.handle('run-fnm', async (event, command) => {
    try {
      const args = parseFnmCommand(command)
      const { stdout, stderr } = await execFilePromise('fnm', args, {
        windowsHide: true,
        timeout: 120000,
        maxBuffer: 1024 * 1024
      })
      return { success: true, data: stdout || stderr }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown FNM execution error.'
      console.error('FNM Execution Error:', message)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('install-fnm', async () => {
    if (process.platform !== 'win32') {
      return {
        success: false,
        error: 'Automatic FNM installation is currently supported on Windows only.'
      }
    }

    try {
      const { stdout, stderr } = await execFilePromise(
        'winget.exe',
        [
          'install',
          '--id',
          'Schniz.fnm',
          '--exact',
          '--source',
          'winget',
          '--accept-source-agreements',
          '--accept-package-agreements'
        ],
        {
          windowsHide: true,
          timeout: 300000,
          maxBuffer: 1024 * 1024
        }
      )

      return { success: true, data: stdout || stderr }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown FNM installation error.'
      console.error('FNM Installation Error:', message)
      return { success: false, error: message }
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
