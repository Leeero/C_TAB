import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Input, Button, Space, Tooltip, Empty, Popconfirm, message } from 'antd'
import {
  SaveOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  EditOutlined,
  ChromeOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { TabSession } from '../../types'
import { loadSessions, createSession, deleteSession, renameSession, restoreSession } from '../../utils/sessions'
import './index.css'

interface SessionManagerProps {
  open: boolean
  onClose: () => void
}

const SessionManager: React.FC<SessionManagerProps> = ({ open, onClose }) => {
  const [sessions, setSessions] = useState<TabSession[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const refresh = useCallback(async () => {
    const list = await loadSessions()
    setSessions(list)
  }, [])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const handleCreate = async () => {
    if (!newSessionName.trim()) {
      message.warning('请输入会话名称')
      return
    }
    const tabs = await new Promise<chrome.tabs.Tab[]>(resolve => {
      chrome.tabs.query({ currentWindow: true }, resolve)
    })
    const tabData = tabs
      .filter(t => t.url && !t.url.startsWith('chrome://'))
      .map(t => ({
        title: t.title || '',
        url: t.url || '',
        favIconUrl: t.favIconUrl,
      }))
    if (tabData.length === 0) {
      message.warning('当前窗口没有可保存的标签页')
      return
    }
    await createSession(newSessionName.trim(), tabData)
    setNewSessionName('')
    setIsCreating(false)
    message.success(`已保存 ${tabData.length} 个标签页`)
    refresh()
  }

  const handleRestore = async (session: TabSession) => {
    await restoreSession(session)
    message.success(`正在恢复 ${session.tabs.length} 个标签页`)
  }

  const handleRename = async (id: string) => {
    if (!editName.trim()) return
    await renameSession(id, editName.trim())
    setEditingId(null)
    message.success('重命名成功')
    refresh()
  }

  const handleDelete = async (id: string) => {
    await deleteSession(id)
    message.success('已删除')
    refresh()
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return (
    <Modal
      title={<><SaveOutlined /> 标签页会话</>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      className="session-manager"
    >
      <div className="session-create">
        {isCreating ? (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入会话名称（如：工作项目A）"
              value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              onPressEnter={handleCreate}
              maxLength={20}
              autoFocus
            />
            <Button type="primary" onClick={handleCreate}>保存</Button>
            <Button onClick={() => { setIsCreating(false); setNewSessionName('') }}>取消</Button>
          </Space.Compact>
        ) : (
          <Button
            type="dashed"
            block
            icon={<SaveOutlined />}
            onClick={() => setIsCreating(true)}
          >
            保存当前窗口标签页
          </Button>
        )}
      </div>

      <div className="session-list">
        {sessions.length === 0 ? (
          <Empty description="暂无保存的会话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          sessions.map(session => (
            <div key={session.id} className="session-item">
              <div className="session-info">
                {editingId === session.id ? (
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      size="small"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onPressEnter={() => handleRename(session.id)}
                      autoFocus
                    />
                    <Button size="small" type="primary" onClick={() => handleRename(session.id)}>确定</Button>
                    <Button size="small" onClick={() => setEditingId(null)}>取消</Button>
                  </Space.Compact>
                ) : (
                  <>
                    <div className="session-name">{session.name}</div>
                    <div className="session-meta">
                      <span><ChromeOutlined /> {session.tabs.length} 个标签页</span>
                      <span><ClockCircleOutlined /> {formatTime(session.createdAt)}</span>
                    </div>
                    <div className="session-preview">
                      {session.tabs.slice(0, 4).map((tab, i) => (
                        <span key={i} className="session-tab-dot" title={tab.title}>
                          {tab.favIconUrl ? (
                            <img src={tab.favIconUrl} alt="" />
                          ) : (
                            <span className="tab-dot-fallback" />
                          )}
                        </span>
                      ))}
                      {session.tabs.length > 4 && (
                        <span className="session-tab-more">+{session.tabs.length - 4}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
              {editingId !== session.id && (
                <div className="session-actions">
                  <Tooltip title="恢复会话">
                    <Button
                      type="primary"
                      size="small"
                      icon={<FolderOpenOutlined />}
                      onClick={() => handleRestore(session)}
                    />
                  </Tooltip>
                  <Tooltip title="重命名">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => { setEditingId(session.id); setEditName(session.name) }}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="确认删除此会话？"
                    onConfirm={() => handleDelete(session.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}

export default SessionManager
