/**
 * LINE Messaging API 推播通知封裝
 * 用於發送追蹤/後測到期提醒給指導員
 */

// ============================================================================
// 型別
// ============================================================================

interface TextMessage {
    type: 'text'
    text: string
}

interface FlexMessage {
    type: 'flex'
    altText: string
    contents: Record<string, unknown>
}

type LineMessage = TextMessage | FlexMessage

// ============================================================================
// 常數
// ============================================================================

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
const LINE_API_BASE = 'https://api.line.me/v2/bot'

// ============================================================================
// 核心函式
// ============================================================================

/**
 * 發送推播訊息給指定使用者
 */
export async function sendPushMessage(
    lineUserId: string,
    messages: LineMessage[]
): Promise<{ success: boolean; error?: string }> {
    if (!CHANNEL_ACCESS_TOKEN) {
        return { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN 未設定' }
    }

    try {
        const res = await fetch(`${LINE_API_BASE}/message/push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                to: lineUserId,
                messages,
            }),
        })

        if (!res.ok) {
            const body = await res.text()
            return { success: false, error: `LINE API ${res.status}: ${body}` }
        }

        return { success: true }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '未知錯誤'
        return { success: false, error: msg }
    }
}

/**
 * 發送文字訊息
 */
export async function sendTextMessage(
    lineUserId: string,
    text: string
): Promise<{ success: boolean; error?: string }> {
    return sendPushMessage(lineUserId, [{ type: 'text', text }])
}

/**
 * 發送追蹤/後測到期提醒（Flex Message 精美卡片）
 */
export async function sendReminderCard(
    lineUserId: string,
    options: {
        patientName: string
        reminderType: '追蹤' | '後測'
        dueDate: string
        assessmentId?: string
        liffUrl?: string
    }
): Promise<{ success: boolean; error?: string }> {
    const { patientName, reminderType, dueDate, liffUrl } = options

    const emoji = reminderType === '追蹤' ? '🔔' : '📊'
    const color = reminderType === '追蹤' ? '#FF6B35' : '#4F46E5'

    const flexContent: Record<string, unknown> = {
        type: 'bubble',
        size: 'kilo',
        header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: color,
            paddingAll: '15px',
            contents: [
                {
                    type: 'text',
                    text: `${emoji} ICOPE ${reminderType}提醒`,
                    color: '#FFFFFF',
                    weight: 'bold',
                    size: 'md',
                },
            ],
        },
        body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            paddingAll: '15px',
            contents: [
                {
                    type: 'text',
                    text: `長者：${patientName}`,
                    weight: 'bold',
                    size: 'md',
                },
                {
                    type: 'text',
                    text: `${reminderType}到期日：${dueDate}`,
                    size: 'sm',
                    color: '#888888',
                },
                {
                    type: 'text',
                    text: reminderType === '追蹤'
                        ? '初評完成已滿 1 個月，請安排追蹤評估。'
                        : '初評完成已滿 3 個月，請儘速安排後測。',
                    size: 'sm',
                    color: '#666666',
                    wrap: true,
                },
            ],
        },
        footer: liffUrl ? {
            type: 'box',
            layout: 'vertical',
            paddingAll: '15px',
            contents: [
                {
                    type: 'button',
                    action: {
                        type: 'uri',
                        label: `前往${reminderType}`,
                        uri: liffUrl,
                    },
                    style: 'primary',
                    color: color,
                },
            ],
        } : undefined,
    }

    return sendPushMessage(lineUserId, [
        {
            type: 'flex',
            altText: `${emoji} ${patientName} 的 ICOPE ${reminderType}已到期`,
            contents: flexContent,
        },
    ])
}

/**
 * 發送「用印申請待審核」提醒（Flex Message 精美卡片）
 */
export async function sendSealApplicationCard(
    lineUserId: string,
    options: {
        applicantName: string
        department: string
        sealType: string
        borrowDate: string
        purpose: string
        liffUrl?: string
    }
): Promise<{ success: boolean; error?: string }> {
    const { applicantName, department, sealType, borrowDate, purpose, liffUrl } = options

    const flexContent: Record<string, unknown> = {
        type: 'bubble',
        size: 'kilo',
        header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#059669', // Emerald 600
            paddingAll: '15px',
            contents: [
                {
                    type: 'text',
                    text: '📋 新的用印申請待審核',
                    color: '#FFFFFF',
                    weight: 'bold',
                    size: 'md',
                },
            ],
        },
        body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            paddingAll: '15px',
            contents: [
                {
                    type: 'text',
                    text: `申請人：${applicantName} (${department})`,
                    weight: 'bold',
                    size: 'md',
                },
                {
                    type: 'text',
                    text: `借印日期：${borrowDate}`,
                    size: 'sm',
                    color: '#888888',
                },
                {
                    type: 'text',
                    text: `印章類型：${sealType}`,
                    size: 'sm',
                    color: '#333333',
                },
                {
                    type: 'text',
                    text: `用印事宜：${purpose}`,
                    size: 'sm',
                    color: '#666666',
                    wrap: true,
                },
            ],
        },
        footer: liffUrl ? {
            type: 'box',
            layout: 'vertical',
            paddingAll: '15px',
            contents: [
                {
                    type: 'button',
                    action: {
                        type: 'uri',
                        label: '前往系統審核',
                        uri: liffUrl,
                    },
                    style: 'primary',
                    color: '#059669',
                },
            ],
        } : undefined,
    }

    return sendPushMessage(lineUserId, [
        {
            type: 'flex',
            altText: `📋 收到來自 ${applicantName} 的用印申請待審核`,
            contents: flexContent,
        },
    ])
}

/**
 * 發送「用印申請審核結果」提醒給申請人（Flex Message 精美卡片）
 */
export async function sendSealStatusCard(
    lineUserId: string,
    options: {
        sealType: string
        borrowDate: string
        status: 'approved' | 'rejected'
        comment: string | null
        liffUrl?: string
    }
): Promise<{ success: boolean; error?: string }> {
    const { sealType, borrowDate, status, comment, liffUrl } = options

    const isApproved = status === 'approved'
    const color = isApproved ? '#2563EB' : '#DC2626' // Blue for approved, Red for rejected
    const titleText = isApproved ? '✅ 用印申請已核准' : '❌ 用印申請已駁回'

    const flexContent: Record<string, unknown> = {
        type: 'bubble',
        size: 'kilo',
        header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: color,
            paddingAll: '15px',
            contents: [
                {
                    type: 'text',
                    text: titleText,
                    color: '#FFFFFF',
                    weight: 'bold',
                    size: 'md',
                },
            ],
        },
        body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            paddingAll: '15px',
            contents: [
                {
                    type: 'text',
                    text: `印章類型：${sealType}`,
                    weight: 'bold',
                    size: 'md',
                },
                {
                    type: 'text',
                    text: `借印日期：${borrowDate}`,
                    size: 'sm',
                    color: '#888888',
                },
                {
                    type: 'text',
                    text: comment ? `審核意見：${comment}` : (isApproved ? '審核意見：無 (可前往用印)' : '審核意見：無'),
                    size: 'sm',
                    color: isApproved ? '#2563EB' : '#DC2626',
                    wrap: true,
                    weight: 'bold',
                },
            ],
        },
        footer: liffUrl ? {
            type: 'box',
            layout: 'vertical',
            paddingAll: '15px',
            contents: [
                {
                    type: 'button',
                    action: {
                        type: 'uri',
                        label: '查看我的申請',
                        uri: liffUrl,
                    },
                    style: 'secondary',
                    color: '#E5E7EB',
                },
            ],
        } : undefined,
    }

    return sendPushMessage(lineUserId, [
        {
            type: 'flex',
            altText: titleText,
            contents: flexContent,
        },
    ])
}
