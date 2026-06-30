import { describe, it, expect } from 'vitest'
import { getMatchingIcon } from '../utils/iconUtils'

describe('iconUtils', () => {
  it('should map 首页 to HomeOutlined', () => {
    expect(getMatchingIcon('首页')).toBe('HomeOutlined')
  })

  it('should map 工具 to ToolOutlined', () => {
    expect(getMatchingIcon('工具')).toBe('ToolOutlined')
  })

  it('should map 游戏 to ThunderboltOutlined', () => {
    expect(getMatchingIcon('游戏')).toBe('ThunderboltOutlined')
  })

  it('should fallback to AppstoreOutlined for unknown', () => {
    expect(getMatchingIcon('xyz_unknown')).toBe('AppstoreOutlined')
  })

  it('should do partial match for 包含关键词', () => {
    expect(getMatchingIcon('我的音乐播放器')).toBe('CustomerServiceOutlined')
  })
})
