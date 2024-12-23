/*
 * @Author       : leroli
 * @Date         : 2024-12-23 12:11:00
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-23 20:17:15
 * @Description  : 
 */
import React, { useState, useEffect } from 'react'
import { Input, Button, message } from 'antd'
import './PopupComponent.css'

interface PopupProps {
  onSave: (title: string, url: string, icon: string) => void
}

const PopupComponent: React.FC<PopupProps> = ({ onSave }) => {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [icon, setIcon] = useState('')

  useEffect(() => {
    // 获取当前标签页信息
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0]
      if (currentTab) {
        setTitle(currentTab.title || '')
        setUrl(currentTab.url || '')
        // 获取网站图标
        if (currentTab.favIconUrl) {
          setIcon(currentTab.favIconUrl)
        }
      }
    })
  }, [])

  const handleSave = () => {
    if (!title.trim() || !url.trim()) {
      message.error('请填写完整信息')
      return
    }
    console.log('title', title)
    onSave(title, url, icon)
    // window.close()
  }

  return (
    <div className="popup-container">
      <div className="site-info">
        {icon && <img src={icon} alt="" className="site-icon" />}
        <h3>保存到C_TAB</h3>
      </div>
      
      <div className="form-item">
        <label>标题</label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="输入标题"
          maxLength={50}
        />
      </div>

      <div className="form-item">
        <label>网址</label>
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="输入网址"
        />
      </div>

      <Button type="primary" block onClick={handleSave}>
        保存
      </Button>
    </div>
  )
}

export default PopupComponent 