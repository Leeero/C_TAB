import '@testing-library/jest-dom'

// Mock chrome.storage API
const mockStorage: Record<string, unknown> = {}

global.chrome = {
  storage: {
    sync: {
      get: (keys: string | string[]) => {
        const result: Record<string, unknown> = {}
        const keyList = Array.isArray(keys) ? keys : [keys]
        for (const key of keyList) {
          if (mockStorage[key] !== undefined) result[key] = mockStorage[key]
        }
        return Promise.resolve(result)
      },
      set: (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items)
        return Promise.resolve()
      },
      remove: (keys: string | string[]) => {
        const keyList = Array.isArray(keys) ? keys : [keys]
        for (const key of keyList) delete mockStorage[key]
        return Promise.resolve()
      },
    },
    local: {
      get: (keys: string | string[]) => {
        const result: Record<string, unknown> = {}
        const keyList = Array.isArray(keys) ? keys : [keys]
        for (const key of keyList) {
          if (mockStorage[key] !== undefined) result[key] = mockStorage[key]
        }
        return Promise.resolve(result)
      },
      set: (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items)
        return Promise.resolve()
      },
      remove: (keys: string | string[]) => {
        const keyList = Array.isArray(keys) ? keys : [keys]
        for (const key of keyList) delete mockStorage[key]
        return Promise.resolve()
      },
    },
  },
  tabs: {
    query: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 1 }),
    sendMessage: () => Promise.resolve(),
  },
  runtime: {
    onMessage: { addListener: () => {}, removeListener: () => {} },
    sendMessage: () => Promise.resolve(),
    getURL: (path: string) => `chrome-extension://mock/${path}`,
    lastError: null,
  },
  contextMenus: {
    create: () => {},
    removeAll: (cb?: () => void) => cb?.(),
    onClicked: { addListener: () => {} },
  },
  bookmarks: {
    getTree: () => Promise.resolve([]),
    getSubTree: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: '1' }),
  },
  tabGroups: {
    query: () => Promise.resolve([]),
    update: () => Promise.resolve(),
  },
  windows: {
    WINDOW_ID_CURRENT: -2,
  },
  commands: {
    onCommand: { addListener: () => {} },
  },
} as typeof chrome

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
