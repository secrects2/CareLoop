'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface GuideItem {
    title: string
    icon: string
    content: string[]
}

const guideData: GuideItem[] = [
    {
        title: '登入系統',
        icon: '🔑',
        content: [
            '點擊「使用 Google 帳號登入」按鈕',
            '選擇已授權的 Google 帳號進行登入',
            '首次登入需等待管理員審核啟用帳號',
            '帳號啟用後即可正常使用所有功能',
        ],
    },
    {
        title: '長輩管理',
        icon: '👴',
        content: [
            '進入「長輩管理」頁面，點擊「+ 新增長者」',
            '填寫身分證字號、姓名、性別、出生日期等基本資料',
            '可選填手機號碼、慢性疾病史及備註',
            '長輩列表支援搜尋姓名與身分證字號',
            '點擊長輩卡片可進入詳細資料頁面',
        ],
    },
    {
        title: 'ICOPE 初評流程',
        icon: '📋',
        content: [
            '進入「ICOPE 評估」→ 點擊「+ 新增評估」',
            '選擇要評估的長者（系統會自動判斷可進行初評或後測）',
            '初評包含 6 大面向：認知、行動、營養、視力、聽力、憂鬱',
            '每項面向判斷是否異常（toggle 開關）',
            '提交後，異常項目會自動進入複評量表流程',
            '⚠️ 同一位長者只能進行一次初評',
        ],
    },
    {
        title: 'ICOPE 複評量表',
        icon: '📝',
        content: [
            '初評有異常面向時，系統會自動導向對應的複評量表',
            'AD8 認知量表：0-8 分，≥2 分為異常',
            'SPPB 行動量表：0-12 分，≤8 分為異常（支援 AI 測試）',
            'MNA-SF 營養量表：0-14 分，≤11 分為異常',
            'GDS-15 憂鬱量表：0-15 分，≥5 分為異常',
            '用藥評估及社會照護評估為文字描述',
            '視力與聽力不進入複評流程',
        ],
    },
    {
        title: 'ICOPE 後測',
        icon: '🔄',
        content: [
            '初評完成 3~6 個月後可進行後測',
            '後測時間窗口由系統自動計算並顯示',
            '進入「新增評估」，選擇已初評的長者即可開始後測',
            '後測流程與初評相同（6 大面向 + 複評）',
            '逾期超過 6 個月將無法進行後測',
        ],
    },
    {
        title: '匯出資料',
        icon: '📥',
        content: [
            '長輩詳細頁面可匯出該長輩的所有分析資料（Excel）',
            '管理員可從 ICOPE 頁面匯出報帳資料（CSV）',
            '管理員可從操作紀錄頁面匯出篩選後的紀錄（CSV）',
            '所有匯出檔案支援繁體中文，可直接用 Excel 開啟',
        ],
    },
    {
        title: '活動報到系統',
        icon: '🎟️',
        content: [
            '點擊左側「活動管理」，建立新活動以取得專屬 QR Code',
            '參加者掃描 QR Code 後，可透過 LINE 授權快速簽到',
            '首次參與活動的長者，可於簽到後引導填寫基本資料',
            '主辦單位可即時查看報到人數與名單',
            '支援單鍵同步長輩資料，並可將簽到名單匯出為 Excel 報表',
        ],
    },
    {
        title: '輔具導航精靈',
        icon: '🛟',
        content: [
            '協助門市人員 90 秒判定輔具申請文件及流程',
            '依照長者的戶籍縣市、福利身分及欲購買之輔具回答問題',
            '系統自動判定申請路徑：代辦送件、需醫療評估，或交由總控專員處理',
            '提供對應縣市之「應備文件勾選單」，方便快速核對',
        ],
    },
]

function AccordionItem({ item }: { item: GuideItem }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="border border-[#eee] rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#fafafa] transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-semibold text-[#333] text-sm">{item.title}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#aaa] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="px-4 pb-4 pt-0">
                    <ul className="space-y-2 ml-9">
                        {item.content.map((text, i) => (
                            <li key={i} className="text-sm text-[#555] flex items-start gap-2">
                                <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default function GuidePage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#333]">📖 操作說明</h1>
                <p className="text-[#888] text-sm mt-1">點擊項目展開查看詳細操作步驟</p>
            </div>

            <div className="space-y-3">
                {guideData.map((item, i) => (
                    <AccordionItem key={i} item={item} />
                ))}
            </div>

            <div className="glass-card p-4 text-center">
                <p className="text-xs text-[#aaa]">
                    如有任何問題，請聯繫管理員或至「聯絡我們」頁面取得協助。
                </p>
            </div>
        </div>
    )
}
