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
