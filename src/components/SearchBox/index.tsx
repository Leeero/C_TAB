/*
 * 搜索框：网页搜索 + 本地快捷入口
 */
import React, { useState, useMemo, useRef, useEffect } from "react"
import { Input } from "antd"
import {
  SearchOutlined,
  GoogleOutlined,
  BaiduOutlined,
  LinkOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons"
import { SavedLink, SearchEngine } from "../../types"
import { builtinSearchEngines } from "../../config/searchEngines"
import "./index.css"

interface SearchBoxProps {
  searchText: string
  onSearch: (value: string) => void
  onKeyPress: () => void
  searchEngine: string
  savedLinks: SavedLink[]
  customEngines?: SearchEngine[]
  onToggleDock?: (link: SavedLink) => void
}

const SearchBox: React.FC<SearchBoxProps> = ({
  searchText,
  onSearch,
  onKeyPress,
  searchEngine,
  savedLinks,
  customEngines,
  onToggleDock,
}) => {
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const matchedLinks = useMemo(() => {
    if (!searchText.trim()) return []
    const q = searchText.toLowerCase()
    return savedLinks
      .filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.tags?.some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [searchText, savedLinks])

  const showSuggestions = focused && searchText.trim().length > 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLinkClick = (url: string) => {
    window.open(url, "_blank")
    setFocused(false)
  }

  // 获取当前引擎信息
  const allEngines = [...builtinSearchEngines, ...(customEngines || [])]
  const engine = allEngines.find(e => e.id === searchEngine) || allEngines[0]

  const engineIconMap: Record<string, React.ReactNode> = {
    google: <GoogleOutlined />,
    baidu: <BaiduOutlined />,
    bing: <img src="/icons/bing.svg" alt="bing" style={{ width: 16, height: 16 }} />,
  }

  const engineIcon = engineIconMap[engine?.id || 'google'] || <SearchOutlined />

  return (
    <div className="search-container">
      <div className={`search-box ${focused ? "search-box--focused" : ""}`} ref={wrapperRef}>
        <Input
          className="search-input"
          prefix={<span className="search-engine-icon">{engineIcon}</span>}
          suffix={
            <span className="search-engine-tag">{engine?.name || 'Search'}</span>
          }
          placeholder={`搜索网页或已保存的链接...`}
          value={searchText}
          onChange={(e) => onSearch(e.target.value)}
          onPressEnter={() => {
            if (matchedLinks.length > 0) {
              handleLinkClick(matchedLinks[0].url)
            } else {
              onKeyPress()
            }
          }}
          onFocus={() => setFocused(true)}
          allowClear
        />

        {showSuggestions && matchedLinks.length > 0 && (
          <div className="search-suggestions">
            <div className="search-suggestions-header">
              <LinkOutlined /> 本地快捷入口
            </div>
            {matchedLinks.map((link) => (
              <div
                key={link.id}
                className="search-suggestion-item"
                onClick={() => handleLinkClick(link.url)}
              >
                <div className="suggestion-icon">
                  {link.icon ? (
                    <img src={link.icon} alt="" />
                  ) : (
                    <LinkOutlined />
                  )}
                </div>
                <div className="suggestion-info">
                  <div className="suggestion-title">{link.title}</div>
                  <div className="suggestion-url">{link.url}</div>
                </div>
                {onToggleDock && (
                  <button
                    className="suggestion-dock-btn"
                    title={link.isDocked ? "取消固定" : "固定到底部"}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleDock(link)
                    }}
                  >
                    {link.isDocked ? <StarFilled /> : <StarOutlined />}
                  </button>
                )}
              </div>
            ))}
            <div className="search-suggestions-footer" onClick={() => { onKeyPress(); setFocused(false) }}>
              <SearchOutlined /> 搜索 "{searchText}"
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchBox
