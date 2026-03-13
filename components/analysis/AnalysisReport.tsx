'use client'

import React from 'react'
import { type AiReport, type AnalysisMetrics, generateAiReport } from '@/lib/analysis/ai-prescription'

// ============================================================================
// Props
// ============================================================================

interface AnalysisReportProps {
    metrics: AnalysisMetrics
    patientName?: string
    sessionDate?: string
    durationSeconds?: number
    onClose: () => void
}

// ============================================================================
// Helper
// ============================================================================

const PRIORITY_STYLES = {
    high: { bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'bg-red-500', label: '高' },
    medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500', label: '中' },
    low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500', label: '低' },
}

function formatDuration(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`
}

// ============================================================================
// Component
// ============================================================================

export default function AnalysisReport({ metrics, patientName, sessionDate, durationSeconds, onClose }: AnalysisReportProps) {
    const report: AiReport = generateAiReport(metrics)
    const now = sessionDate || new Date().toLocaleString('zh-TW')

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-white">📊 AI 分析報告</h1>
                    <p className="text-xs text-slate-500">{patientName || '長者'} • {now}</p>
                </div>
                <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 text-sm text-white hover:bg-white/20 transition-colors">
                    ✕ 關閉
                </button>
            </div>

            <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">

                {/* ===== 1. 總評 ===== */}
                <section className="glass-card p-6 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto" style={{ backgroundColor: report.overall.color + '20' }}>
                        <span className="text-3xl font-black" style={{ color: report.overall.color }}>{report.overall.score}</span>
                    </div>
                    <div>
                        <span className="inline-block px-4 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: report.overall.color }}>
                            {report.overall.level}
                        </span>
                    </div>
                    <p className="text-sm text-slate-300">{report.overall.summary}</p>
                    {durationSeconds && (
                        <p className="text-xs text-slate-500">分析時長：{formatDuration(durationSeconds)} • 投擲次數：{metrics.throw_count} 次</p>
                    )}
                </section>

                {/* ===== 2. 關鍵數據 ===== */}
                <section className="space-y-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">📈 關鍵數據</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="手肘伸展度" value={`${metrics.avg_rom}°`} ideal="≥150°" good={metrics.avg_rom >= 150} />
                        <MetricCard label="軀幹傾斜" value={`${metrics.avg_trunk_tilt}°`} ideal="≤10°" good={metrics.avg_trunk_tilt <= 10} />
                        <MetricCard label="穩定比例" value={`${metrics.stable_ratio}%`} ideal="≥70%" good={metrics.stable_ratio >= 70} />
                        <MetricCard label="震顫偵測" value={`${metrics.tremor_detected_ratio}%`} ideal="≤5%" good={metrics.tremor_detected_ratio <= 5} />
                        {metrics.core_stability_angle !== null && (
                            <MetricCard label="核心穩定角" value={`${metrics.core_stability_angle}°`} ideal="≤8°" good={metrics.core_stability_angle <= 8} />
                        )}
                        <MetricCard label="代償動作" value={`${metrics.compensation_detected_ratio}%`} ideal="≤10%" good={metrics.compensation_detected_ratio <= 10} />
                    </div>

                    {/* 角速度 */}
                    {(metrics.avg_shoulder_angular_vel || metrics.avg_elbow_angular_vel || metrics.avg_wrist_angular_vel) && (
                        <div className="glass-card p-4">
                            <p className="text-xs text-slate-500 mb-2">關節角速度 (°/s)</p>
                            <div className="flex gap-4 text-sm">
                                {metrics.avg_shoulder_angular_vel !== null && <span className="text-slate-300">肩 <b className="text-white">{metrics.avg_shoulder_angular_vel}</b></span>}
                                {metrics.avg_elbow_angular_vel !== null && <span className="text-slate-300">肘 <b className="text-white">{metrics.avg_elbow_angular_vel}</b></span>}
                                {metrics.avg_wrist_angular_vel !== null && <span className="text-slate-300">腕 <b className="text-white">{metrics.avg_wrist_angular_vel}</b></span>}
                            </div>
                        </div>
                    )}
                </section>

                {/* ===== 3. 優勢 ===== */}
                {report.strengths.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">✅ 優勢項目</h2>
                        <div className="glass-card p-4 space-y-2">
                            {report.strengths.map((s, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-green-400">
                                    <span className="shrink-0 mt-0.5">•</span>
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== 4. 需注意 ===== */}
                {report.concerns.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">⚠️ 需注意</h2>
                        <div className="glass-card p-4 space-y-2">
                            {report.concerns.map((c, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-amber-400">
                                    <span className="shrink-0 mt-0.5">•</span>
                                    <span>{c}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== 5. AI 建議處方 ===== */}
                <section className="space-y-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">💊 AI 建議處方</h2>
                    <div className="space-y-4">
                        {report.prescriptions.map((rx, i) => {
                            const style = PRIORITY_STYLES[rx.priority]
                            return (
                                <div key={i} className={`rounded-2xl border-2 p-4 space-y-3 ${style.bg} ${style.border}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{rx.icon}</span>
                                            <div>
                                                <h3 className="font-bold text-white text-sm">{rx.title}</h3>
                                                <span className="text-[10px] text-slate-500">{rx.category}</span>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${style.badge}`}>
                                            優先：{style.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">{rx.description}</p>
                                    <div className="space-y-1.5">
                                        {rx.exercises.map((ex, j) => (
                                            <div key={j} className="flex items-start gap-2 text-xs text-slate-300">
                                                <span className="text-white font-bold shrink-0">{j + 1}.</span>
                                                <span>{ex}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-[11px] text-slate-500">📅 建議頻率：{rx.frequency}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ===== 6. 安全提示 ===== */}
                <section className="glass-card p-4 border-l-4 border-amber-500/50 space-y-2">
                    <h3 className="text-sm font-bold text-amber-400">🛡️ 安全提示</h3>
                    {report.safetyNotes.map((n, i) => (
                        <p key={i} className="text-xs text-slate-400">• {n}</p>
                    ))}
                </section>

                {/* ===== 免責聲明 ===== */}
                <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                    本報告由 AI 系統自動產生，僅供參考。運動處方不構成醫療建議，<br />
                    請在專業指導員指導下執行。© {new Date().getFullYear()} 惠生長照事業有限公司
                </p>
            </div>
        </div>
    )
}

// ============================================================================
// Sub Components
// ============================================================================

function MetricCard({ label, value, ideal, good }: { label: string; value: string; ideal: string; good: boolean }) {
    return (
        <div className="glass-card p-3 space-y-1">
            <p className="text-[10px] text-slate-500">{label}</p>
            <p className={`text-lg font-bold ${good ? 'text-green-400' : 'text-amber-400'}`}>{value}</p>
            <p className="text-[9px] text-slate-600">理想值 {ideal}</p>
        </div>
    )
}
