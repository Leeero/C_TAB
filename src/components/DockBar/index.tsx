/*
 * @Author       : leroli
 * @Date         : 2024-12-23 18:34:47
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-31 16:18:18
 * @Description  : 
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Dropdown, Tooltip } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { SavedLink } from '../../types'
import './index.css'

interface DockBarProps {
  links: SavedLink[]
  openInNewTab: boolean
  getMenuItems: (link: SavedLink) => any[]
}

const DockBar: React.FC<DockBarProps> = ({ links, openInNewTab, getMenuItems }) => {
  return (
    <div className="dock-bar">
      <div className="dock-content">
        {links.map(link => (
          <Dropdown key={link.id} menu={{ items: getMenuItems(link) }} trigger={['contextMenu']}>
            <Tooltip title={link.title} placement="top">
              <a
                href={link.url}
                className="dock-item"
                target={openInNewTab ? "_blank" : "_self"}
                rel={openInNewTab ? "noopener noreferrer" : ""}
                
              >
                {link.icon ? (
                  <img src={link.icon} alt="" className="dock-icon" />
                ) : (
                  <LinkOutlined className="dock-icon-fallback" />
                )}
              </a>
            </Tooltip>
          </Dropdown>
        ))}
      </div>
    </div>
  )
}

export default DockBar 