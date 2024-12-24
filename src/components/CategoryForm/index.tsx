/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * @Author       : leroli
 * @Date         : 2024-12-24 14:41:55
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-24 16:30:09
 * @Description  : 
 */
import React from 'react'
import { Form, Input, ColorPicker, Space } from 'antd'
import type { FormInstance } from 'antd/es/form'
import IconSelect from '../IconSelect'
import './index.css'

interface CategoryFormProps {
  form: FormInstance
  initialValues?: any
  onFinish: (values: any) => void
}

const CategoryForm: React.FC<CategoryFormProps> = ({ form, initialValues, onFinish }) => {
  // 处理表单提交
  const handleFinish = (values: any) => {
    // 转换颜色值
    const formattedValues = {
      ...values,
      color: typeof values.color === 'string' 
        ? values.color 
        : values.color?.toHexString?.() || values.color?.metaColor?.toHexString() || values.color
    }
    onFinish(formattedValues)
  }

  return (
    <Form
      form={form}
      initialValues={{
        ...initialValues,
        // 确保初始颜色值正确
        color: initialValues?.color ? initialValues.color : undefined
      }}
      layout="vertical"
      requiredMark={false}
      onFinish={handleFinish}
    >
      <Form.Item
        name="name"
        label="分类名称"
        rules={[{ required: true, message: '请输入分类名称' }]}
      >
        <Input maxLength={10} showCount />
      </Form.Item>

      <Space className="icon-color-row">
        <Form.Item
          name="icon"
          label="分类图标"
          rules={[{ required: true, message: '请选择图标' }]}
        >
          <IconSelect />
        </Form.Item>

        <Form.Item
          name="color"
          label="图标颜色"
          getValueFromEvent={(color) => {
            // 处理颜色选择器的值
            if (typeof color === 'string') return color
            return color?.toHexString?.() || color?.metaColor?.toHexString() || color
          }}
        >
          <ColorPicker format="hex" />
        </Form.Item>
      </Space>
    </Form>
  )
}

export default CategoryForm 