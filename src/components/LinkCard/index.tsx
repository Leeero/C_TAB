/*
 * @Author       : leroli
 * @Date         : 2024-12-23 18:34:41
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-23 19:40:21
 * @Description  : 
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Dropdown } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { SavedLink } from '../../types'
import './index.css'

interface LinkCardProps {
  link: SavedLink
  menuItems: any[]
  className?: string
}

const LinkCard: React.FC<LinkCardProps> = ({ link, menuItems, className }) => {
  return (
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      <div className={`link-card ${className || ''}`}>
        <a href={link.url} className="link-content" target="_blank" rel="noopener noreferrer">
          <div className="link-icon">
            {link.icon ? (
              <img src={link.icon} alt="" className="favicon" />
            ) : (
              <LinkOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />
            )}
          </div>
          <div className="link-title">{link.title}</div>
        </a>
      </div>
    </Dropdown>
  )
}

export default LinkCard 