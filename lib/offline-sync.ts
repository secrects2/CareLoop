export const OFFLINE_STORAGE_KEY = 'epa_offline_queue'

export type OfflineRecordType = 'icope' | 'checkin' | 'boccia' | 'other'

export interface OfflineRecord {
    id: string
    type: OfflineRecordType
    payload: any
    createdAt: string
}

/**
 * 儲存一筆離線資料至 localStorage 佇列
 */
export const saveOfflineRecord = (type: OfflineRecordType, payload: any) => {
    if (typeof window === 'undefined') return
    
    // 如果環境不支援 crypto.randomUUID，提供 fallback
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15)

    const records = getOfflineRecords()
    const newRecord: OfflineRecord = {
        id,
        type,
        payload,
        createdAt: new Date().toISOString()
    }
    records.push(newRecord)
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(records))
    
    // 觸發自訂事件，讓 Banner 能夠即時更新狀態
    window.dispatchEvent(new Event('offline_queue_updated'))
}

/**
 * 取得目前所有離線佇列內的資料
 */
export const getOfflineRecords = (): OfflineRecord[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY)
    if (!stored) return []
    try {
        return JSON.parse(stored) as OfflineRecord[]
    } catch {
        return []
    }
}

/**
 * 移除特定的離線資料（當這筆資料上傳成功後呼叫）
 */
export const removeOfflineRecord = (id: string) => {
    if (typeof window === 'undefined') return
    const records = getOfflineRecords()
    const updated = records.filter(r => r.id !== id)
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('offline_queue_updated'))
}

/**
 * 清除所有離線佇列
 */
export const clearAllOfflineRecords = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(OFFLINE_STORAGE_KEY)
    window.dispatchEvent(new Event('offline_queue_updated'))
}
