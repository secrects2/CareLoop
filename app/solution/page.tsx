import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '解決方案 | CareLoop',
    description: '深度賦能多元場域：為您的健康服務，打造最具適應性的智慧方案',
}

export default function SolutionPage() {
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
                        <Link href="/workflow" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">CareLoop 如何運作</Link>
                        <Link href="/solution" className="text-cl-primary font-semibold border-b-2 border-cl-primary pb-1">解決方案</Link>
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

            <main className="max-w-[1200px] mx-auto px-6 pt-32 pb-20">
                {/* Hero Section */}
                <section className="mb-20 text-center max-w-4xl mx-auto">
                    <h1 className="font-manrope text-4xl md:text-[48px] leading-[1.2] font-bold text-cl-primary mb-6">
                        深度賦能多元場域：為您的健康服務，打造最具適應性的智慧方案
                    </h1>
                    <p className="font-manrope text-lg text-cl-secondary/70 leading-relaxed">
                        CareLoop 可應用在藥局、社區據點、健身場域、長照機構與家庭照顧情境中。我們深入了解不同場域的特性與痛點，量身打造最合適的數位健康支持方案。
                    </p>
                </section>

                {/* General Description */}
                <section className="mb-20 bg-white p-12 rounded-xl border border-cl-neutral shadow-[0_4px_24px_-4px_rgba(31,183,183,0.08)] flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-primary mb-6">
                            拒絕標準化公式：以彈性模組化設計，精準回應不同場景的服務痛點
                        </h2>
                        <p className="font-manrope text-base text-cl-secondary/70 leading-relaxed mb-4">
                            每個照護現場都有其獨特的生命力與挑戰。CareLoop 捨棄僵化的系統思維，透過靈活的技術支援，確保每個鄰里藥局、社區據點或長照機構，都能保有原本的服務節奏，同時擁有更聰明的管理工具。
                        </p>
                        <p className="font-manrope text-base text-cl-secondary/70 leading-relaxed">
                            CareLoop 深入洞察各類夥伴的運作模式，透過模組化技術，讓科技真正成為第一線人員的助力，而非管理負擔。
                        </p>
                    </div>
                    <div className="flex-1 relative h-[300px] w-full rounded-lg overflow-hidden bg-cl-tertiary">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="healthcare professional" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWybuA0QeLBMVlt8rfFOZByVuirUVSasxmm-oNfGY-RJ8LGC9hpOqn2gNk84OBioMYQaMj8FEkDws7lX4E53GtJQVE_pSOMRqDDfBHGRLocwP16eX_nj3VgnmNYKcoL298gCCTOVEjg-qd-YyJ82LPWNLg2Tk43g0h0yod6dl9LKVcGle4C62vMmtbT4p6qiqXsuWkq200jhRL9_MwJpTH-bGMrIU3fX4lfnpq-NOctfU7Sy5nHQ9x0j60XnMRphLrAi7YNghx0pYw" />
                    </div>
                </section>

                {/* Solutions Grid */}
                <section className="mb-20">
                    <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-primary mb-12 text-center">
                        五大應用場域方案
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Pharmacy */}
                        <div className="bg-white rounded-xl border border-cl-neutral shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="h-[200px] bg-cl-tertiary relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="pharmacy" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoR364CEcJXe0gKJcW5Sb3aowA21rYi5HdBrhmtuqXPmy0-k9u9KsVrQZ0opYMlBVGpj5z3dxMUynlyPoUulODKb-NyZ7sZ-uPq7azu3rOeMg95xzU9e52Wq6Fs1kayVjm51Wm0LFZH5oufdREymn7xiLXdbjGmPPMda9scxsbZNS-ekkyRRg9xTOVDUGBS7uSAVfXCVAoj8uIiJuRh5Q8tbwZ6wLcekXtkFkW1Wqbt7ZUFmWHuO_q-p_ViYMRibnf9XBpBhI7tzfl" />
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-cl-primary">local_pharmacy</span>
                                    <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">藥局與健康門市</h3>
                                </div>
                                <h4 className="font-manrope text-sm font-semibold text-cl-primary mb-4 tracking-wider">專業藥局轉型：成為社區健康的信賴入口</h4>
                                <ul className="space-y-2 mt-auto">
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                        <span className="font-manrope text-sm text-cl-secondary/70">建立會員健康護照，延續諮詢價值</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                        <span className="font-manrope text-sm text-cl-secondary/70">整合用藥提醒與健康數據追蹤</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        {/* Community */}
                        <div className="bg-white rounded-xl border border-cl-neutral shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="h-[200px] bg-cl-tertiary relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="community" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYA5fZqtADDMh1XzIimFsnLMUWK4Gb8RBgYamuXxMwDHVfRt48DcUA_mJgCAxIxLoG8KYs5v9PleyxRg96sjWHmWK3pZWBRe4T6w7XtNetA18MJeYoi1IVW8gFGZ-E179CDHKgNzShIXfcwd62_P6vSurBsm8tYrxzdlYZNlhSvb6d8xmGwBMy6LhK-VvfhbNGjYYI1wz1z-kZ975rIPUyAlepRsX-Wtk5lHgvhadEEI2IzJce8Kn2jIImJGViNENNTVhSNX9Cta_y" />
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-cl-primary">diversity_1</span>
                                    <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">社區與地方場域</h3>
                                </div>
                                <h4 className="font-manrope text-sm font-semibold text-cl-primary mb-4 tracking-wider">鄰里據點賦能：讓健康資源無縫融入在地生活</h4>
                                <ul className="space-y-2 mt-auto">
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                        <span className="font-manrope text-sm text-cl-secondary/70">活動報到與參與度數位化管理</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                        <span className="font-manrope text-sm text-cl-secondary/70">串聯社區資源，提供即時關懷聯繫</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        {/* Fitness */}
                        <div className="bg-white rounded-xl border border-cl-neutral shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="h-[200px] bg-cl-tertiary relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="fitness" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb5vdejvL9HCpRmjFLsegS4Glnn3V3iYhP8KaePocHKtvgV0r5_d67E0pkim0DeiBFHHlrOhy5FQSsUmeOuPJyn3MJUgvXWiiacIhPk4O18LfpgGMJEexVQWEiV3wfAHhUi7zIoDxbGqlWIHubvyK8KBZJVfuJf27x5yAvEbS6N51-vVrr34sQIx-TrvNpICpFbRIr2VMUo3MplcCp9tI-ZolmRw5vtoNEU_YMOmZc6v2INtDV3a-q_qmv9ibEPtQJM7XETHg7yab4" />
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-cl-primary">fitness_center</span>
                                    <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">健身房與健康促進</h3>
                                </div>
                                <h4 className="font-manrope text-sm font-semibold text-cl-primary mb-4 tracking-wider">精準運動管理：從單點課程延伸至全方位的預防體系</h4>
                                <ul className="space-y-2 mt-auto">
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                        <span className="font-manrope text-sm text-cl-secondary/70">整合運動處方與日常健康數據</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                        <span className="font-manrope text-sm text-cl-secondary/70">教練專屬管理介面，提升會員留存</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        {/* Long-term Care */}
                        <div className="bg-white rounded-xl border border-cl-neutral shadow-sm overflow-hidden flex flex-col h-full lg:col-span-1 md:col-span-2 hover:shadow-md transition-shadow">
                            <div className="h-[200px] bg-cl-tertiary relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="long term care" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASdIrxz7hYnyR21zmiOEb4BUBmdET9h5YhpuKseRCN1HCJ_mR9GbomqL8nLHyiEKOxwl6kD7KjIlv8j0EEDIgNQZFvW3PDXWUYwSiCD2rwYDsMp37dlMigthIzxaSVKtmdNSmSx7753h8TfX0-dVsTq1fJh5Q8iBh_B8EeqaYZJoinfsqqj8hoV0boocGeGkn0YmGiNR9XyElgGwIS0kkRG25yTlF6mNIdRFKbHrXA7URC9l8cS0JmgLqg1UxwdRNJLLb_8YH637s4" />
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-cl-primary">medical_services</span>
                                    <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">長照機構與照顧服務</h3>
                                </div>
                                <h4 className="font-manrope text-sm font-semibold text-cl-primary mb-4 tracking-wider">智慧機構協作：優化轉介流程，建立連續性照護鏈</h4>
                                <ul className="space-y-2 mt-auto">
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                        <span className="font-manrope text-sm text-cl-secondary/70">簡化交班流程，確保資訊不漏接</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                        <span className="font-manrope text-sm text-cl-secondary/70">家屬端 APP，即時掌握長輩狀況</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        {/* Family */}
                        <div className="bg-white rounded-xl border border-cl-neutral shadow-sm overflow-hidden flex flex-col h-full lg:col-span-2 md:col-span-2 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row h-full">
                                <div className="md:w-2/5 h-[200px] md:h-auto bg-cl-tertiary relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="family" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXWsRw1Fky2lA53ipJKq7nd4TZiPsvcX9gB3xTZthpI9IeJsL633o2ZIQaiTWVIXD3BPF_IBTyqrh9yaIXPqbopBbpfSCi5TjKLBSjCWruWwOW5qvbp4q00NSTsubvEzhBImAXWumHdRz4_QsTt-q2S_CKv7lhjdttpTc0tD_zaG6ZjDWWsdpmmKgoFISh11QpCI6lddcljvbVScW8FgU9Zw-Du-qrXJbHIT4LaftEgNKo9-fAAHAWkr1AtG1aWgtQvNwChHa64XcX" />
                                </div>
                                <div className="p-6 md:w-3/5 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-cl-primary">home</span>
                                        <h3 className="font-manrope text-2xl font-semibold text-cl-secondary">家庭與照顧者</h3>
                                    </div>
                                    <h4 className="font-manrope text-sm font-semibold text-cl-primary mb-4 tracking-wider">家屬溝通橋梁：以透明數據降低焦慮，開啟高效守護</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                            <span className="font-manrope text-sm text-cl-secondary/70">整合多方照顧資訊，減輕照顧者焦慮</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-cl-primary text-sm mt-1">check_circle</span>
                                            <span className="font-manrope text-sm text-cl-secondary/70">提供專業資源媒合與線上衛教支持</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Value Section */}
                <section className="mb-20 bg-cl-tertiary p-12 rounded-xl text-center max-w-4xl mx-auto border border-cl-neutral shadow-[0_4px_24px_-4px_rgba(31,183,183,0.08)]">
                    <h2 className="font-manrope text-[48px] leading-[1.2] font-bold text-cl-primary mb-6">
                        超越軟體工具：我們是您深耕健康生態的戰略夥伴
                    </h2>
                    <p className="font-manrope text-lg text-cl-secondary/70 leading-relaxed">
                        CareLoop 不只是平台，也是讓服務更容易落地的合作方式。我們重視與每個場域的深度夥伴關係，從導入評估、教育訓練到後續維護，提供全方位的技術與顧問支持。
                    </p>
                </section>

                {/* Call to Action */}
                <section className="text-center py-20">
                    <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary mb-12">
                        準備好為您的場域，導入更高產值的健康服務模式了嗎？
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link href="/contact" className="bg-cl-primary text-white px-8 py-3 rounded-full font-semibold text-sm tracking-wider hover:bg-cl-primary-dark transition-colors shadow-sm active:scale-95">
                            預約專家解決方案
                        </Link>
                        <Link href="/contact" className="border-2 border-cl-primary text-cl-primary px-8 py-3 rounded-full font-semibold text-sm tracking-wider hover:bg-cl-tertiary transition-colors active:scale-95">
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
