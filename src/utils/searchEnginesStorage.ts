import { SearchEngine } from '../types'

const CUSTOM_ENGINES_KEY = 'ctab_custom_engines'

export const loadCustomEngines = async (): Promise<SearchEngine[]> => {
  try {
    const result = await chrome.storage.sync.get(CUSTOM_ENGINES_KEY)
    return result[CUSTOM_ENGINES_KEY] || []
  } catch {
    return []
  }
}

export const saveCustomEngines = async (engines: SearchEngine[]) => {
  await chrome.storage.sync.set({ [CUSTOM_ENGINES_KEY]: engines })
}

export const addCustomEngine = async (engine: SearchEngine) => {
  const engines = await loadCustomEngines()
  engines.push({ ...engine, isBuiltin: false })
  await saveCustomEngines(engines)
}

export const removeCustomEngine = async (engineId: string) => {
  const engines = await loadCustomEngines()
  await saveCustomEngines(engines.filter(e => e.id !== engineId))
}

export const updateCustomEngine = async (engine: SearchEngine) => {
  const engines = await loadCustomEngines()
  const idx = engines.findIndex(e => e.id === engine.id)
  if (idx >= 0) engines[idx] = engine
  else engines.push(engine)
  await saveCustomEngines(engines)
}
