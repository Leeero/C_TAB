/*
 * @Author       : leroli
 * @Date         : 2024-12-23 18:25:27
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-23 18:39:25
 * @Description  : 
 */
import { SearchEngine } from '../types'

export const defaultSearchEngines: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    searchUrl: 'https://www.google.com/search?q={keyword}'
  },
  {
    id: 'baidu',
    name: '百度',
    searchUrl: 'https://www.baidu.com/s?wd={keyword}'
  },
  {
    id: 'bing',
    name: 'Bing',
    searchUrl: 'https://www.bing.com/search?q={keyword}'
  }
]

export const getSearchUrl = (engineId: string, keyword: string): string => {
  const engine = defaultSearchEngines.find(e => e.id === engineId)
  if (!engine) return defaultSearchEngines[0].searchUrl.replace('{keyword}', encodeURIComponent(keyword))
  return engine.searchUrl.replace('{keyword}', encodeURIComponent(keyword))
} 