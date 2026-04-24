import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: '聯絡我們／申請合作 | CareLoop',
    description: '一起讓健康支持更靠近日常生活，成為我們的夥伴',
}

export default function ContactPage() {
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
                        <Link href="/partners" className="text-cl-secondary/70 hover:text-cl-primary transition-colors">合作夥伴</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4 font-manrope">
                        <Link href="/login" className="text-cl-primary font-medium hover:opacity-80 transition-opacity">登入</Link>
                        <Link href="/contact" className="bg-cl-primary text-white px-5 py-2 rounded-full font-medium hover:bg-cl-primary-dark active:scale-95 transition-all shadow-sm">立即諮詢</Link>
                    </div>

                    <button className="md:hidden text-cl-primary" aria-label="選單">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </header>

            <main className="flex-grow pt-32 pb-20">
                {/* Hero Section */}
                <section className="relative max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-12 gap-12 items-center mb-20">
                    <div className="md:col-span-6 z-10 flex flex-col gap-6">
                        <div className="inline-flex items-center gap-2 bg-cl-tertiary px-4 py-2 rounded-full text-cl-secondary font-semibold text-xs tracking-wider w-max">
                            <span className="w-2 h-2 rounded-full bg-cl-primary"></span>
                            成為我們的夥伴
                        </div>
                        <h1 className="font-manrope text-4xl md:text-[48px] leading-[1.2] font-bold text-cl-secondary">
                            一起讓健康支持<br/>
                            <span className="text-cl-primary">更靠近日常生活</span>
                        </h1>
                        <p className="font-manrope text-lg text-cl-secondary/70 max-w-[480px] leading-relaxed">
                            無論您是醫療機構、社區據點還是健康教練，我們都期待與您攜手，打造無縫接軌的社區健康照護網。
                        </p>
                        <div className="pt-4">
                            <a href="#form-section" className="inline-block bg-cl-primary text-white px-8 py-4 rounded-full font-semibold tracking-wider text-sm hover:bg-cl-primary-dark transition-colors shadow-sm active:scale-95">
                                填寫合作表單
                            </a>
                        </div>
                    </div>
                    <div className="md:col-span-6 relative h-[500px] rounded-xl overflow-hidden bg-cl-tertiary shadow-[0_4px_24px_-4px_rgba(31,183,183,0.12)] border border-cl-neutral">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="Professional medical consultation" className="absolute inset-0 w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbBoLCIyy-hVKNZxDfLJ3CNMm7TQe3wZNzWePiZ_Q5HR0vPBMjN8211n3CNiTgXjbX-zNVM9zoDAkV6E85g8aLUTfNQ83ucN-GcaE5mfqFH6o3ucZoa_OOtLC2hNps6UqgNH96YFKSQ74U1fH8qJfAjnPBl96bp_umrsLWSTwt6OykqVrFqPe-knMj2G4-qhFrEaqjWmOKt7xaYztios1oYgpL3XU00fWS6GB0g3BVEAVoOM-jTHDyu--uPCut9zwOk0MH4uBbsRiI" />
                    </div>
                </section>

                {/* Intro Section */}
                <section className="bg-white py-20 border-t border-b border-cl-neutral">
                    <div className="max-w-[800px] mx-auto px-8 text-center flex flex-col gap-6">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary">
                            不論你來自哪一種場域，我們都希望先理解你的需求
                        </h2>
                        <p className="font-manrope text-base text-cl-secondary/70 leading-relaxed mx-auto max-w-2xl">
                            我們深知每個照護場域面臨的挑戰都不盡相同。CareLoop 不僅是一套系統，更是一套靈活的健康支持方案。透過深入了解您的日常營運與痛點，我們能為您量身打造最合適的合作模式。
                        </p>
                    </div>
                </section>

                {/* Target Audience (Bento Grid) */}
                <section className="max-w-7xl mx-auto px-8 py-20">
                    <div className="mb-12 text-center">
                        <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary mb-4">
                            這些夥伴，都可以與 CareLoop 一起合作
                        </h2>
                        <p className="font-manrope text-base text-cl-secondary/70">我們支援多元的社區健康節點</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="bg-white rounded-xl p-8 border border-cl-neutral shadow-sm flex flex-col items-start gap-4 hover:border-cl-primary/30 transition-colors group">
                            <div className="bg-cl-tertiary w-12 h-12 rounded-full flex items-center justify-center text-cl-primary group-hover:bg-cl-primary/10 transition-colors">
                                <span className="material-symbols-outlined">local_pharmacy</span>
                            </div>
                            <h3 className="font-manrope text-xl font-semibold text-cl-secondary">藥局</h3>
                            <p className="font-manrope text-sm text-cl-secondary/70 mt-auto leading-relaxed">整合用藥諮詢與社區健康追蹤，將您的專業影響力延伸至民眾家中。</p>
                        </div>
                        {/* Card 2 */}
                        <div className="bg-white rounded-xl p-8 border border-cl-neutral shadow-sm flex flex-col items-start gap-4 hover:border-cl-primary/30 transition-colors group">
                            <div className="bg-cl-tertiary w-12 h-12 rounded-full flex items-center justify-center text-cl-primary group-hover:bg-cl-primary/10 transition-colors">
                                <span className="material-symbols-outlined">home_work</span>
                            </div>
                            <h3 className="font-manrope text-xl font-semibold text-cl-secondary">社區據點</h3>
                            <p className="font-manrope text-sm text-cl-secondary/70 mt-auto leading-relaxed">數位化管理長者健康數據，讓社區服務更精準、更有感。</p>
                        </div>
                        {/* Card 3 */}
                        <div className="bg-white rounded-xl p-8 border border-cl-neutral shadow-sm flex flex-col items-start gap-4 hover:border-cl-primary/30 transition-colors group">
                            <div className="bg-cl-tertiary w-12 h-12 rounded-full flex items-center justify-center text-cl-primary group-hover:bg-cl-primary/10 transition-colors">
                                <span className="material-symbols-outlined">fitness_center</span>
                            </div>
                            <h3 className="font-manrope text-xl font-semibold text-cl-secondary">運動健身中心</h3>
                            <p className="font-manrope text-sm text-cl-secondary/70 mt-auto leading-relaxed">結合生理數據追蹤，為會員提供更科學、客製化的運動處方建議。</p>
                        </div>
                        {/* Card 4 */}
                        <div className="bg-white rounded-xl p-8 border border-cl-neutral shadow-sm flex flex-col items-start gap-4 hover:border-cl-primary/30 transition-colors group">
                            <div className="bg-cl-tertiary w-12 h-12 rounded-full flex items-center justify-center text-cl-primary group-hover:bg-cl-primary/10 transition-colors">
                                <span className="material-symbols-outlined">medical_services</span>
                            </div>
                            <h3 className="font-manrope text-xl font-semibold text-cl-secondary">醫療與社福機構</h3>
                            <p className="font-manrope text-sm text-cl-secondary/70 mt-auto leading-relaxed">建立出院後的遠距關懷機制，降低再入院率，減輕照護負擔。</p>
                        </div>
                        {/* Card 5 */}
                        <div className="bg-white rounded-xl p-8 border border-cl-neutral shadow-sm flex flex-col items-start gap-4 hover:border-cl-primary/30 transition-colors group">
                            <div className="bg-cl-tertiary w-12 h-12 rounded-full flex items-center justify-center text-cl-primary group-hover:bg-cl-primary/10 transition-colors">
                                <span className="material-symbols-outlined">storefront</span>
                            </div>
                            <h3 className="font-manrope text-xl font-semibold text-cl-secondary">零售與服務業</h3>
                            <p className="font-manrope text-sm text-cl-secondary/70 mt-auto leading-relaxed">於實體場域導入健康檢測站，創造新型態的顧客加值服務體驗。</p>
                        </div>
                        {/* Card 6 */}
                        <div className="bg-white rounded-xl p-8 border border-cl-neutral shadow-sm flex flex-col items-start gap-4 hover:border-cl-primary/30 transition-colors group">
                            <div className="bg-cl-tertiary w-12 h-12 rounded-full flex items-center justify-center text-cl-primary group-hover:bg-cl-primary/10 transition-colors">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <h3 className="font-manrope text-xl font-semibold text-cl-secondary">健康管理與教練個人</h3>
                            <p className="font-manrope text-sm text-cl-secondary/70 mt-auto leading-relaxed">運用專業平台管理客戶進度，提升服務品質與效率，擴大您的影響力。</p>
                        </div>
                    </div>
                </section>

                {/* Collaboration Model */}
                <section className="bg-cl-tertiary/50 py-20 border-y border-cl-neutral">
                    <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col gap-8">
                            <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary">你可以怎麼和我們合作</h2>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-manrope text-base text-cl-secondary/80">導入 CareLoop 數位健康管理系統</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-manrope text-base text-cl-secondary/80">共同策劃社區健康促進活動與講座</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-manrope text-base text-cl-secondary/80">轉介需持續健康追蹤之個案或病患</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-manrope text-base text-cl-secondary/80">成為 CareLoop 認證之社區健康教練或專家</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-manrope text-base text-cl-secondary/80">健康設備或服務的整合與串接</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cl-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-manrope text-base text-cl-secondary/80">其他創新的健康生態圈合作提案</span>
                                </li>
                            </ul>
                        </div>
                        <div className="h-[400px] rounded-xl overflow-hidden shadow-sm border border-cl-neutral relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="Healthcare professionals discussing" className="absolute inset-0 w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDscHEiJW9Xo_OR1lTZIGGAGS0dXqIas8OEVXvHfmCWUPo4SjN9qeT7seeQEmknXZ9-Au28mlFXa9VIUYg-eR6yAn7elUeN4hw8-q1xKS6s1Tum3IlluuO-H6GjCDLYS924MGV2HagvqJzu2zA2LQYBEVSCnlhDbJOLz34obcGgyAH8t2HiLa78pPdL4N5b0hR9RJFBUDYQoxsJZu88zKWp-eSRrLfDyLobRqj78mXpVEniBs449266hTFjKmoKr8B2bL6zKfm2gaeE" />
                        </div>
                    </div>
                </section>

                {/* Form Section */}
                <section className="max-w-[800px] mx-auto px-8 py-20" id="form-section">
                    <div className="bg-white rounded-xl p-8 md:p-12 shadow-[0_8px_30px_rgb(31,183,183,0.08)] border border-cl-neutral">
                        <div className="mb-12 text-center">
                            <h2 className="font-manrope text-[32px] leading-[1.3] font-semibold text-cl-secondary mb-2">合作需求表單</h2>
                            <p className="font-manrope text-base text-cl-secondary/70">留下您的資訊，我們的團隊將盡快與您聯繫。</p>
                        </div>
                        {/* We will convert this to a simple informative form UI without actual backend submission yet */}
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="font-manrope text-sm font-semibold text-cl-secondary">姓名 <span className="text-red-500">*</span></label>
                                    <input className="w-full bg-cl-tertiary/50 border-b-2 border-cl-neutral outline-none focus:border-cl-primary transition-colors py-3 px-4 rounded-t-sm" placeholder="請輸入您的姓名" type="text" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-manrope text-sm font-semibold text-cl-secondary">單位名稱 <span className="text-red-500">*</span></label>
                                    <input className="w-full bg-cl-tertiary/50 border-b-2 border-cl-neutral outline-none focus:border-cl-primary transition-colors py-3 px-4 rounded-t-sm" placeholder="請輸入機構或公司名稱" type="text" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-manrope text-sm font-semibold text-cl-secondary">職稱</label>
                                    <input className="w-full bg-cl-tertiary/50 border-b-2 border-cl-neutral outline-none focus:border-cl-primary transition-colors py-3 px-4 rounded-t-sm" placeholder="請輸入您的職稱" type="text" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-manrope text-sm font-semibold text-cl-secondary">聯絡電話 <span className="text-red-500">*</span></label>
                                    <input className="w-full bg-cl-tertiary/50 border-b-2 border-cl-neutral outline-none focus:border-cl-primary transition-colors py-3 px-4 rounded-t-sm" placeholder="請輸入聯絡電話" type="tel" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-manrope text-sm font-semibold text-cl-secondary">電子郵件 <span className="text-red-500">*</span></label>
                                    <input className="w-full bg-cl-tertiary/50 border-b-2 border-cl-neutral outline-none focus:border-cl-primary transition-colors py-3 px-4 rounded-t-sm" placeholder="請輸入電子郵件" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-manrope text-sm font-semibold text-cl-secondary">所在縣市</label>
                                    <select className="w-full bg-cl-tertiary/50 border-b-2 border-cl-neutral outline-none focus:border-cl-primary transition-colors py-3 px-4 rounded-t-sm appearance-none cursor-pointer">
                                        <option disabled selected value="">請選擇縣市</option>
                                        <option>台北市</option>
                                        <option>新北市</option>
                                        <option>桃園市</option>
                                        <option>台中市</option>
                                        <option>台南市</option>
                                        <option>高雄市</option>
                                        <option>其他</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2 pt-4">
                                <label className="font-manrope text-sm font-semibold text-cl-secondary">你的角色 <span className="text-red-500">*</span></label>
                                <select className="w-full bg-cl-tertiary/50 border-b-2 border-cl-neutral outline-none focus:border-cl-primary transition-colors py-3 px-4 rounded-t-sm appearance-none cursor-pointer" required>
                                    <option disabled selected value="">請選擇您的身分</option>
                                    <option>醫療專業人員 (醫師/護理師/藥師等)</option>
                                    <option>社區據點負責人或專員</option>
                                    <option>健康管理師/教練</option>
                                    <option>企業或機構代表</option>
                                    <option>其他</option>
                                </select>
                            </div>
                            <div className="space-y-3 pt-4">
                                <label className="font-manrope text-sm font-semibold text-cl-secondary block mb-2">想了解的合作方向 (可複選)</label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input className="w-5 h-5 rounded border-cl-neutral text-cl-primary focus:ring-cl-primary cursor-pointer accent-cl-primary" type="checkbox" />
                                    <span className="font-manrope text-base text-cl-secondary/80 group-hover:text-cl-secondary transition-colors">導入系統服務</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input className="w-5 h-5 rounded border-cl-neutral text-cl-primary focus:ring-cl-primary cursor-pointer accent-cl-primary" type="checkbox" />
                                    <span className="font-manrope text-base text-cl-secondary/80 group-hover:text-cl-secondary transition-colors">成為特約場域</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input className="w-5 h-5 rounded border-cl-neutral text-cl-primary focus:ring-cl-primary cursor-pointer accent-cl-primary" type="checkbox" />
                                    <span className="font-manrope text-base text-cl-secondary/80 group-hover:text-cl-secondary transition-colors">加入專業教練陣容</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input className="w-5 h-5 rounded border-cl-neutral text-cl-primary focus:ring-cl-primary cursor-pointer accent-cl-primary" type="checkbox" />
                                    <span className="font-manrope text-base text-cl-secondary/80 group-hover:text-cl-secondary transition-colors">企業健康促進方案</span>
                                </label>
                            </div>
                            <div className="space-y-2 pt-4">
                                <label className="font-manrope text-sm font-semibold text-cl-secondary">想補充的需求說明</label>
                                <textarea className="w-full bg-cl-tertiary/50 border-b-2 border-cl-neutral outline-none focus:border-cl-primary transition-colors py-3 px-4 rounded-t-sm resize-none" placeholder="請簡述您的現況與期望的合作方式..." rows={4}></textarea>
                            </div>
                            <div className="pt-6">
                                <button className="w-full bg-cl-primary text-white py-4 rounded-full font-semibold tracking-wider text-sm hover:bg-cl-primary-dark transition-colors shadow-sm active:scale-95" type="button">
                                    送出申請
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Other Contacts */}
                    <div className="mt-12 flex flex-wrap justify-center gap-8">
                        <div className="flex items-center gap-2 text-cl-secondary/80">
                            <span className="material-symbols-outlined text-cl-primary">mail</span>
                            <span className="font-manrope font-semibold">partner@careloop.tw</span>
                        </div>
                        <div className="flex items-center gap-2 text-cl-secondary/80">
                            <span className="material-symbols-outlined text-cl-primary">call</span>
                            <span className="font-manrope font-semibold">02-1234-5678</span>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="max-w-7xl mx-auto px-8 py-20 text-center">
                    <h2 className="font-manrope text-[48px] leading-[1.2] font-bold text-cl-secondary mb-6">
                        從一個場域開始，也能慢慢長成<br/>
                        <span className="text-cl-primary">一套更完整的支持方式</span>
                    </h2>
                    <p className="font-manrope text-lg text-cl-secondary/70">期待與您一起創造改變</p>
                </section>
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
