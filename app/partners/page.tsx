import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '合作夥伴 | CareLoop',
    description: '把不同專業與場域串接起來，才能讓健康支持真正走進生活',
}

export default function PartnersPage() {
    return (
        <div className="bg-white text-cl-secondary antialiased selection:bg-cl-primary/20 selection:text-cl-secondary min-h-screen flex flex-col">
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
                        <Link href="/solution" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">解決方案</Link>
                        <Link href="/partners" className="text-cl-primary font-semibold border-b-2 border-cl-primary pb-1">合作夥伴</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4 font-manrope">
                        <Link href="/login" className="text-cl-primary font-medium hover:opacity-80 transition-opacity">登入</Link>
                        <Link href="/contact" className="bg-cl-primary text-white px-5 py-2 rounded-full font-medium hover:bg-cl-primary-dark active:scale-95 transition-all">立即加入</Link>
                    </div>

                    <button className="md:hidden text-cl-primary" aria-label="選單">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center w-full pt-32 pb-20">
                <div className="w-full max-w-[1280px] px-8 mx-auto flex flex-col gap-20">
                    {/* Hero Section */}
                    <section className="flex flex-col items-center text-center max-w-4xl mx-auto gap-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cl-tertiary text-cl-primary font-semibold text-xs tracking-wider mb-2">
                            <span className="material-symbols-outlined text-sm">handshake</span>
                            <span>建構健康的生態系</span>
                        </div>
                        <h1 className="font-manrope text-4xl md:text-[48px] leading-[1.2] font-bold text-cl-secondary">
                            把不同專業與場域串接起來，才能讓健康支持真正走進生活
                        </h1>
                        <p className="font-manrope text-lg text-cl-secondary/70 max-w-3xl mt-2 leading-relaxed">
                            CareLoop 與醫療、社區、運動場域、零售通路與供應鏈夥伴合作，打破資訊與服務的孤島，提供連續且個人化的健康解方。
                        </p>
                    </section>

                    {/* Value Proposition Section */}
                    <section className="bg-white rounded-xl p-8 md:p-12 shadow-[0_4px_24px_-4px_rgba(31,183,183,0.12)] border border-cl-neutral grid md:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col gap-6">
                            <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary">
                                CareLoop 的價值，不只來自系統，也來自合作網絡
                            </h2>
                            <div className="w-12 h-1 bg-cl-primary rounded-full"></div>
                            <p className="font-manrope text-base text-cl-secondary/80 leading-relaxed">
                                長久以來，健康與照護服務往往是分散的。醫院負責治療、社區負責關懷、運動場館負責訓練，而民眾在這些場域間流轉時，資料與支持往往無法延續。<br/><br/>
                                CareLoop 透過數位基礎建設，將這些節點無縫串接。我們不僅提供系統工具，更建立一個互利共生的網絡，讓每一個專業角色都能在最適當的時機，提供最具價值的服務。
                            </p>
                        </div>
                        <div className="relative h-[400px] rounded-lg overflow-hidden bg-cl-tertiary">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="Healthcare professionals" className="w-full h-full object-cover" src="/images/partner-network.png" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-cl-primary/20 to-transparent mix-blend-overlay"></div>
                        </div>
                    </section>

                    {/* Partners Grid Section */}
                    <section className="flex flex-col gap-12 w-full">
                        <div className="flex flex-col gap-2">
                            <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary">
                                六大夥伴類別
                            </h2>
                            <p className="font-manrope text-base text-cl-secondary/70">
                                我們與多元領域的領導品牌攜手，建構完整的健康生態圈。
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Card 1: Medical */}
                            <div className="group bg-white rounded-xl overflow-hidden border border-cl-neutral hover:shadow-lg hover:border-cl-primary/30 transition-all duration-300 flex flex-col">
                                <div className="h-48 relative overflow-hidden bg-cl-tertiary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Hospital" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWBQpRhobTW364LTXRia4Sbmwaq4RP92uleRXJLGXpAEyuSUx2OW7FiVf1wCubQl_nILKbA271hI5XRz9OQ1o2K3EDtJcKFNNTiSZ6c9Eda83FZIiFVu7wXc3QVAwnMt5zAzDe8RZHXR0AKnGtF5kTjKjN6ThdWXN5BYq_s1XC2k7bI8C0MnvoFK9wen9hzC4ynlC4biUxSml7HnYAZvmBYlSFi9mA3LwP9N2P4A76rEh1Ki5k3yWYuVfVZQbMZ7X7F1iJLrAVQAsW" />
                                </div>
                                <div className="p-6 flex flex-col gap-4 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary">
                                            <span className="material-symbols-outlined">local_hospital</span>
                                        </div>
                                        <h3 className="font-manrope text-xl font-semibold text-cl-secondary">醫療與長照承接夥伴</h3>
                                    </div>
                                    <p className="font-manrope text-sm text-cl-secondary/80 flex-grow leading-relaxed">
                                        專注於臨床診療與重症後期的長期照護，提供專業醫療指導與復健計畫，確保病患在出院後獲得連續性支持。
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-cl-neutral">
                                        <span className="font-manrope text-xs text-cl-secondary/50 block mb-1">範例夥伴</span>
                                        <span className="font-manrope text-sm font-semibold text-cl-primary">光田醫療體系</span>
                                    </div>
                                </div>
                            </div>
                            {/* Card 2: Community */}
                            <div className="group bg-white rounded-xl overflow-hidden border border-cl-neutral hover:shadow-lg hover:border-cl-primary/30 transition-all duration-300 flex flex-col">
                                <div className="h-48 relative overflow-hidden bg-cl-tertiary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Community" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsIZENw5rktrEM_WMPEspurKTJZuWoDe6ryma9nQ1MscRHAzO_aqIk_C7l32d4SDoecmBb7Ki34ZVIW1Hl_F2er37P7FFTuqmLdP0U0cxJQwllxjbBOQOaiMenGiHzovxva1A51lbo9HN67j2F1PiiVMsGq99czS3kgwDu5xNpY_nWybhqz6EhEmer7RL-SXbVTnb8LTNr4ieBUtoil-vKVTZHn32EpIwx4jtatl7B_Yh0Ai4IC00Jn56sqn7_982f2zT1xPNJ-rqS" />
                                </div>
                                <div className="p-6 flex flex-col gap-4 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary">
                                            <span className="material-symbols-outlined">diversity_1</span>
                                        </div>
                                        <h3 className="font-manrope text-xl font-semibold text-cl-secondary">社區與高齡服務夥伴</h3>
                                    </div>
                                    <p className="font-manrope text-sm text-cl-secondary/80 flex-grow leading-relaxed">
                                        在地化關懷的推手，透過社區據點與活動，提供長者社交互動、基礎健康監測與心理支持，預防衰弱。
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-cl-neutral">
                                        <span className="font-manrope text-xs text-cl-secondary/50 block mb-1">範例夥伴</span>
                                        <span className="font-manrope text-sm font-semibold text-cl-primary">弘道老人福利基金會</span>
                                    </div>
                                </div>
                            </div>
                            {/* Card 3: Fitness */}
                            <div className="group bg-white rounded-xl overflow-hidden border border-cl-neutral hover:shadow-lg hover:border-cl-primary/30 transition-all duration-300 flex flex-col">
                                <div className="h-48 relative overflow-hidden bg-cl-tertiary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Fitness" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDdrpSPR8M1Vyj2xYz4Gggr1csFsAL3YW-BBviGqTB17J7-Q1bx_EZcogQxKCdiO-X0Dvh9F6w9Th9tMekkhz3pqdB09PFirtXafYlbR5Dxu_SgpdGV87HWfvzeNnvDu4iXKI8JyaC7ylHotQHMvtF7_dYpAT2RtXVjGBxUKTTtveSTybI0x1EOqZFapvjGvPA2Qp3JLzTM_VZjRG3DfkzpYgMK42nG2tUrvjZw4fzGGlR9pafx47zUbCdr-0OAbGaADv1aFIDkz0T" />
                                </div>
                                <div className="p-6 flex flex-col gap-4 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary">
                                            <span className="material-symbols-outlined">fitness_center</span>
                                        </div>
                                        <h3 className="font-manrope text-xl font-semibold text-cl-secondary">健康促進與運動場域夥伴</h3>
                                    </div>
                                    <p className="font-manrope text-sm text-cl-secondary/80 flex-grow leading-relaxed">
                                        提供專業體適能評估與訓練課程，將醫療建議轉化為具體的運動處方，協助民眾在日常中實踐健康。
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-cl-neutral">
                                        <span className="font-manrope text-xs text-cl-secondary/50 block mb-1">範例夥伴</span>
                                        <span className="font-manrope text-sm font-semibold text-cl-primary">World Gym</span>
                                    </div>
                                </div>
                            </div>
                            {/* Card 4: Retail */}
                            <div className="group bg-white rounded-xl overflow-hidden border border-cl-neutral hover:shadow-lg hover:border-cl-primary/30 transition-all duration-300 flex flex-col">
                                <div className="h-48 relative overflow-hidden bg-cl-tertiary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Retail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsTamnGGE760_czL7q1pGOvVC-omlRuPmjQ0hAEEe5KkAyMPKGZPeWlI2DHcZC8qJ_mUSZr71veVLh1lxDaGTW9KZW2SovMOY5qLvOxx1hmoB-d6g7KYvm1YyW2XvFYni-mX9UPA4-w37TT6rfd6kbuSBoG01d6QqTLeVv13PUAPYJuIweqZ3UQTzz3r4JjOuavMI_DHZL0ciyoE396uj_0tznUHeLXoIUdnFCTXH6bRHfkn9bm2fx-ebCmh2n--QyBWwFGPwZwv1-" />
                                </div>
                                <div className="p-6 flex flex-col gap-4 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary">
                                            <span className="material-symbols-outlined">storefront</span>
                                        </div>
                                        <h3 className="font-manrope text-xl font-semibold text-cl-secondary">零售與生活通路夥伴</h3>
                                    </div>
                                    <p className="font-manrope text-sm text-cl-secondary/80 flex-grow leading-relaxed">
                                        作為健康生活的第一線接觸點，提供符合健康標準的生鮮食品與日常物資，讓健康飲食選擇更容易取得。
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-cl-neutral">
                                        <span className="font-manrope text-xs text-cl-secondary/50 block mb-1">範例夥伴</span>
                                        <span className="font-manrope text-sm font-semibold text-cl-primary">楓康、美廉社</span>
                                    </div>
                                </div>
                            </div>
                            {/* Card 5: Supply Chain */}
                            <div className="group bg-white rounded-xl overflow-hidden border border-cl-neutral hover:shadow-lg hover:border-cl-primary/30 transition-all duration-300 flex flex-col">
                                <div className="h-48 relative overflow-hidden bg-cl-tertiary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Supply" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/images/partner-supply.png" />
                                </div>
                                <div className="p-6 flex flex-col gap-4 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary">
                                            <span className="material-symbols-outlined">medication</span>
                                        </div>
                                        <h3 className="font-manrope text-xl font-semibold text-cl-secondary">商品與供應鏈夥伴</h3>
                                    </div>
                                    <p className="font-manrope text-sm text-cl-secondary/80 flex-grow leading-relaxed">
                                        研發與供應高品質的營養補充品、醫療輔具及健康監測設備，確保使用者獲得有效且安全的實體支持。
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-cl-neutral">
                                        <span className="font-manrope text-xs text-cl-secondary/50 block mb-1">範例夥伴</span>
                                        <span className="font-manrope text-sm font-semibold text-cl-primary">AFC 保健品</span>
                                    </div>
                                </div>
                            </div>
                            {/* Card 6: Home Support */}
                            <div className="group bg-white rounded-xl overflow-hidden border border-cl-neutral hover:shadow-lg hover:border-cl-primary/30 transition-all duration-300 flex flex-col">
                                <div className="h-48 relative overflow-hidden bg-cl-tertiary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img alt="Delivery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3sC9m4-vPRmM6KnmZqXW5bd9OlgKt6R7mytH8AhipntqSOOlr42EEb4e7lXBLMQ0ylJlZkroUrYLlGgLh4i6PztVpRBa_NTatdlFqabe4kHXNTZEcTxHm1baeMG-SgkUbzYoo7dHJDVlOTAQgsSCHi6u8tZCcYe3d_eVOuM1iVs_jm75d3_HRIUmZQHvfwg8wZf7Ewrr_cvxsfQFtyiz36JrUKUZlMMZiYA9q-876o8v6Ob6YtkhpPfTmj59ye0vlpxE5iMTTwPrj" />
                                </div>
                                <div className="p-6 flex flex-col gap-4 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cl-primary/10 flex items-center justify-center text-cl-primary">
                                            <span className="material-symbols-outlined">local_shipping</span>
                                        </div>
                                        <h3 className="font-manrope text-xl font-semibold text-cl-secondary">到家履約與生活支持夥伴</h3>
                                    </div>
                                    <p className="font-manrope text-sm text-cl-secondary/80 flex-grow leading-relaxed">
                                        解決最後一哩路的問題，提供餐食配送、居家清潔或交通接送等服務，降低生活負擔，提升居家安養品質。
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-cl-neutral">
                                        <span className="font-manrope text-xs text-cl-secondary/50 block mb-1">範例夥伴</span>
                                        <span className="font-manrope text-sm font-semibold text-cl-primary">雀莉家</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Collaboration Model Section */}
                    <section className="bg-cl-primary/5 rounded-xl p-8 md:p-12 border border-cl-primary/10 mt-8">
                        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6">
                            <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-primary">
                                CareLoop 不是把夥伴放在同一頁，而是讓彼此更容易合作
                            </h2>
                            <p className="font-manrope text-base text-cl-secondary/80 text-left md:text-center leading-relaxed">
                                傳統的合作往往流於表面清單。在 CareLoop 系統中，當醫師開立運動建議時，資料可安全對接至健身房教練；當社區長輩需要營養補充時，可直接連結零售通路配送。透過明確的數位分工與資料串接，我們確保每一位夥伴的專業都能發揮最大效益，共同為使用者編織一張緊密的安全網。
                            </p>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="flex flex-col items-center justify-center text-center gap-6 pt-8">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary">
                            想成為 CareLoop 的合作夥伴？
                        </h2>
                        <p className="font-manrope text-base text-cl-secondary/70 mb-2">加入我們的生態系，共同擴大健康照護的影響力。</p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link href="/contact" className="bg-cl-primary hover:bg-cl-primary-dark text-white font-semibold text-sm tracking-wider px-8 py-3 rounded-full transition-colors duration-200 min-w-[160px] shadow-sm active:scale-95 flex items-center justify-center">
                                預約專家解決方案
                            </Link>
                            <Link href="/contact" className="bg-transparent hover:bg-cl-tertiary border-2 border-cl-primary text-cl-primary font-semibold text-sm tracking-wider px-8 py-3 rounded-full transition-colors duration-200 min-w-[160px] active:scale-95 flex items-center justify-center">
                                與我們開啟對話
                            </Link>
                        </div>
                    </section>
                </div>
            </main>

            {/* ── Footer ── */}
            <footer className="w-full border-t border-cl-neutral bg-cl-tertiary mt-auto">
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
