import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ elderId: string }> }
) {
    const { elderId } = await params
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
                    try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { }
                },
            },
        }
    )

    // 驗證使用者
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: '未登入' }, { status: 401 })
    }

    // 取得長輩資訊
    const { data: elder } = await supabase
        .from('elders')
        .select('*')
        .eq('id', elderId)
        .eq('instructor_id', user.id)
        .single()

    if (!elder) {
        return NextResponse.json({ error: '找不到長輩' }, { status: 404 })
    }

    // 取得指導員資訊
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    // 取得所有分析會話
    const { data: sessions } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('elder_id', elderId)
        .order('created_at', { ascending: true })

    if (!sessions || sessions.length === 0) {
        return NextResponse.json({ error: '無分析紀錄' }, { status: 404 })
    }

    // 建立 Excel 工作簿
    const wb = XLSX.utils.book_new()

    // Sheet 1: 基本資訊
    const infoData = [
        ['長輩姓名', elder.name],
        ['性別', elder.gender === 'female' ? '女' : '男'],
        ['出生日期', elder.birth_date || '--'],
        ['備註', elder.notes || '--'],
        ['指導員', profile?.full_name || '--'],
        ['匯出日期', new Date().toLocaleDateString('zh-TW')],
        ['分析總次數', sessions.length.toString()],
    ]
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
    wsInfo['!cols'] = [{ wch: 15 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, wsInfo, '基本資訊')

    // Sheet 2: 前後測對比
    const preSessions = sessions.filter(s => s.test_type === 'pre')
    const postSessions = sessions.filter(s => s.test_type === 'post')
    const latestPre = preSessions[preSessions.length - 1]
    const latestPost = postSessions[postSessions.length - 1]

    const compHeaders = ['指標', '前測值', '後測值', '變化量', '變化率(%)']
    const comparisonMetrics = [
        { label: '肘關節活動度 (ROM)', pre: latestPre?.avg_elbow_rom, post: latestPost?.avg_elbow_rom, unit: '°' },
        { label: '肩關節活動度', pre: latestPre?.avg_shoulder_rom, post: latestPost?.avg_shoulder_rom, unit: '°' },
        { label: '軀幹傾斜度', pre: latestPre?.avg_trunk_tilt, post: latestPost?.avg_trunk_tilt, unit: '°' },
        { label: '核心穩定性', pre: latestPre?.avg_core_stability, post: latestPost?.avg_core_stability, unit: '°' },
        { label: '肩部角速度', pre: latestPre?.avg_shoulder_velocity, post: latestPost?.avg_shoulder_velocity, unit: '°/s' },
        { label: '肘部角速度', pre: latestPre?.avg_elbow_velocity, post: latestPost?.avg_elbow_velocity, unit: '°/s' },
        { label: '腕部角速度', pre: latestPre?.avg_wrist_velocity, post: latestPost?.avg_wrist_velocity, unit: '°/s' },
        { label: '震顫檢測', pre: latestPre?.tremor_detected ? '是' : '否', post: latestPost?.tremor_detected ? '是' : '否', unit: '' },
        { label: '代償動作', pre: latestPre?.compensation_detected ? '是' : '否', post: latestPost?.compensation_detected ? '是' : '否', unit: '' },
    ]

    const compData = [
        compHeaders,
        ...comparisonMetrics.map(m => {
            const preVal = m.pre ?? '--'
            const postVal = m.post ?? '--'
            let diff = '--'
            let rate = '--'
            if (typeof m.pre === 'number' && typeof m.post === 'number') {
                const d = m.post - m.pre
                diff = `${d > 0 ? '+' : ''}${d.toFixed(1)}${m.unit}`
                rate = m.pre !== 0 ? `${((d / m.pre) * 100).toFixed(1)}%` : '--'
            }
            return [m.label, typeof preVal === 'number' ? `${preVal.toFixed(1)}${m.unit}` : preVal, typeof postVal === 'number' ? `${postVal.toFixed(1)}${m.unit}` : postVal, diff, rate]
        })
    ]
    const wsComp = XLSX.utils.aoa_to_sheet(compData)
    wsComp['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsComp, '前後測對比')

    // Sheet 3: 所有分析紀錄
    const allHeaders = ['日期', '類型', '肘ROM(°)', '肩ROM(°)', '軀幹傾斜(°)', '核心穩定性(°)', '肩速度(°/s)', '肘速度(°/s)', '腕速度(°/s)', '震顫', '代償', '時長(秒)', '備註']
    const allData = [
        allHeaders,
        ...sessions.map(s => [
            new Date(s.created_at).toLocaleDateString('zh-TW'),
            s.test_type === 'pre' ? '前測' : s.test_type === 'post' ? '後測' : '練習',
            s.avg_elbow_rom?.toFixed(1) ?? '--',
            s.avg_shoulder_rom?.toFixed(1) ?? '--',
            s.avg_trunk_tilt?.toFixed(1) ?? '--',
            s.avg_core_stability?.toFixed(1) ?? '--',
            s.avg_shoulder_velocity?.toFixed(1) ?? '--',
            s.avg_elbow_velocity?.toFixed(1) ?? '--',
            s.avg_wrist_velocity?.toFixed(1) ?? '--',
            s.tremor_detected ? '是' : '否',
            s.compensation_detected ? '是' : '否',
            s.duration_seconds?.toString() ?? '--',
            s.notes ?? '',
        ])
    ]
    const wsAll = XLSX.utils.aoa_to_sheet(allData)
    wsAll['!cols'] = allHeaders.map(() => ({ wch: 14 }))
    XLSX.utils.book_append_sheet(wb, wsAll, '所有分析紀錄')

    // 產生 Excel buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(elder.name)}_report.xlsx"`,
        },
    })
}
