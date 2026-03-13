'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Patient } from '@/types/icope'
import type { AssessmentStage } from '@/types/icope'
import { STAGE_LABELS } from '@/types/icope'
import PrimaryAssessmentForm from '@/components/icope/PrimaryAssessmentForm'

export default function NewAssessmentPage() {
    const router = useRouter()
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)

    // 選擇長者的階段
    const [selectedPatientId, setSelectedPatientId] = useState('')
    const [stage, setStage] = useState<AssessmentStage>('initial')
    const [showForm, setShowForm] = useState(false)

    useEffect(() => {
        const fetchPatients = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('patients')
                .select('*')
                .order('name')
            setPatients(data || [])
            setLoading(false)
        }
        fetchPatients()
    }, [])

    const selectedPatient = patients.find(p => p.id === selectedPatientId)

    // 如果已選好長者，顯示初評表單
    if (showForm && selectedPatient) {
        return (
            <div className="max-w-2xl mx-auto">
                <PrimaryAssessmentForm
                    patientId={selectedPatient.id}
                    patientName={selectedPatient.name}
                    stage={stage}
                />
            </div>
        )
    }

    // 選擇長者 & 評估階段
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <button onClick={() => router.push('/icope')} className="text-slate-400 hover:text-white transition-colors text-sm mb-2">
                    ← 返回評估列表
                </button>
                <h1 className="text-2xl font-bold text-white">📋 新增 ICOPE 評估</h1>
            </div>

            <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">選擇評估階段</h2>
                <div className="flex gap-3">
                    {(['initial', 'post'] as AssessmentStage[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setStage(s)}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${stage === s
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            {s === 'initial' ? '📝 初評' : '📊 後測'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">選擇長者</h2>

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : patients.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <p className="text-4xl mb-2">👤</p>
                        <p>尚無長者資料</p>
                        <p className="text-xs mt-1">請先在「ICOPE 評估」列表中新增長者</p>
                    </div>
                ) : (
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                        {patients.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPatientId(p.id)}
                                className={`w-full text-left p-4 rounded-xl transition-all ${selectedPatientId === p.id
                                        ? 'bg-primary-600/20 border-2 border-primary-500/40'
                                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <p className="text-white font-medium">{p.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {p.id_number} · {p.birth_date}
                                    {p.chronic_diseases?.length > 0 && (
                                        <span className="ml-2 text-amber-400/60">
                                            慢性病：{p.chronic_diseases.join('、')}
                                        </span>
                                    )}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={() => setShowForm(true)}
                disabled={!selectedPatientId}
                className="w-full btn-accent text-base py-3.5 disabled:opacity-30"
            >
                開始初評 →
            </button>
        </div>
    )
}
