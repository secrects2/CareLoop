import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'CareLoop 如何運作 | CareLoop',
    description: '把健康評估、服務安排與後續追蹤，整理成更清楚的路徑',
}

export default function WorkflowPage() {
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
                        <Link href="/about" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">關於 CareLoop</Link>
                        <Link href="/workflow" className="text-cl-primary font-semibold border-b-2 border-cl-primary pb-1">CareLoop 如何運作</Link>
                        <Link href="/solution" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">解決方案</Link>
                        <Link href="/partners" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">合作夥伴</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4 font-manrope">
                        <Link href="/login" className="text-cl-primary font-medium hover:opacity-80 transition-opacity">登入</Link>
                        <Link href="/contact" className="bg-cl-primary text-white px-5 py-2 rounded-full font-medium hover:bg-cl-primary-dark active:scale-95 transition-all">立即諮詢</Link>
                    </div>

                    <button className="md:hidden text-cl-primary" aria-label="選單">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="w-full max-w-[1280px] mx-auto px-8 pt-32 pb-20 flex-grow flex flex-col gap-20">
                {/* Hero Section */}
                <section className="flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2 flex flex-col gap-6">
                        <span className="bg-cl-tertiary text-cl-secondary font-semibold text-xs rounded-full px-4 py-2 w-max tracking-wider">
                            CareLoop 如何運作
                        </span>
                        <h1 className="font-manrope text-4xl md:text-[48px] leading-[1.2] font-bold text-cl-primary">
                            把健康評估、服務安排與後續追蹤，整理成更清楚的路徑
                        </h1>
                        <p className="font-manrope text-lg text-cl-secondary/70 leading-relaxed">
                            CareLoop 透過健康資料整理、需求判讀，將複雜的健康照護流程簡化為清晰可執行的步驟，讓每一步都精準對接所需資源。
                        </p>
                    </div>
                    <div className="w-full md:w-1/2 rounded-xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(31,183,183,0.12)] border border-cl-neutral">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="healthcare professional" className="w-full h-auto object-cover aspect-[4/3]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvsUM9jsbrdmhI57UVCHcd_Mie8pC1juRTr-RqMbAW4USrtnEFGahcrylQ6yoKJM7IADezUFz9n2tnt33Wl85yYnLxdFaj7h_yxywOE8lFwC_GMUpLFgN3ZUkqr-BygZ1RJX0Zgdku-sXpJr7d6Wemj2IucFYQ6MdMFXcMjVdz_yu7P3VREzCXA3autcUVhd0mQ9yq-XUwpo9gRAhzDkLPCtk4QfQEwy_KbM6-ycHWjaGXWDn4knnBSH4OmJt1TIacz2twJK8TBgPn" />
                    </div>
                </section>

                {/* Overall Explanation */}
                <section className="flex flex-col gap-6 bg-cl-tertiary/40 p-8 rounded-xl border border-cl-neutral shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-cl-primary text-3xl">route</span>
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-primary">
                            從看見需求，到安排資源，再到持續追蹤
                        </h2>
                    </div>
                    <p className="font-manrope text-lg text-cl-secondary/70 leading-relaxed">
                        CareLoop 將零散的健康數據整合，從初期的健康狀況評估開始，精準判讀需求，進而安排最合適的支持服務，並透過系統化追蹤確保成效，形成完整的照護迴圈。
                    </p>
                </section>

                {/* Three Steps Bento Grid */}
                <section className="flex flex-col gap-12">
                    <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-center text-cl-primary">
                        CareLoop 的三個運作步驟
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Step 1 */}
                        <div className="bg-white rounded-xl p-8 flex flex-col gap-4 border border-cl-neutral shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary font-manrope text-2xl font-bold">1</div>
                            <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">健康評估與資料整理</h3>
                            <p className="font-manrope text-base text-cl-secondary/70 flex-grow">透過數位健康檢測或 ICOPE 評估，系統化收集並整理個人健康數據，建立完整的健康檔案。</p>
                            <div className="rounded-lg overflow-hidden mt-auto pt-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="assessment" className="w-full h-auto object-cover aspect-video" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr32eCk4As_9gKN3dHq5ewnsUVoMZR49g9jWTxf27vj_mhuqmGnWb1Pvhvu7oozQ85l7E6eurEklQgf8G9dK0K9TtQ6pwiB6k-Jb_zXJ74WLT2OPGCJax2qWUPyH8Gqici0MwyilaakvwnVzfJaZx9lA8Qr3RD1W5GEx4MWBVye9LK0hvtDIH9TgUKrRMMUIUD0F_88Nn6yBxkiSlqjigwCXZim5aQJBQbBn95fomLFBFWe5Q3ZATLoN7QJAjSceMfpfgVYlpS05g7" />
                            </div>
                        </div>
                        {/* Step 2 */}
                        <div className="bg-white rounded-xl p-8 flex flex-col gap-4 border border-cl-neutral shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary font-manrope text-2xl font-bold">2</div>
                            <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">需求判讀與服務建議</h3>
                            <p className="font-manrope text-base text-cl-secondary/70 flex-grow">AI 輔助分析健康報表，由 Health Coach 專業解說數據，將複雜資訊轉化為具體的照護建議。</p>
                            <div className="rounded-lg overflow-hidden mt-auto pt-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="report explanation" className="w-full h-auto object-cover aspect-video" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7LLEeZryOCO6BCLL0WnIrTJKavnctudxHzSw4XR6P67Iig91fu9RWpNZTtsqV-3PgLB7cmPf9Tt8qne_0xhNug-C8JjNTt4mNAEXC1Z9_L09QKCRdzUR5kDkBX7FpivJxXxpP7_ZVEHrgyNComQOyWQsf6c27kB68nzIKuEpqR-PvedDT5RlfBSMum8mpSDb4DB_TmFKP0z0r4ZHxJP32Gla6-OW8U-EAIOJ_-3j9CmJUlKBS1YT7QOMdAcE1HGInSsumm6iwMdi8" />
                            </div>
                        </div>
                        {/* Step 3 */}
                        <div className="bg-white rounded-xl p-8 flex flex-col gap-4 border border-cl-neutral shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary font-manrope text-2xl font-bold">3</div>
                            <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">資源媒合與持續追蹤</h3>
                            <p className="font-manrope text-base text-cl-secondary/70 flex-grow">根據判讀結果，精準媒合適合的健康課程、輔具商品或長照服務，並持續追蹤後續進展。</p>
                            <div className="rounded-lg overflow-hidden mt-auto pt-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="rehabilitation" className="w-full h-auto object-cover aspect-video" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvTEuUI1AjqxGTtIuaK6_M0gnMVERiHL1odDyhL2466Mj2vVIvheIf1lsqOcZ0pxesPgpSVP3clxtglNk4U_8r8xHhslmhHG0yO54POw1sPrcchhCazD6wPuhHegy8nw8bt_rE8Pcw3_esptRC-5LCDQh8GWc00hx58cQQWCzvo1NN-hA5UgR_rVyYZ2hlRIiKVwarb8qbK4msMwDXoS1Fy61QHVLsNGwFNqM0If5bwC1bFGsHo0zAvC1Cx-dYwz39Z15SBGVEYCQR" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CareLoop Roles */}
                <section className="flex flex-col gap-6 bg-cl-tertiary p-8 rounded-xl border border-cl-neutral shadow-sm">
                    <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-primary mb-4">
                        CareLoop 不取代既有服務，而是協助不同資源更順暢地接在一起
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary shrink-0 mt-1">
                                <span className="material-symbols-outlined">business</span>
                            </div>
                            <div>
                                <h4 className="font-manrope text-lg font-semibold text-cl-secondary">場域端 (診所/社區)</h4>
                                <p className="font-manrope text-base text-cl-secondary/70 mt-1">提供標準化評估工具，減輕第一線人員負擔，提升服務效率。</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary shrink-0 mt-1">
                                <span className="material-symbols-outlined">home</span>
                            </div>
                            <div>
                                <h4 className="font-manrope text-lg font-semibold text-cl-secondary">家庭端 (個案/家屬)</h4>
                                <p className="font-manrope text-base text-cl-secondary/70 mt-1">獲得清晰的健康圖像與具體的後續建議，不再對照護方向感到迷惘。</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary shrink-0 mt-1">
                                <span className="material-symbols-outlined">handshake</span>
                            </div>
                            <div>
                                <h4 className="font-manrope text-lg font-semibold text-cl-secondary">合作單位 (服務提供者)</h4>
                                <p className="font-manrope text-base text-cl-secondary/70 mt-1">精準獲得需求明確的個案，提升服務媒合的成功率與滿意度。</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary shrink-0 mt-1">
                                <span className="material-symbols-outlined">shopping_bag</span>
                            </div>
                            <div>
                                <h4 className="font-manrope text-lg font-semibold text-cl-secondary">商品支持 (輔具/營養品)</h4>
                                <p className="font-manrope text-base text-cl-secondary/70 mt-1">基於數據分析推薦最適合的商品，確保資源投入在刀口上。</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Help for Fields and Families */}
                <section className="flex flex-col gap-12">
                    <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-center text-cl-primary">
                        讓第一線更有方法，也讓家庭更有方向
                    </h2>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Field Side */}
                        <div className="w-full md:w-5/12 bg-cl-primary/5 p-8 rounded-xl border border-cl-primary/20">
                            <h3 className="font-manrope text-2xl font-semibold text-cl-primary mb-6 flex items-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-cl-primary">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg> 對場域
                            </h3>
                            <ul className="space-y-4 font-manrope text-base text-cl-secondary/80">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary text-xl mt-0.5">check_circle</span>
                                    <span>數位化評估流程，減少紙本作業時間。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary text-xl mt-0.5">check_circle</span>
                                    <span>即時產出視覺化報表，方便向家屬說明。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary text-xl mt-0.5">check_circle</span>
                                    <span>系統化個案管理，追蹤後續服務成效更容易。</span>
                                </li>
                            </ul>
                        </div>
                        {/* Spacer / Connector */}
                        <div className="hidden md:flex w-2/12 items-center justify-center">
                            <div className="w-full h-px bg-cl-neutral relative">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-cl-neutral rounded-full p-2 text-cl-primary">
                                    <span className="material-symbols-outlined">sync</span>
                                </div>
                            </div>
                        </div>
                        {/* Family Side */}
                        <div className="w-full md:w-5/12 bg-cl-secondary/5 p-8 rounded-xl border border-cl-secondary/10">
                            <h3 className="font-manrope text-2xl font-semibold text-cl-secondary mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-2xl">family_home</span> 對家庭
                            </h3>
                            <ul className="space-y-4 font-manrope text-base text-cl-secondary/80">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-secondary text-xl mt-0.5">check_circle</span>
                                    <span>獲得清楚易懂的個人健康風險分析報告。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-secondary text-xl mt-0.5">check_circle</span>
                                    <span>明確的後續行動建議，減少自行摸索的焦慮。</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-secondary text-xl mt-0.5">check_circle</span>
                                    <span>單一平台掌握所有轉介服務進度。</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Summary & CTA */}
                <section className="bg-cl-primary text-white p-12 rounded-2xl flex flex-col items-center text-center gap-6 shadow-lg shadow-cl-primary/20 mt-8">
                    <span className="material-symbols-outlined text-5xl mb-2 opacity-90">all_inclusive</span>
                    <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold">
                        CareLoop 的運作方式，其實很簡單
                    </h2>
                    <p className="font-manrope text-lg max-w-2xl opacity-90">
                        先看見需求，再安排支持，最後把後續互動持續接住。
                    </p>
                    <div className="w-full h-px bg-white/20 my-4 max-w-xl"></div>
                    <h3 className="font-manrope text-2xl font-semibold mt-4">
                        想了解 CareLoop 如何在你的場域開始運作？
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <Link href="/contact" className="bg-white text-cl-primary font-semibold text-sm tracking-wider px-8 py-4 rounded-full hover:bg-cl-tertiary transition-colors shadow-sm active:scale-95 duration-200">
                            預約專家解決方案
                        </Link>
                        <Link href="/contact" className="bg-transparent border-2 border-white text-white font-semibold text-sm tracking-wider px-8 py-4 rounded-full hover:bg-white/10 transition-colors active:scale-95 duration-200">
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
