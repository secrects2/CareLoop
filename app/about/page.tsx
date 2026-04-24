import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '關於 CareLoop | CareLoop',
    description: 'CareLoop：串聯在地資源與家庭需求的智慧健康中樞',
}

export default function AboutPage() {
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
                        <Link href="/" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">首頁</Link>
                        <Link href="/about" className="text-cl-primary font-semibold border-b-2 border-cl-primary pb-1">關於 CareLoop</Link>
                        <Link href="/#workflow" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">CareLoop 如何運作</Link>
                        <Link href="/#solution" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">解決方案</Link>
                        <Link href="/#partners" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">合作夥伴</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4 font-manrope">
                        <Link href="/login" className="text-cl-primary font-medium hover:opacity-80 transition-opacity">登入</Link>
                        <Link href="/contact" className="bg-cl-primary text-white px-5 py-2 rounded-full font-medium hover:bg-cl-primary-dark active:scale-95 transition-all">立即體驗</Link>
                    </div>

                    <button className="md:hidden text-cl-primary" aria-label="選單">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </header>

            <main className="pt-20">
                {/* Hero Section */}
                <section className="py-20 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-white to-cl-tertiary"></div>
                    <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none rounded-l-full bg-cl-primary blur-3xl"></div>
                    <div className="max-w-[1200px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col gap-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cl-tertiary text-cl-primary w-fit font-semibold text-xs tracking-wider uppercase">
                                <span className="material-symbols-outlined text-sm">favorite</span>
                                <span>About CareLoop</span>
                            </div>
                            <h1 className="font-manrope text-4xl md:text-[48px] leading-[1.2] font-bold text-cl-secondary">
                                CareLoop：串聯在地資源與家庭需求的智慧健康中樞
                            </h1>
                            <p className="font-manrope text-lg text-cl-secondary/70 max-w-2xl leading-relaxed">
                                我們致力於打破場域邊界，將專業檢測、AI 分析與在地資源深度整合。以長輩需求為核心，建立一套透明且連續的照護鏈，為每一個家庭提供最精準的健康決策。
                            </p>
                            <div className="flex items-center gap-4 pt-4">
                                <Link href="/#solution" className="bg-cl-primary text-white px-8 py-3 rounded-full font-semibold text-sm tracking-wider hover:bg-cl-primary-dark transition-colors shadow-sm">
                                    了解更多
                                </Link>
                            </div>
                        </div>
                        <div className="relative h-[500px] rounded-xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(31,183,183,0.12)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="About CareLoop" className="absolute inset-0 w-full h-full object-cover" src="/images/about-hero.png" />
                        </div>
                    </div>
                </section>

                {/* Why CareLoop (Problem) */}
                <section className="py-20 px-6 bg-cl-tertiary border-y border-cl-neutral">
                    <div className="max-w-[1000px] mx-auto text-center flex flex-col gap-6">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary">
                            我們洞察的，不只是健康指標，更是照護體系間的服務斷點
                        </h2>
                        <p className="font-manrope text-lg text-cl-secondary/70 mx-auto max-w-3xl leading-relaxed">
                            在現有的醫療與長照體系中，資源往往是零碎的。家庭常常面臨不知道從何開始、找不到合適資源，或者在不同服務之間奔波的困境。我們看見了這個斷層，並決心填補它。
                        </p>
                    </div>
                    <div className="max-w-[1200px] mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-xl border border-cl-neutral shadow-sm flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">數據孤島化</h3>
                            <p className="font-manrope text-base text-cl-secondary/70">缺乏有效的數據整合，使決策者難以精準判斷家庭的真實需求。</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl border border-cl-neutral shadow-sm flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">account_tree</span>
                            </div>
                            <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">服務鏈路摩擦</h3>
                            <p className="font-manrope text-base text-cl-secondary/70">評估與轉介間缺乏自動化銜接，導致服務熱度在流轉中消逝。</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl border border-cl-neutral shadow-sm flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">group_off</span>
                            </div>
                            <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">照護關係斷鏈</h3>
                            <p className="font-manrope text-base text-cl-secondary/70">單次接觸後缺乏長效追蹤機制，無法即時應對健康狀況的動態變化。</p>
                        </div>
                    </div>
                </section>

                {/* What is CareLoop (Solution) */}
                <section className="py-20 px-6 bg-white">
                    <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-12 items-center">
                        <div className="w-full lg:w-1/2 relative h-[400px] rounded-xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(31,183,183,0.12)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="CareLoop Interface" className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUkWeuQzD_erzOUYzN3IudE8zeRw6RFWSok87EpFfwFsczs777neUBcYdmC-BFf9YYAxL9TCY29wZu5QGGC3Qtq-23V_WaYxSxU_GIH1UUzmiLeH6FJbt3Gz72Ds3DWppL_2Fl0bfbguoKz-_Opqb8c69cDcScc2eyzQR1BxyAZhZv42ZYEUx7oS53Z1oDSDofCsql8qDQIcyj5hosvbdW9p_4_HU4IgI_5db4QzVuMvlPyK2N1iIRhNt2Sz3Sri60B-CrqOzsVpz9" />
                        </div>
                        <div className="w-full lg:w-1/2 flex flex-col gap-6">
                            <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary">
                                超越單點工具：CareLoop 是全週期的健康賦能生態系
                            </h2>
                            <p className="font-manrope text-lg text-cl-secondary/70 leading-relaxed">
                                它是一套具備高度擴充性的平台系統，整合了繁瑣的跨領域資源。我們讓服務與科技溫柔接軌，賦能夥伴成為主角，驅動更具連續性與溫度的高齡照護體系。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Differentiation */}
                <section className="py-20 px-6 bg-cl-tertiary border-t border-cl-neutral">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary">
                                打破評估與轉介的藩籬，打造一站式的服務閉環
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col items-center text-center gap-4 p-6 bg-white rounded-xl border border-cl-neutral shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-cl-primary/10 text-cl-primary flex items-center justify-center mb-2">
                                    <span className="material-symbols-outlined text-3xl">visibility</span>
                                </div>
                                <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">深度需求洞察</h3>
                                <p className="font-manrope text-base text-cl-secondary/70">透過數據透視表徵，深入理解長輩的健康核心痛點。</p>
                            </div>
                            <div className="flex flex-col items-center text-center gap-4 p-6 bg-white rounded-xl border border-cl-neutral shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-cl-primary/10 text-cl-primary flex items-center justify-center mb-2">
                                    <span className="material-symbols-outlined text-3xl">diversity_3</span>
                                </div>
                                <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">跨域資源協作</h3>
                                <p className="font-manrope text-base text-cl-secondary/70">整合醫、養、健、助多元領域，提供多維度的解決方案。</p>
                            </div>
                            <div className="flex flex-col items-center text-center gap-4 p-6 bg-white rounded-xl border border-cl-neutral shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-cl-primary/10 text-cl-primary flex items-center justify-center mb-2">
                                    <span className="material-symbols-outlined text-3xl">handshake</span>
                                </div>
                                <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">戰略技術賦能</h3>
                                <p className="font-manrope text-base text-cl-secondary/70">我們不僅提供平台，更提供專業的後援諮詢與技術引導。</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Pillars */}
                <section className="py-20 px-6 bg-white">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary mb-4">
                                CareLoop 由五個核心部分組成
                            </h2>
                            <p className="font-manrope text-lg text-cl-secondary/70 max-w-2xl mx-auto">
                                這五個支柱相互連結，構成完整的健康服務迴圈。
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { num: '01', title: '數位化健康評估', desc: '數位化評估工具，精準掌握健康現況' },
                                { num: '02', title: '智慧型 AI 分析', desc: '預判風險趨勢，提供科學化的個人照護建議' },
                                { num: '03', title: '專業 Health Coach', desc: '提供一對一專家引導，落實健康行為的轉變' },
                                { num: '04', title: '精準資源整合', desc: '高效媒合社區與機構，打破服務與物資的供給邊界' },
                            ].map((p) => (
                                <div key={p.num} className="bg-cl-tertiary p-8 rounded-xl border border-cl-neutral shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-cl-primary font-manrope text-[48px] font-bold opacity-30 mb-2">{p.num}</div>
                                    <h3 className="font-manrope text-2xl font-semibold text-cl-secondary mb-3">{p.title}</h3>
                                    <p className="font-manrope text-base text-cl-secondary/70">{p.desc}</p>
                                </div>
                            ))}
                            <div className="bg-cl-tertiary p-8 rounded-xl border border-cl-neutral shadow-sm hover:shadow-md transition-shadow lg:col-span-2 xl:col-span-1">
                                <div className="text-cl-primary font-manrope text-[48px] font-bold opacity-30 mb-2">05</div>
                                <h3 className="font-manrope text-2xl font-semibold text-cl-secondary mb-3">長效持續追蹤</h3>
                                <p className="font-manrope text-base text-cl-secondary/70">建立數據反饋機制，讓健康守護不因場域轉換而中斷</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Future Impact & Final CTA */}
                <section className="py-20 px-6 bg-cl-tertiary border-y border-cl-neutral text-center">
                    <div className="max-w-[800px] mx-auto flex flex-col gap-6">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-primary">
                            賦能第一線服務效能，引領家庭重拾健康節奏
                        </h2>
                        <div className="bg-white p-8 rounded-2xl mt-8 border border-cl-neutral shadow-[0_4px_24px_-4px_rgba(31,183,183,0.08)]">
                            <h3 className="font-manrope text-2xl font-semibold text-cl-secondary mb-6">想了解 CareLoop 如何導入你的場域？</h3>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/contact" className="bg-cl-primary text-white px-8 py-3 rounded-full font-semibold text-sm tracking-wider hover:bg-cl-primary-dark transition-colors shadow-sm">
                                    預約專家解決方案
                                </Link>
                                <Link href="/contact" className="border-2 border-cl-primary text-cl-primary px-8 py-3 rounded-full font-semibold text-sm tracking-wider hover:bg-cl-tertiary transition-colors">
                                    與我們開啟對話
                                </Link>
                            </div>
                        </div>
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
                        <a href="#" className="hover:text-cl-primary transition-colors hover:underline decoration-cl-primary underline-offset-4">聯絡我們</a>
                        <a href="#" className="hover:text-cl-primary transition-colors hover:underline decoration-cl-primary underline-offset-4">隱私政策</a>
                        <a href="#" className="hover:text-cl-primary transition-colors hover:underline decoration-cl-primary underline-offset-4">服務條款</a>
                        <a href="#" className="hover:text-cl-primary transition-colors hover:underline decoration-cl-primary underline-offset-4">常見問題</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
