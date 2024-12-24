import React from 'react'
import { Select, Tooltip } from 'antd'
import * as Icons from '@ant-design/icons'
import { iconList } from '../../utils/iconUtils'
import './index.css'

interface IconSelectProps {
  value?: string
  onChange?: (value: string) => void
}

const IconSelect: React.FC<IconSelectProps> = ({ value, onChange }) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="选择图标"
      dropdownMatchSelectWidth={false}
      showSearch
      optionFilterProp="label"
    >
      {iconList.map(({ name, component: Icon }) => (
        <Select.Option key={name} value={name} label={name}>
          <Tooltip title={name}>
            <div className="icon-option">
              <Icon />
              <span className="icon-name">{name.replace('Outlined', '')}</span>
            </div>
          </Tooltip>
        </Select.Option>
      ))}
    </Select>
  )
}

export default IconSelect 