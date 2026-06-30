import { TabSession } from '../types'

const SESSIONS_KEY = 'ctab_sessions'

export const loadSessions = async (): Promise<TabSession[]> => {
  try {
    const result = await chrome.storage.local.get(SESSIONS_KEY)
    return result[SESSIONS_KEY] || []
  } catch {
    return []
  }
}

export const saveSessions = async (sessions: TabSession[]) => {
  await chrome.storage.local.set({ [SESSIONS_KEY]: sessions })
}

export const createSession = async (name: string, tabs: TabSession['tabs']): Promise<TabSession> => {
  const sessions = await loadSessions()
  const newSession: TabSession = {
    id: Date.now().toString(),
    name: name.trim(),
    tabs,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await saveSessions([newSession, ...sessions])
  return newSession
}

export const deleteSession = async (sessionId: string) => {
  const sessions = await loadSessions()
  await saveSessions(sessions.filter(s => s.id !== sessionId))
}

export const renameSession = async (sessionId: string, newName: string) => {
  const sessions = await loadSessions()
  const updated = sessions.map(s =>
    s.id === sessionId ? { ...s, name: newName.trim(), updatedAt: Date.now() } : s
  )
  await saveSessions(updated)
}

export const restoreSession = async (session: TabSession) => {
  for (const tab of session.tabs) {
    chrome.tabs.create({ url: tab.url, active: false })
  }
}
