import { SearchEngine } from '../types'

export const builtinSearchEngines: SearchEngine[] = [
  { id: 'google', name: 'Google', searchUrl: 'https://www.google.com/search?q={keyword}', isBuiltin: true },
  { id: 'baidu', name: '百度', searchUrl: 'https://www.baidu.com/s?wd={keyword}', isBuiltin: true },
  { id: 'bing', name: 'Bing', searchUrl: 'https://www.bing.com/search?q={keyword}', isBuiltin: true },
]

export const CUSTOM_ENGINES_KEY = 'ctab_custom_engines'

export const getSearchUrl = (engineId: string, keyword: string, customEngines?: SearchEngine[]): string => {
  const all = [...builtinSearchEngines, ...(customEngines || [])]
  const engine = all.find(e => e.id === engineId)
  if (!engine) return builtinSearchEngines[0].searchUrl.replace('{keyword}', encodeURIComponent(keyword))
  return engine.searchUrl.replace('{keyword}', encodeURIComponent(keyword))
}
