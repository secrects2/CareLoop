import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'CareLoop | 讓每一個在地據點，成為家庭健康的起點',
    description: 'CareLoop 透過數位化技術，將 AI 分析、專業衛教與在地資源深度鏈結，協助合作夥伴打破服務邊界，將片段的接觸轉化為連續性的照護網。',
}

/* ── six pillars data ── */
const pillars = [
    { icon: 'monitor_heart', title: '精準數據採集', desc: '數位化評估工具，標準化掌握個案健康現況。', image: '/images/pillar-1.png' },
    { icon: 'psychology', title: '智慧風險評估', desc: '運用數據模組預判風險，提供科學化的照護建議。', image: '/images/pillar-2.png' },
    { icon: 'edit_calendar', title: '客製化方案設計', desc: '協助第一線人員根據需求，快速制定適配的介入計畫。', image: '/images/pillar-3.png' },
    { icon: 'handshake', title: '高效生態鏈結', desc: '跨場域媒合醫療、社福與運動資源，擴大服務邊界。', image: '/images/pillar-4.png' },
    { icon: 'local_shipping', title: '精準物資配送', desc: '串聯供應鏈，確保健康商品與營養包精準送達家庭。', image: '/images/pillar-5.png' },
    { icon: 'update', title: '長效動態管理', desc: '建立數據反饋閉環，確保服務成效並提升客戶黏著度。', image: '/images/pillar-6.png' },
]

const steps = [
    { num: '1', title: '啟動數位轉型', desc: '精準需求診斷與資料建置，建立個案數位檔案。' },
    { num: '2', title: '驅動專業決策', desc: '透過 AI 判讀提供專業建議，輔助產出個人化方案。' },
    { num: '3', title: '完成服務閉環', desc: '媒合資源與後續追蹤，確保健康支持持續發生。' },
]

const audiences = [
    {
        title: '藥局與在地據點',
        desc: '擴展服務邊界，成為社區健康的第一線守門員。',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAt1tA5Td5jNCwfTnf99LHFV_oWkVPTbgFKDX0XtbrqsTiyk5tsbhTLqteSU4jlMqLB192UGQf5qvKyYVYpa9xLyw_7VzdfPtSqLN7z5RTf-OXE3Blrap3Fghm_f4It_Ip2lsMZxc7TlQlhDtBpmGMlIdxjqD87n6G-aMcjBGhj27jL6OGa9nJrMY233CZw3h3zuzmPt7ievAccSkszu3g2X0ODuNI06Iz3p0TAa_IE4PTa5ABotv4EVjnP6s1lnBbDbhw5mbfqYxN',
    },
    {
        title: '醫療與社福單位',
        desc: '接收精準轉介，提升醫療資源配置效率。',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6bSwU7nc1k_pXPAD86eYOM3OkY6ta4e2yj5w_I8pFRVFXF2FKIZRCuRcPTJMsIijaFvdKUwahy1rRKp4bt4--uC2nrcY_Iz3bdd4TK_Er9RR_NJeu4yzoplUP1_0pxqitVyeZPO4xY7o_rQq-eaaE-3gBVPvNOx-9nLyM2GfyD1zctCGhwV1NVw5RR6oKLz9fd7de5c_vY_3gyNWzIq4snt7WhvU2HiRaTUY03Y4pRK-TELXimTdQAxuBO8yfTr2s0CGnPeymRE1L',
    },
    {
        title: '家庭與高齡長者',
        desc: '獲得即時、有溫度的連續性健康支持與陪伴。',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEvsOo7q-FI_hFJ5ulAB1RMIfNqZRc61O4VxZODtEe0wpjY8f5XD0XB-jod4u7OvU-dnBS0jRA7Rhx_n02mzHQ1TtpvliVUs068TRVHr8zdfAPzJ26FUrMDaXwoIPwkrmU3CriZza4FOfnkEYZ69SIN3kgJxQuv29qzs9KiVYxP1IQthkbbhKvqKavp0yrgyGmsEFDb_lUhhuuk8JJWdrQgqcOcAIWvu9KoWmWNCwk7WZv5Ms7z-5IPpvtBxKoMOmc8lFGufwVV2wj',
    },
]

const impacts = [
    { value: '250人/年', label: 'Health Coach 培育目標' },
    { value: '7,500人/年', label: '預計年度受益人數' },
    { value: '1套', label: '全方位樂齡數位平台' },
]

export default function LandingPage() {
    return (
        <div className="bg-white text-cl-secondary antialiased selection:bg-cl-primary/20 selection:text-cl-secondary">
            {/* ── TopNav ── */}
            <header className="fixed top-0 w-full z-50 border-b border-cl-neutral bg-white/90 backdrop-blur-md">
                <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
                    <Link href="/" className="text-2xl font-bold text-cl-primary font-manrope cursor-pointer flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-cl-primary">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        CareLoop
                    </Link>

                    <nav className="hidden md:flex gap-8 items-center font-manrope text-sm">
                        <Link href="/" className="text-cl-primary font-semibold border-b-2 border-cl-primary pb-1">首頁</Link>
                        <Link href="/about" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">關於 CareLoop</Link>
                        <Link href="/workflow" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">CareLoop 如何運作</Link>
                        <Link href="/solution" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">解決方案</Link>
                        <Link href="/partners" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">合作夥伴</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4 font-manrope">
                        <Link href="/login" className="text-cl-primary font-medium hover:opacity-80 transition-opacity">登入</Link>
                        <Link href="/contact" className="bg-cl-primary text-white px-5 py-2 rounded-full font-medium hover:bg-cl-primary-dark active:scale-95 transition-all">立即體驗</Link>
                    </div>

                    {/* Mobile menu button */}
                    <button className="md:hidden text-cl-primary" aria-label="選單">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-20">
                {/* ── 1. Hero ── */}
                <section className="max-w-[1200px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="flex flex-col gap-6 bg-cl-tertiary/40 backdrop-blur-sm p-6 rounded-2xl">
                        <div className="inline-flex items-center gap-2 bg-cl-tertiary text-cl-primary text-xs font-semibold tracking-wider px-4 py-2 rounded-full w-fit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            高質量的家庭健康起點
                        </div>

                        <h1 className="font-manrope text-4xl md:text-[48px] leading-[1.2] font-bold tracking-tight text-cl-secondary">
                            賦能在地據點，建構家庭健康支持的核心中樞
                        </h1>

                        <p className="font-manrope text-lg leading-relaxed text-cl-secondary/70">
                            CareLoop 透過數位化技術，將 AI 分析、專業衛教與在地資源深度鏈結。我們協助合作夥伴打破服務邊界，將片段的接觸轉化為連續性的照護網，讓健康守護真正落地。
                        </p>

                        <p className="font-manrope text-base text-cl-secondary/60 border-l-2 border-cl-primary pl-4">
                            從健康評估、需求判讀，到服務安排與後續追蹤，讓健康支持真正走進社區與家庭。
                        </p>

                        <div className="flex flex-wrap gap-4 mt-4">
                            <a href="#solution" className="bg-cl-primary text-white font-semibold text-sm tracking-wider px-8 py-4 rounded-full shadow-sm hover:-translate-y-0.5 hover:bg-cl-primary-dark transition-all">
                                看見生態系價值
                            </a>
                            <a href="#cta" className="border-2 border-cl-primary text-cl-primary font-semibold text-sm tracking-wider px-8 py-4 rounded-full hover:bg-cl-tertiary transition-colors">
                                立即預約專家諮詢
                            </a>
                        </div>
                    </div>

                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(31,183,183,0.12)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            alt="快樂的長者在陽光公園散步"
                            className="object-cover w-full h-full"
                            src="/images/hero.png"
                        />
                    </div>
                </section>

                {/* ── 2. Problem ── */}
                <section className="bg-cl-tertiary py-20 border-y border-cl-neutral" id="problem">
                    <div className="max-w-[800px] mx-auto px-6 text-center flex flex-col gap-6">
                        <svg className="w-12 h-12 mx-auto text-cl-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>

                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold tracking-tight text-cl-secondary">
                            打破資源孤島：讓碎片化的服務<br className="hidden sm:block" />轉化為高效的健康網絡
                        </h2>

                        <p className="font-manrope text-lg leading-relaxed text-cl-secondary/70">
                            台灣照護現場的挑戰，往往不在於資源不足，而在於「缺乏銜接」。
                            CareLoop 致力於整合醫療、社區與生活供應鏈，解決資訊不對稱與服務斷點。
                            透過數據驅動的分工，讓社區夥伴能更早預判需求，達成資源配置的最佳化。
                        </p>
                    </div>
                </section>

                {/* ── 3. Six Pillars (Bento Grid) ── */}
                <section className="max-w-[1200px] mx-auto px-6 py-20" id="solution">
                    <div className="mb-12">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold tracking-tight text-cl-secondary mb-3">
                            CareLoop 是一套整合在地場域與家庭需求的健康服務平台
                        </h2>
                        <p className="font-manrope text-lg text-cl-secondary/70">涵蓋六大核心支柱，提供全方位的健康解決方案。</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pillars.map((p) => (
                            <div key={p.icon} className="bg-white p-6 rounded-xl shadow-[0_4px_24px_-4px_rgba(31,183,183,0.08)] border border-cl-neutral flex flex-col gap-3 hover:-translate-y-1 transition-transform overflow-hidden">
                                <div className="w-12 h-12 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary shrink-0">
                                    <span className="material-symbols-outlined">{p.icon}</span>
                                </div>
                                <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">{p.title}</h3>
                                <p className="font-manrope text-base text-cl-secondary/70 mb-4">{p.desc}</p>
                                <div className="w-full flex-grow flex items-end justify-center bg-slate-50/50 rounded-lg pt-4 mt-auto">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.image} alt={p.title} className="w-auto h-[280px] object-contain drop-shadow-sm rounded-t-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 4. How it Works ── */}
                <section className="bg-cl-tertiary py-20" id="workflow">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold tracking-tight text-cl-secondary mb-12 text-center">
                            三個步驟，讓健康服務更容易落地
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {steps.map((s) => (
                                <div key={s.num} className="bg-white p-6 rounded-xl shadow-[0_4px_24px_-4px_rgba(31,183,183,0.08)] flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-cl-primary text-white font-manrope text-2xl font-semibold flex items-center justify-center mb-4">
                                        {s.num}
                                    </div>
                                    <h3 className="font-manrope text-2xl font-semibold text-cl-secondary mb-2">{s.title}</h3>
                                    <p className="font-manrope text-base text-cl-secondary/70">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 5. Target Audience ── */}
                <section className="max-w-[1200px] mx-auto px-6 py-20" id="partners">
                    <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold tracking-tight text-cl-secondary mb-12 text-center">
                        一套平台，串起在地場域與家庭照顧需求
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {audiences.map((a) => (
                            <div key={a.title} className="flex flex-col gap-3 group">
                                <div className="w-full aspect-video rounded-lg overflow-hidden bg-cl-tertiary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={a.img} />
                                </div>
                                <h3 className="font-manrope text-2xl font-semibold text-cl-secondary mt-2">{a.title}</h3>
                                <p className="font-manrope text-base text-cl-secondary/70">{a.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 6. Impact ── */}
                <section className="bg-cl-primary text-white py-20" id="impact">
                    <div className="max-w-[1200px] mx-auto px-6 text-center">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold mb-12">
                            從被動照顧，走向更主動的健康支持
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/20">
                            {impacts.map((i) => (
                                <div key={i.label} className="flex flex-col gap-2 py-4 md:py-0">
                                    <div className="font-manrope text-[48px] leading-[1.2] font-bold tracking-tight">{i.value}</div>
                                    <div className="font-manrope text-lg text-white/80">{i.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 7. Final CTA ── */}
                <section className="max-w-[800px] mx-auto px-6 py-20 text-center flex flex-col gap-6 items-center" id="cta">
                    <h2 className="font-manrope text-4xl md:text-[48px] leading-[1.2] font-bold tracking-tight text-cl-secondary">
                        把你的場域，變成家庭健康的起點
                    </h2>
                    <p className="font-manrope text-lg text-cl-secondary/70 mb-4">
                        無論您是社區藥局、健身房還是地區診所，加入 CareLoop 網絡，共同打造全方位的健康支持體系。
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/contact" className="bg-cl-primary text-white font-semibold text-sm tracking-wider px-8 py-4 rounded-full shadow-sm hover:shadow-md hover:bg-cl-primary-dark transition-all">
                            預約專家解決方案
                        </Link>
                        <Link href="/contact" className="border-2 border-cl-primary text-cl-primary font-semibold text-sm tracking-wider px-8 py-4 rounded-full hover:bg-cl-tertiary transition-colors">
                            與我們開啟對話
                        </Link>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="w-full border-t border-cl-neutral bg-cl-tertiary">
                <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="flex flex-col gap-4">
                        <span className="text-xl font-extrabold text-cl-secondary font-manrope">CareLoop</span>
                        <p className="text-sm text-cl-secondary/50 font-manrope">© 2026 CareLoop Taiwan.</p>
                        <p className="text-sm text-cl-secondary/50 font-manrope mt-2">CareLoop 讓健康不只是被看見，也能被接住、被安排，並持續陪伴。</p>
                    </div>
                    <div className="flex flex-wrap gap-6 md:justify-end text-sm text-cl-secondary/50 font-manrope">
                        <Link href="/contact" className="hover:text-cl-primary transition-colors hover:underline decoration-cl-primary underline-offset-4">聯絡我們</Link>
                        <a href="#" className="hover:text-cl-primary transition-colors hover:underline decoration-cl-primary underline-offset-4">隱私政策</a>
                        <a href="#" className="hover:text-cl-primary transition-colors hover:underline decoration-cl-primary underline-offset-4">服務條款</a>
                        <a href="#" className="hover:text-cl-primary transition-colors hover:underline decoration-cl-primary underline-offset-4">常見問題</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
