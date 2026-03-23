'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Save, Loader2, ArrowLeft } from 'lucide-react'

interface EventFormData {
    title: string
    event_date: string
    event_time: string
    location: string
}

interface EventFormProps {
    mode: 'create' | 'edit'
    defaultValues?: EventFormData & { id?: string }
}

export default function EventForm({ mode, defaultValues }: EventFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, formState: { errors } } = useForm<EventFormData>({
        defaultValues: defaultValues || {
            title: '',
            event_date: '',
            event_time: '',
            location: '',
        },
    })

    const onSubmit = async (data: EventFormData) => {
        setLoading(true)
        const supabase = createClient()

        try {
            if (mode === 'create') {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('未登入')

                const { data: event, error } = await supabase
                    .from('events')
                    .insert({
                        title: data.title,
                        event_date: data.event_date,
                        event_time: data.event_time,
                        location: data.location,
                        created_by: user.id,
                    })
                    .select()
                    .single()

                if (error) throw error
                toast.success('活動建立成功！')
                router.push(`/events/${event.id}`)
            } else {
                const { error } = await supabase
                    .from('events')
                    .update({
                        title: data.title,
                        event_date: data.event_date,
                        event_time: data.event_time,
                        location: data.location,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', defaultValues?.id)

                if (error) throw error
                toast.success('活動更新成功！')
                router.push(`/events/${defaultValues?.id}`)
            }
        } catch (err: any) {
            toast.error(err.message || '操作失敗')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    返回
                </button>
                <h1 className="text-2xl font-bold text-slate-800">
                    {mode === 'create' ? '建立新活動' : '編輯活動'}
                </h1>
                <p className="text-slate-500 mt-1">
                    {mode === 'create' ? '填寫以下資訊來建立一個新的簽到活動' : '修改活動資訊'}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                    {/* 活動標題 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            活動標題 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="例如：2026年春季健康促進講座"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                            {...register('title', { required: '請輸入活動標題' })}
                        />
                        {errors.title && (
                            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* 日期 & 時間 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                活動日期 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                                {...register('event_date', { required: '請選擇活動日期' })}
                            />
                            {errors.event_date && (
                                <p className="text-red-500 text-xs mt-1">{errors.event_date.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                活動時間 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                                {...register('event_time', { required: '請選擇活動時間' })}
                            />
                            {errors.event_time && (
                                <p className="text-red-500 text-xs mt-1">{errors.event_time.message}</p>
                            )}
                        </div>
                    </div>

                    {/* 地點 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            活動地點 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="例如：台北市中正區忠孝東路一段 100 號"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                            {...register('location', { required: '請輸入活動地點' })}
                        />
                        {errors.location && (
                            <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all flex items-center gap-2 disabled:opacity-50"
                        style={{ background: 'var(--gradient-primary)' }}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {mode === 'create' ? '建立活動' : '儲存變更'}
                    </button>
                </div>
            </form>
        </div>
    )
}
