import { loadLinks } from './storage'

const HEALTH_KEY = 'ctab_link_health'
const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24小时

interface HealthRecord {
  url: string
  status: 'ok' | 'error' | 'checking'
  lastChecked: number
  statusCode?: number
}

// 获取所有健康记录
const getHealthRecords = async (): Promise<Map<string, HealthRecord>> => {
  try {
    const result = await chrome.storage.local.get(HEALTH_KEY)
    const records = result[HEALTH_KEY] || []
    const map = new Map<string, HealthRecord>()
    for (const r of records) map.set(r.url, r)
    return map
  } catch {
    return new Map()
  }
}

// 保存健康记录
const saveHealthRecords = async (records: Map<string, HealthRecord>) => {
  const arr = Array.from(records.values())
  await chrome.storage.local.set({ [HEALTH_KEY]: arr })
}

// 检测单个链接
const checkSingleLink = async (url: string): Promise<HealthRecord> => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return {
      url,
      status: 'ok',
      lastChecked: Date.now(),
      statusCode: response.status,
    }
  } catch {
    return {
      url,
      status: 'error',
      lastChecked: Date.now(),
    }
  }
}

// 批量检测链接（带节流）
export const checkAllLinks = async (
  onProgress?: (checked: number, total: number) => void
): Promise<Map<string, HealthRecord>> => {
  const links = await loadLinks()
  const records = await getHealthRecords()
  const now = Date.now()

  // 只检测超过 24 小时未检测的链接
  const toCheck = links.filter(link => {
    const record = records.get(link.url)
    return !record || (now - record.lastChecked) > CHECK_INTERVAL
  })

  let checked = 0
  for (const link of toCheck) {
    const result = await checkSingleLink(link.url)
    records.set(link.url, result)
    checked++
    onProgress?.(checked, toCheck.length)
    // 每检测 5 个保存一次
    if (checked % 5 === 0) {
      await saveHealthRecords(records)
    }
  }

  await saveHealthRecords(records)
  return records
}

// 获取链接健康状态
export const getLinkHealth = async (url: string): Promise<'ok' | 'error' | 'unknown'> => {
  const records = await getHealthRecords()
  const record = records.get(url)
  if (!record) return 'unknown'
  return record.status
}

// 批量获取健康状态
export const getLinksHealthMap = async (): Promise<Map<string, 'ok' | 'error' | 'unknown'>> => {
  const records = await getHealthRecords()
  const map = new Map<string, 'ok' | 'error' | 'unknown'>()
  for (const [url, record] of records) {
    map.set(url, record.status)
  }
  return map
}
