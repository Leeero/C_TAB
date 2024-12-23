import * as Icons from '@ant-design/icons'
import React from 'react'

export const iconList = Object.keys(Icons)
  .filter(key => key.endsWith('Outlined'))
  .map(key => ({
    name: key,
    component: Icons[key as keyof typeof Icons] as React.ComponentType
  }))

export const renderIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType
  return React.createElement(IconComponent)
}

export const getMatchingIcon = (name: string): string => {
  // 常用图标映射
  const iconMap: { [key: string]: string } = {
    '首页': 'HomeOutlined',
    '主页': 'HomeOutlined',
    '软件': 'AppstoreOutlined',
    '工具': 'ToolOutlined',
    '娱乐': 'PlayCircleOutlined',
    '音乐': 'CustomerServiceOutlined',
    '视频': 'PlaySquareOutlined',
    '影视': 'VideoCameraOutlined',
    '游戏': 'ThunderboltOutlined',
    '学习': 'BookOutlined',
    '教育': 'ReadOutlined',
    '文档': 'FileTextOutlined',
    '新闻': 'FileTextOutlined',
    '社交': 'TeamOutlined',
    '购物': 'ShoppingOutlined',
    '商城': 'ShoppingCartOutlined',
    '生活': 'HeartOutlined',
    '美食': 'CoffeeOutlined',
    '旅游': 'CompassOutlined',
    '天气': 'CloudOutlined',
    '地图': 'EnvironmentOutlined',
    '导航': 'CompassOutlined',
    '设置': 'SettingOutlined',
    '系统': 'DesktopOutlined',
    '下载': 'DownloadOutlined',
    '上传': 'UploadOutlined',
    '云盘': 'CloudUploadOutlined',
    '网盘': 'CloudDownloadOutlined',
    '邮箱': 'MailOutlined',
    '通讯': 'MessageOutlined',
    '聊天': 'MessageOutlined',
    '论坛': 'CommentOutlined',
    '博客': 'EditOutlined',
    '笔记': 'FormOutlined',
    '文章': 'FileTextOutlined',
    '图片': 'PictureOutlined',
    '相册': 'CameraOutlined',
    '摄影': 'CameraOutlined',
    '设计': 'HighlightOutlined',
    '艺术': 'BgColorsOutlined',
    '音频': 'AudioOutlined',
    '电影': 'PlayCircleOutlined',
    '电视': 'PlaySquareOutlined',
    '动漫': 'GiftOutlined',
    '漫画': 'ReadOutlined',
    '小说': 'ReadOutlined',
    '阅读': 'BookOutlined',
    '资讯': 'FileTextOutlined',
    '体育': 'TrophyOutlined',
    '运动': 'ThunderboltOutlined',
    '健康': 'HeartOutlined',
    '医疗': 'MedicineBoxOutlined',
    '银行': 'BankOutlined',
    '金融': 'DollarOutlined',
    '财务': 'AccountBookOutlined',
    '办公': 'LaptopOutlined',
    '企业': 'TeamOutlined',
    '公司': 'BankOutlined',
    '招聘': 'UserAddOutlined',
    '求职': 'UserOutlined',
    '简历': 'SolutionOutlined',
    '编程': 'CodeOutlined',
    '开发': 'CodeSandboxOutlined',
    '代码': 'CodepenOutlined',
    '服务': 'CustomerServiceOutlined',
    '其他': 'AppstoreOutlined'
  }

  // 1. 直接匹配
  if (iconMap[name]) {
    return iconMap[name]
  }

  // 2. 关键词匹配
  for (const [key, value] of Object.entries(iconMap)) {
    if (name.includes(key)) {
      return value
    }
  }

  // 3. 默认图标
  return 'AppstoreOutlined'
} 