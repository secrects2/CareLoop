// ============================================================================
// EPA Tool — Role-Based Access Control (RBAC)
// 四級角色：super_admin → sub_admin → instructor → employee
// ============================================================================

export type UserRole = 'super_admin' | 'sub_admin' | 'instructor' | 'employee'

/** 角色層級數值（越大權限越高） */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  sub_admin: 50,
  instructor: 10,
  employee: 5,
}

/** 角色顯示名稱 */
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '最高管理員',
  sub_admin: '子管理員',
  instructor: '指導員',
  employee: '惠生員工',
}

/** 角色 Badge 樣式 */
export const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  super_admin: 'bg-rose-100 text-rose-700 border-rose-200',
  sub_admin: 'bg-amber-100 text-amber-700 border-amber-200',
  instructor: 'bg-slate-100 text-slate-600 border-slate-200',
  employee: 'bg-sky-100 text-sky-700 border-sky-200',
}

/** 功能路由可見性 — 定義哪些角色可以存取哪些路由 */
export const FEATURE_VISIBILITY: Record<string, UserRole[]> = {
  '/dashboard':          ['super_admin', 'sub_admin', 'instructor', 'employee'],
  '/elders':             ['super_admin', 'sub_admin', 'instructor'],
  '/locations':          ['super_admin', 'sub_admin', 'instructor'],
  '/events':             ['super_admin', 'sub_admin', 'instructor'],
  '/subsidy':            ['super_admin', 'sub_admin', 'instructor'],
  '/icope':              ['super_admin', 'sub_admin', 'instructor'],
  '/ai-lab':             ['super_admin', 'sub_admin', 'instructor'],
  '/gait-analysis':      ['super_admin', 'sub_admin', 'instructor'],
  '/analysis':           ['super_admin', 'sub_admin', 'instructor'],
  '/guide':              ['super_admin', 'sub_admin', 'instructor', 'employee'],
  '/admin':              ['super_admin'],                             // 僅最高管理員
  '/seal-application':   ['super_admin', 'sub_admin', 'employee'],     // 最高管理員 + 子管理員 + 惠生員工
  '/privacy':            ['super_admin', 'sub_admin', 'instructor', 'employee'],
  '/terms':              ['super_admin', 'sub_admin', 'instructor', 'employee'],
  '/contact':            ['super_admin', 'sub_admin', 'instructor', 'employee'],
}

/**
 * 檢查角色能否存取指定路由
 * 支援巢狀路由：/elders/123 會匹配 /elders
 */
export function canAccessRoute(role: UserRole | string | null | undefined, path: string): boolean {
  if (!role) return false
  const normalizedRole = role as UserRole
  
  // 先精確匹配
  if (FEATURE_VISIBILITY[path]) {
    return FEATURE_VISIBILITY[path].includes(normalizedRole)
  }
  
  // 巢狀路由：找最長匹配的父路由
  const matchingRoute = Object.keys(FEATURE_VISIBILITY)
    .filter(route => path.startsWith(route + '/') || path === route)
    .sort((a, b) => b.length - a.length)[0]
  
  if (matchingRoute) {
    return FEATURE_VISIBILITY[matchingRoute].includes(normalizedRole)
  }
  
  // 未定義的路由預設允許（如 /privacy, /terms 等靜態頁）
  return true
}

/** 是否為管理員（super_admin 或 sub_admin） */
export function isAdmin(role: UserRole | string | null | undefined): boolean {
  return role === 'super_admin' || role === 'sub_admin'
}

/** 是否為最高管理員 */
export function isSuperAdmin(role: UserRole | string | null | undefined): boolean {
  return role === 'super_admin'
}

/** 角色 A 的權限是否 >= 角色 B */
export function hasHigherOrEqualRole(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB]
}

/** 取得可以被某角色管理的角色列表 */
export function getManageableRoles(currentRole: UserRole): UserRole[] {
  if (currentRole === 'super_admin') return ['sub_admin', 'instructor', 'employee']
  return []
}
