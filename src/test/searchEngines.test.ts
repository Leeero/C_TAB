import { describe, it, expect } from 'vitest'
import { builtinSearchEngines, getSearchUrl } from '../config/searchEngines'

describe('searchEngines', () => {
  it('should have 3 builtin engines', () => {
    expect(builtinSearchEngines).toHaveLength(3)
  })

  it('should include google, baidu, bing', () => {
    const ids = builtinSearchEngines.map(e => e.id)
    expect(ids).toContain('google')
    expect(ids).toContain('baidu')
    expect(ids).toContain('bing')
  })

  it('getSearchUrl should return google by default', () => {
    const url = getSearchUrl('nonexistent', 'test')
    expect(url).toContain('google.com')
    expect(url).toContain(encodeURIComponent('test'))
  })

  it('getSearchUrl should use correct engine', () => {
    const url = getSearchUrl('baidu', 'hello')
    expect(url).toContain('baidu.com')
    expect(url).toContain(encodeURIComponent('hello'))
  })

  it('getSearchUrl should handle custom engines', () => {
    const custom = [{ id: 'custom', name: 'Custom', searchUrl: 'https://example.com/search?q={keyword}' }]
    const url = getSearchUrl('custom', 'query', custom)
    expect(url).toBe('https://example.com/search?q=query')
  })
})
