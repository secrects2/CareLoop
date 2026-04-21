'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssessmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchDetail = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('assessments')
                .select(`
                    *,
                    patients(name, id_number, gender, birth_date),
                    primary_assessments(*),
                    secondary_assessments(*)
                `)
                .eq('id', id)
                .single();

            if (error) {
                toast.error('找不到該筆評估資料');
                router.push('/icope');
            } else {
                setAssessment(data);
            }
            setLoading(false);
        };

        fetchDetail();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!assessment) return null;

    const patient = assessment.patients;
    const primary = assessment.primary_assessments;
    const secondary = assessment.secondary_assessments;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <button onClick={() => router.push('/icope')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> 返回評估列表
                </button>
                <h1 className="text-2xl font-bold text-slate-800">
                    評估紀錄詳情
                </h1>
                <p className="text-slate-500 text-sm mt-1">紀錄編號：{id.slice(0, 8)}</p>
            </div>

            <div className="glass-card p-6 border-t-4 border-t-teal-500">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">長者基本資料</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-slate-400">姓名</p>
                        <p className="font-semibold text-slate-800 text-lg">{patient?.name}</p>
                    </div>
                    <div>
                        <p className="text-slate-400">階段</p>
                        <p className="font-semibold text-slate-800">
                            {assessment.stage === 'initial' ? '初評' : '後測'}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400">評估日期</p>
                        <p className="font-semibold text-slate-800">
                            {new Date(assessment.assessed_at).toLocaleDateString('zh-TW')}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400">性別</p>
                        <p className="font-semibold text-slate-800">
                            {patient?.gender === 'female' ? '女' : '男'}
                        </p>
                    </div>
                </div>
            </div>

            {primary && (
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">初評 6 大面向 (異常項目標紅)</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ResultCard label="認知功能" isAbnormal={primary.cognition} icon="🧠" />
                        <ResultCard label="行動能力" isAbnormal={primary.mobility} icon="🦿" />
                        <ResultCard label="營養狀態" isAbnormal={primary.nutrition} icon="🍎" />
                        <ResultCard label="視力" isAbnormal={primary.vision} icon="👁️" />
                        <ResultCard label="聽力" isAbnormal={primary.hearing} icon="👂" />
                        <ResultCard label="憂鬱" isAbnormal={primary.depression} icon="💭" />
                    </div>
                </div>
            )}

            {secondary && secondary.length > 0 && (
                <div className="glass-card p-6 border-t-4 border-t-amber-400">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">複評任務結果</h2>
                    <div className="space-y-3">
                        {secondary.map((sec: any) => (
                            <div key={sec.id} className="bg-slate-50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-700">{sec.task_type}</p>
                                    <p className="text-xs text-slate-400">完成時間：{new Date(sec.completed_at).toLocaleString('zh-TW')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-emerald-600">分數: {sec.score}</p>
                                    <p className="text-sm text-slate-500">{sec.result_summary || '無紀錄'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ResultCard({ label, isAbnormal, icon }: { label: string, isAbnormal: boolean, icon: string }) {
    return (
        <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${isAbnormal ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <span className="text-2xl">{icon}</span>
            <div>
                <p className="font-bold text-sm">{label}</p>
                <p className="text-xs opacity-80">{isAbnormal ? '異常 ⚠️' : '正常 ✓'}</p>
            </div>
        </div>
    );
}
