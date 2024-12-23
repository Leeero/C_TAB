/*
 * @Author       : leroli
 * @Date         : 2024-12-23 18:34:47
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-23 19:59:34
 * @Description  : 
 */
import React from 'react'
import { Tooltip } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { SavedLink } from '../../types'
import './index.css'

interface DockBarProps {
  links: SavedLink[]
}

const DockBar: React.FC<DockBarProps> = ({ links }) => {
  return (
    <div className="dock-bar">
      <div className="dock-content">
        {links.map(link => (
          <Tooltip key={link.id} title={link.title} placement="top">
            <a
              href={link.url}
              className="dock-item"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.icon ? (
                <img src={link.icon} alt="" className="dock-icon" />
              ) : (
                <LinkOutlined className="dock-icon-fallback" />
              )}
            </a>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

export default DockBar 