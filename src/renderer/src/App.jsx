import { useState, useEffect, useCallback, useRef } from 'react'

function App() {
  const [versions, setVersions] = useState([])
  const [newVersion, setNewVersion] = useState('')
  const [loading, setLoading] = useState(false)
  const [fnmInstalled, setFnmInstalled] = useState(null)
  const [installingFnm, setInstallingFnm] = useState(false)
  const [availableVersions, setAvailableVersions] = useState([])
  const [loadingAvailableVersions, setLoadingAvailableVersions] = useState(false)
  const hasLoadedVersions = useRef(false)

  // Remove ANSI escape sequences from FNM command output.
  const cleanAnsi = (str) =>
    // eslint-disable-next-line no-control-regex
    str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

  // Keep the loader stable so it can safely be used as a useEffect dependency.
  const loadVersions = useCallback(async () => {
    setLoading(true)

    const versionRes = await window.api.runFnm('--version')
    if (!versionRes.success) {
      setFnmInstalled(false)
      setLoading(false)
      return
    }

    setFnmInstalled(true)
    const [listRes, currentRes] = await Promise.all([
      window.api.runFnm('list'),
      window.api.runFnm('current')
    ])

    if (listRes.success) {
      const cleanListOutput = cleanAnsi(listRes.data)
      const cleanCurrentOutput = currentRes.success ? cleanAnsi(currentRes.data).trim() : ''

      const lines = cleanListOutput.split('\n').filter((line) => line.trim() !== '')

      const parsedVersions = lines.map((line) => {
        const displayName = line
          .replace(/\*/g, '')
          .replace(/\bdefault\b/g, '')
          .trim()
        const isActive = cleanCurrentOutput !== '' && displayName.includes(cleanCurrentOutput)
        const isSystem = displayName.toLowerCase() === 'system'
        return { displayName, isActive, isSystem }
      })

      setVersions(parsedVersions)
    } else {
      alert('FNM Error: ' + listRes.error)
    }
    setLoading(false)
  }, []) // An empty dependency array keeps this callback stable between renders.

  const installFnm = async () => {
    setInstallingFnm(true)
    const result = await window.api.installFnm()

    if (result.success) {
      setFnmInstalled(false)
      alert('FNM installed successfully. Please restart this app so the new PATH is loaded.')
    } else {
      alert(`FNM installation failed: ${result.error}`)
    }

    setInstallingFnm(false)
  }

  useEffect(() => {
    if (hasLoadedVersions.current) return
    hasLoadedVersions.current = true

    let ignore = false
    const init = async () => {
      if (!ignore) {
        await loadVersions()
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [loadVersions]) // Reload when the stable version loader changes.

  const setDefault = async (versionStr) => {
    if (versionStr.toLowerCase() === 'system') return

    const version = versionStr.trim()
    setLoading(true)
    const result = await window.api.runFnm(`default ${version}`)

    if (result.success) {
      alert(`Default version set to ${version}`)
      await loadVersions()
    } else {
      alert(result.error)
      setLoading(false)
    }
  }

  const installVersion = async () => {
    if (!newVersion) return
    setLoading(true)
    const result = await window.api.runFnm(`install ${newVersion}`)

    if (result.success) {
      alert(`Successfully installed Node ${newVersion}`)
      setNewVersion('')
      await loadVersions()
    } else {
      alert(result.error)
      setLoading(false)
    }
  }

  const loadAvailableVersions = async () => {
    if (loadingAvailableVersions || availableVersions.length > 0) return

    setLoadingAvailableVersions(true)
    const result = await window.api.runFnm('list-remote')

    if (result.success) {
      const remoteVersions = cleanAnsi(result.data)
        .split(/\r?\n/)
        .map((line) => {
          const match = line.trim().match(/v?\d+\.\d+\.\d+/)
          return match ? match[0] : null
        })
        .filter(Boolean)

      setAvailableVersions([...new Set(remoteVersions)])
    } else {
      alert(`Could not load available Node versions: ${result.error}`)
    }

    setLoadingAvailableVersions(false)
  }

  const uninstallVersion = async (versionName) => {
    if (!window.confirm(`Are you sure you want to uninstall Node ${versionName}?`)) return

    setLoading(true)
    const result = await window.api.runFnm(`uninstall ${versionName}`)

    if (result.success) {
      alert(`Successfully uninstalled Node ${versionName}`)
      await loadVersions()
    } else {
      alert(result.error)
      setLoading(false)
    }
  }

  return (
    <div
      className="dashboard-shell"
      style={{
        padding: '12px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '380px',
        width: '100%',
        margin: '0 auto',
        color: '#e5e7eb'
      }}
    >
      <div
        className="dashboard-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px'
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 3px',
              color: '#60a5fa',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.14em',
              textTransform: 'uppercase'
            }}
          >
            Developer toolkit
          </p>
          <h1 style={{ color: '#f8fafc', margin: 0, fontSize: '20px', fontWeight: '700' }}>
            FNM Version Manager
          </h1>
          <p style={{ color: '#94a3b8', margin: '3px 0 0', fontSize: '12px' }}>
            Keep your Node.js versions organized and ready to use.
          </p>
        </div>
        {fnmInstalled && (
          <div
            className="install-panel"
            style={{
              padding: '5px 9px',
              borderRadius: '999px',
              color: '#86efac',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(134, 239, 172, 0.3)',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            ● FNM ready
          </div>
        )}
      </div>

      {fnmInstalled === false ? (
        <div
          style={{
            margin: '18px 0',
            padding: '18px',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            borderRadius: '16px',
            backgroundColor: 'rgba(120, 53, 15, 0.2)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.14)'
          }}
        >
          <h2 style={{ marginTop: 0, color: '#fde68a', fontWeight: '700' }}>
            FNM is not installed
          </h2>
          <p style={{ color: '#fcd34d', lineHeight: 1.5 }}>
            Install Fast Node Manager to start managing your Node.js versions.
          </p>
          <button
            onClick={installFnm}
            disabled={installingFnm}
            style={{
              padding: '10px 18px',
              backgroundColor: installingFnm ? '#9ca3af' : '#d97706',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: installingFnm ? 'wait' : 'pointer'
            }}
          >
            {installingFnm ? 'Installing FNM...' : 'Install FNM'}
          </button>
        </div>
      ) : (
        <div
          style={{
            margin: '12px 0 16px',
            padding: '12px',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.14)'
          }}
        >
          <select
            className="version-select"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            onFocus={loadAvailableVersions}
            style={{
              padding: '8px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #334155',
              minWidth: '180px',
              color: '#e2e8f0',
              backgroundColor: '#1e293b'
            }}
          >
            <option value="">Select available version</option>
            {availableVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
          <input
            className="version-input"
            type="text"
            placeholder="Or enter version (e.g., 20)"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '14px',
              flex: 1,
              borderRadius: '4px',
              border: '1px solid #334155',
              minWidth: '220px',
              color: '#e2e8f0',
              backgroundColor: '#1e293b'
            }}
          />
          <button
            onClick={installVersion}
            disabled={loading}
            style={{
              padding: '8px 14px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Install
          </button>
        </div>
      )}

      {fnmInstalled && (
        <button
          onClick={loadVersions}
          disabled={loading}
          style={{
            marginBottom: '14px',
            padding: '6px 11px',
            backgroundColor: '#334155',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh List
        </button>
      )}

      {fnmInstalled &&
        (loading ? (
          <p style={{ fontSize: '14px', color: '#93c5fd' }}>Processing...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {versions.map((v, index) => {
              return (
                <div
                  className="version-card"
                  key={index}
                  style={{
                    padding: '12px 14px',
                    border: v.isActive
                      ? '1px solid rgba(134, 239, 172, 0.45)'
                      : '1px solid rgba(148, 163, 184, 0.16)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: v.isActive
                      ? 'rgba(22, 101, 52, 0.22)'
                      : 'rgba(15, 23, 42, 0.72)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <span
                    className="version-name"
                    style={{
                      fontSize: '15px',
                      fontWeight: v.isActive ? 'bold' : 'normal',
                      color: v.isActive ? '#bbf7d0' : '#e2e8f0'
                    }}
                  >
                    {v.displayName} {v.isActive && ' (Active)'}
                  </span>

                  <div className="version-actions" style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setDefault(v.displayName)}
                      disabled={v.isActive || v.isSystem}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: v.isActive || v.isSystem ? '#334155' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: v.isActive || v.isSystem ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Set as Default
                    </button>

                    <button
                      onClick={() => uninstallVersion(v.displayName)}
                      disabled={v.isActive || v.isSystem || loading}
                      title={
                        v.isSystem
                          ? 'The system Node version is not managed by FNM'
                          : v.isActive
                            ? 'The active version cannot be uninstalled'
                            : ''
                      }
                      style={{
                        padding: '6px 10px',
                        backgroundColor:
                          v.isActive || v.isSystem || loading ? '#334155' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: v.isActive || v.isSystem || loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Uninstall
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

      <footer
        style={{
          marginTop: '32px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(148, 163, 184, 0.16)',
          color: '#64748b',
          textAlign: 'center',
          fontSize: '11px'
        }}
      >
        Developed by @mommentx
      </footer>
    </div>
  )
}

export default App
