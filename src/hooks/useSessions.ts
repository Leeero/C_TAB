import { useState, useCallback } from 'react'
import { TabSession } from '../types'
import { loadSessions, createSession, deleteSession, renameSession, restoreSession } from '../utils/sessions'

interface UseSessionsReturn {
  sessions: TabSession[]
  isSessionManagerOpen: boolean
  setIsSessionManagerOpen: (v: boolean) => void
  initSessions: () => Promise<void>
  saveCurrentWindow: (name: string) => Promise<number>
  removeSession: (id: string) => Promise<void>
  renameSessionById: (id: string, name: string) => Promise<void>
  restoreSessionById: (session: TabSession) => Promise<void>
}

export function useSessions(notify: (type: 'success' | 'error', msg: string) => void): UseSessionsReturn {
  const [sessions, setSessions] = useState<TabSession[]>([])
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false)

  const initSessions = useCallback(async () => {
    const list = await loadSessions()
    setSessions(list)
  }, [])

  const saveCurrentWindow = useCallback(async (name: string): Promise<number> => {
    const tabs = await new Promise<chrome.tabs.Tab[]>(resolve => {
      chrome.tabs.query({ currentWindow: true }, resolve)
    })
    const tabData = tabs
      .filter(t => t.url && !t.url.startsWith('chrome://'))
      .map(t => ({
        title: t.title || '',
        url: t.url || '',
        favIconUrl: t.favIconUrl,
      }))
    if (tabData.length === 0) {
      notify('error', '当前窗口没有可保存的标签页')
      return 0
    }
    await createSession(name, tabData)
    await initSessions()
    notify('success', `已保存 ${tabData.length} 个标签页`)
    return tabData.length
  }, [initSessions, notify])

  const removeSession = useCallback(async (id: string) => {
    await deleteSession(id)
    await initSessions()
  }, [initSessions])

  const renameSessionById = useCallback(async (id: string, name: string) => {
    await renameSession(id, name)
    await initSessions()
  }, [initSessions])

  const restoreSessionById = useCallback(async (session: TabSession) => {
    await restoreSession(session)
    notify('success', `正在恢复 ${session.tabs.length} 个标签页`)
  }, [notify])

  return {
    sessions,
    isSessionManagerOpen,
    setIsSessionManagerOpen,
    initSessions,
    saveCurrentWindow,
    removeSession,
    renameSessionById,
    restoreSessionById,
  }
}
