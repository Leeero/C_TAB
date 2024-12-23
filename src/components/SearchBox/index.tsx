/*
 * @Author       : leroli
 * @Date         : 2024-12-23 18:37:30
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-23 19:55:34
 * @Description  : 
 */
import React from 'react'
import { Input } from 'antd'
import { SearchOutlined, GoogleOutlined, BaiduOutlined } from '@ant-design/icons'
import './index.css'

interface SearchBoxProps {
  searchText: string
  onSearch: (value: string) => void
  onKeyPress: () => void
  searchEngine: string
}

const SearchBox: React.FC<SearchBoxProps> = ({
  searchText,
  onSearch,
  onKeyPress,
  searchEngine
}) => {
  const getSearchEngineInfo = () => {
    switch (searchEngine) {
      case 'google':
        return {
          icon: <GoogleOutlined className="engine-icon" />,
          name: 'Google'
        }
      case 'baidu':
        return {
          icon: <BaiduOutlined className="engine-icon"/>,
          name: '百度'
        }
      case 'bing':
        return {
          icon: <img src="/icons/bing.svg" className="engine-icon" alt="bing" />,
          name: 'Bing'
        }
      default:
        return {
          icon: <SearchOutlined className="engine-icon" />,
          name: 'Search'
        }
    }
  }

  const { icon, name } = getSearchEngineInfo()

  return (
    <div className="search-container">
      <div className="search-box">
        <Input
          prefix={icon}
          suffix={<div className="engine-name">{name}</div>}
          placeholder={`在 ${name} 中搜索`}
          value={searchText}
          onChange={e => onSearch(e.target.value)}
          onPressEnter={onKeyPress}
          allowClear
        />
      </div>
    </div>
  )
}

export default SearchBox 