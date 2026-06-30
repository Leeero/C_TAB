import { useState, useCallback } from 'react'
import {
  saveBackgroundImage,
  loadBackgroundImage,
  clearBackgroundImage,
  saveBackgroundOpacity,
  loadBackgroundOpacity,
  saveSettings,
} from '../utils/storage'

interface UseBackgroundReturn {
  backgroundImageUrl: string
  backgroundColor: string
  bgOpacity: number
  editorOpen: boolean
  editorImageUrl: string
  setBackgroundImageUrl: (url: string) => void
  setBackgroundColor: (color: string) => void
  initBackground: () => Promise<void>
  selectColor: (color: string) => Promise<void>
  removeBackground: () => Promise<void>
  uploadBackground: (file: File) => void
  editorSave: (dataUrl: string, opacity: number) => Promise<void>
  editorCancel: () => void
}

export function useBackground(notify: (type: 'success' | 'error', msg: string) => void): UseBackgroundReturn {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('')
  const [backgroundColor, setBackgroundColor] = useState<string>('#f0f2f5')
  const [bgOpacity, setBgOpacity] = useState(100)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorImageUrl, setEditorImageUrl] = useState('')

  const initBackground = useCallback(async () => {
    try {
      const [localBg, localOpacity] = await Promise.all([
        loadBackgroundImage(),
        loadBackgroundOpacity(),
      ])
      if (localBg) setBackgroundImageUrl(localBg)
      setBgOpacity(localOpacity)
    } catch (error) {
      console.error('加载背景数据失败:', error)
    }
  }, [])

  const selectColor = useCallback(async (color: string) => {
    await clearBackgroundImage()
    await saveSettings({ backgroundColor: color, backgroundImageUrl: '' })
    setBackgroundColor(color)
    setBackgroundImageUrl('')
    notify('success', '背景设置成功')
  }, [notify])

  const removeBackground = useCallback(async () => {
    await clearBackgroundImage()
    await saveSettings({ backgroundImageUrl: '', backgroundColor: '#f0f2f5' })
    setBackgroundImageUrl('')
    setBgOpacity(100)
    setBackgroundColor('#f0f2f5')
    notify('success', '已恢复默认背景')
  }, [notify])

  const uploadBackground = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      notify('error', '图片不能超过 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setEditorImageUrl(e.target?.result as string)
      setEditorOpen(true)
    }
    reader.readAsDataURL(file)
  }, [notify])

  const editorSave = useCallback(async (dataUrl: string, opacity: number) => {
    await saveBackgroundImage(dataUrl)
    await saveBackgroundOpacity(opacity)
    await saveSettings({ backgroundImageUrl: 'local', backgroundColor: '' })
    setBackgroundImageUrl(dataUrl)
    setBgOpacity(opacity)
    setBackgroundColor('')
    setEditorOpen(false)
    notify('success', '背景设置成功')
  }, [notify])

  const editorCancel = useCallback(() => {
    setEditorOpen(false)
    setEditorImageUrl('')
  }, [])

  return {
    backgroundImageUrl,
    backgroundColor,
    bgOpacity,
    editorOpen,
    editorImageUrl,
    setBackgroundImageUrl,
    setBackgroundColor,
    initBackground,
    selectColor,
    removeBackground,
    uploadBackground,
    editorSave,
    editorCancel,
  }
}
