'use client'

import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { getOfflineRecords, removeOfflineRecord, OfflineRecord } from '@/lib/offline-sync'
import toast from 'react-hot-toast'

export default function OfflineSyncBanner() {
    const [isOnline, setIsOnline] = useState(true)
    const [records, setRecords] = useState<OfflineRecord[]>([])
    const [syncing, setSyncing] = useState(false)

    const checkStatus = () => {
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
        setRecords(getOfflineRecords())
    }

    useEffect(() => {
        // Initial check
        checkStatus()

        // Event listeners
        window.addEventListener('online', checkStatus)
        window.addEventListener('offline', checkStatus)
        window.addEventListener('offline_queue_updated', checkStatus)

        return () => {
            window.removeEventListener('online', checkStatus)
            window.removeEventListener('offline', checkStatus)
            window.removeEventListener('offline_queue_updated', checkStatus)
        }
    }, [])

    const handleSync = async () => {
        if (!isOnline) {
            toast.error('目前沒有網路，無法同步')
            return
        }
        if (records.length === 0) return

        setSyncing(true)
        try {
            const res = await fetch('/api/offline-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records })
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Server error')
            }

            const { success, failed } = json.results

            // 清除成功的紀錄
            success.forEach((id: string) => removeOfflineRecord(id))

            if (failed.length > 0) {
                toast.error(`同步完成，但有 ${failed.length} 筆失敗請稍後再試`)
            } else {
                toast.success('🎉 所有離線資料已成功同步！')
            }
        } catch (error: any) {
            toast.error('同步失敗: ' + error.message)
        } finally {
            setSyncing(false)
            checkStatus()
        }
    }

    if (isOnline && records.length === 0) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center">
            {/* 離線警告 */}
            {!isOnline && (
                <div className="w-full bg-red-500 text-white text-xs py-1.5 px-4 text-center font-medium shadow-md flex items-center justify-center gap-1.5 animate-in slide-in-from-top">
                    <WifiOff className="w-3.5 h-3.5" />
                    目前的網路狀態不穩，您提交的評估表單將自動儲存在本機。
                </div>
            )}

            {/* 同步提示 */}
            {records.length > 0 && (
                <div className="w-full max-w-lg mt-2 mx-auto px-4 animate-in slide-in-from-top-4">
                    <div className="bg-white/90 backdrop-blur-md shadow-lg border border-orange-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold">{records.length}</span>
                            </div>
                            <div className="text-sm">
                                <p className="font-bold text-slate-800">有待上傳的離線紀錄</p>
                                <p className="text-xs text-slate-500">恢復連線後請點擊同步上傳</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleSync}
                            disabled={syncing || !isOnline}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                !isOnline
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 text-white'
                            }`}
                        >
                            {syncing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    同步中
                                </>
                            ) : (
                                <>
                                    {!isOnline ? '無網路' : '一鍵同步'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
