import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Expose the function that the React renderer uses to run FNM commands.
  runFnm: (command) => ipcRenderer.invoke('run-fnm', command),
  installFnm: () => ipcRenderer.invoke('install-fnm')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.api = api
}
