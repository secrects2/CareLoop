'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { LayoutDashboard, Users, ClipboardList, ShieldCheck, LogOut, BookOpen, CalendarCheck, LifeBuoy, Home, MapPin, Stamp } from 'lucide-react'
import { canAccessRoute, ROLE_LABELS, ROLE_BADGE_STYLES, type UserRole } from '@/lib/rbac'

interface Profile {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    organization: string | null
    role: string | null
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()



    useEffect(() => {
        const supabase = createClient()

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url, organization, role, is_active')
                .eq('id', user.id)
                .single()

            if (profileData) setProfile(profileData)
        }

        getUser()
    }, [router])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const userRole = (profile?.role || 'instructor') as UserRole

    // 主導航項目（根據角色過濾）
    const allMainNavItems = [
        { href: '/dashboard', label: '儀表板', icon: LayoutDashboard, color: 'text-blue-500' },
        { href: '/elders', label: '長輩管理', icon: Users, color: 'text-violet-500' },
        { href: '/locations', label: '據點管理', icon: MapPin, color: 'text-indigo-500' },
        { href: '/events', label: '活動簽到', icon: CalendarCheck, color: 'text-teal-500' },
        { href: '/subsidy', label: '輔具導航', icon: LifeBuoy, color: 'text-rose-500' },
    ]
    const mainNavItems = allMainNavItems.filter(item => canAccessRoute(userRole, item.href))

    // 底部導航（根據角色過濾）
    const allBottomNavItems = [
        { href: '/icope', label: 'ICOPE 評估', icon: ClipboardList, color: 'text-emerald-500' },
        { href: '/seal-application', label: '用印申請', icon: Stamp, color: 'text-orange-500' },
        { href: '/guide', label: '操作說明', icon: BookOpen, color: 'text-amber-500' },
        { href: '/admin', label: '管理員', icon: ShieldCheck, color: 'text-red-500' },
    ]
    const bottomNavItems = allBottomNavItems.filter(item => canAccessRoute(userRole, item.href))



    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-xl rounded-none lg:rounded-r-2xl border-r border-slate-200 flex flex-col transform transition-transform duration-300 shadow-lg lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Logo */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'var(--gradient-primary)' }}>
                            C
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 text-sm leading-tight">CareLoop</h1>
                            <p className="text-xs text-slate-500">ICOPE 檢測平台</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {/* Main nav */}
                    {mainNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`sidebar-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                        >
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                            <span>{item.label}</span>
                        </Link>
                    ))}



                    {/* Divider */}
                    <div className="pt-2 pb-1">
                        <div className="border-t border-slate-100" />
                    </div>

                    {/* Bottom nav */}
                    {bottomNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`sidebar-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
                        >
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User profile */}
                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-slate-800 text-sm font-bold">
                                {profile?.full_name?.[0] || '?'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-slate-800 truncate">{profile?.full_name || user?.user_metadata?.full_name || '指導員'}</p>
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${ROLE_BADGE_STYLES[userRole]}`}>
                                    {ROLE_LABELS[userRole]}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{profile?.email || user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left text-sm text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        退出登入
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-h-screen">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-xl rounded-none border-b border-slate-200 px-4 py-3 flex items-center shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-700 p-1">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </header>

                <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
                    {children}
                </div>

                {/* Footer */}
                <footer className="border-t border-slate-200 px-4 md:px-6 lg:px-8 py-6 mt-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                            <p>© {new Date().getFullYear()} 惠生醫藥集團 版權所有</p>
                            <div className="flex items-center gap-4">
                                <a href="/privacy" className="hover:text-primary-600 transition-colors">隱私權政策</a>
                                <span>·</span>
                                <a href="/terms" className="hover:text-primary-600 transition-colors">服務條款</a>
                                <span>·</span>
                                <a href="/support" className="hover:text-primary-600 transition-colors">聯絡我們</a>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-slate-400 mt-2">
                            本系統依據台灣衛生福利部 ICOPE 標準設計，僅供專業人員使用
                        </p>
                    </div>
                </footer>

                {/* ── iOS-style Bottom Tab Bar ── */}
                <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 lg:hidden">
                    <div className="flex items-stretch justify-around px-2 pt-1.5 pb-[env(safe-area-inset-bottom,8px)]">
                        {[
                            { href: '/dashboard', label: '首頁', icon: Home },
                            { href: '/elders', label: '長輩', icon: Users },
                            { href: '/events', label: '簽到', icon: CalendarCheck },
                            { href: '/subsidy', label: '輔具', icon: LifeBuoy },
                            { href: '/guide', label: '說明', icon: BookOpen },
                        ].filter(tab => canAccessRoute(userRole, tab.href)).map((tab) => {
                            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-colors ${
                                        isActive
                                            ? 'text-primary-600'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <tab.icon className={`w-[22px] h-[22px] ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                                    <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                                        {tab.label}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </main>
        </div>
    )
}
