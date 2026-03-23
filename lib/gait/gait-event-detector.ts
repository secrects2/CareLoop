/**
 * Gait Analysis - Gait Event Detector
 * 
 * 偵測步態事件：IC (Initial Contact) / TO (Toe Off)
 * 支援側面與正面視角
 * 所有事件使用真實 timestamp（不假設固定 FPS）
 */

import { type RealLandmark, GAIT_LANDMARKS, distance2D } from './coordinate-transformer'

export interface GaitEvent {
    type: 'IC' | 'TO'
    side: 'left' | 'right'
    timestamp: number      // epoch ms
    anklePosition: { x: number; y: number }
    heelPosition: { x: number; y: number }
}

export interface StepData {
    stepNumber: number
    side: 'left' | 'right'
    icTimestamp: number
    toTimestamp: number
    stepLengthPx: number
    stanceDurationMs: number
    swingDurationMs: number
    stepTimestamp: number   // 中間時間
}

interface AnkleHistory {
    y: number
    x: number
    timestamp: number
}

const HISTORY_SIZE = 15

export class GaitEventDetector {
    private leftAnkleHistory: AnkleHistory[] = []
    private rightAnkleHistory: AnkleHistory[] = []
    private events: GaitEvent[] = []
    private steps: StepData[] = []
    private lastICLeft: GaitEvent | null = null
    private lastICRight: GaitEvent | null = null
    private lastTOLeft: GaitEvent | null = null
    private lastTORight: GaitEvent | null = null
    private minEventIntervalMs = 250 // 最快步頻 240 steps/min ≈ 250ms/step

    /**
     * 每幀呼叫，傳入轉換後的 landmarks
     */
    processFrame(landmarks: RealLandmark[], timestamp: number, viewAngle: 'side' | 'front' = 'side') {
        const lAnkle = landmarks[GAIT_LANDMARKS.LEFT_ANKLE]
        const rAnkle = landmarks[GAIT_LANDMARKS.RIGHT_ANKLE]
        const lHeel = landmarks[GAIT_LANDMARKS.LEFT_HEEL]
        const rHeel = landmarks[GAIT_LANDMARKS.RIGHT_HEEL]
        const lFootIdx = landmarks[GAIT_LANDMARKS.LEFT_FOOT_INDEX]
        const rFootIdx = landmarks[GAIT_LANDMARKS.RIGHT_FOOT_INDEX]

        if (!lAnkle || !rAnkle || lAnkle.visibility < 0.4 || rAnkle.visibility < 0.4) return

        // 記錄歷史
        this.leftAnkleHistory.push({ y: lAnkle.y, x: lAnkle.x, timestamp })
        this.rightAnkleHistory.push({ y: rAnkle.y, x: rAnkle.x, timestamp })
        if (this.leftAnkleHistory.length > HISTORY_SIZE) this.leftAnkleHistory.shift()
        if (this.rightAnkleHistory.length > HISTORY_SIZE) this.rightAnkleHistory.shift()

        if (this.leftAnkleHistory.length < 5) return

        // 側面視角 IC/TO 偵測
        if (viewAngle === 'side') {
            this.detectSideIC('left', lAnkle, lHeel, lFootIdx, timestamp)
            this.detectSideIC('right', rAnkle, rHeel, rFootIdx, timestamp)
            this.detectSideTO('left', lAnkle, lFootIdx, timestamp)
            this.detectSideTO('right', rAnkle, rFootIdx, timestamp)
        } else {
            this.detectFrontIC('left', lAnkle, timestamp)
            this.detectFrontIC('right', rAnkle, timestamp)
        }

        // 從事件對構建步數
        this.buildSteps()
    }

    /**
     * 側面視角 IC 偵測：ankle.y 達到局部最低點
     */
    private detectSideIC(
        side: 'left' | 'right',
        ankle: RealLandmark,
        heel: RealLandmark | undefined,
        footIndex: RealLandmark | undefined,
        timestamp: number
    ) {
        const history = side === 'left' ? this.leftAnkleHistory : this.rightAnkleHistory
        const lastIC = side === 'left' ? this.lastICLeft : this.lastICRight
        
        if (history.length < 5) return
        if (lastIC && (timestamp - lastIC.timestamp) < this.minEventIntervalMs) return

        const len = history.length
        const prev2 = history[len - 3]
        const prev1 = history[len - 2]
        const curr = history[len - 1]

        // 局部最低點 (y 值最大 = 畫面最下方 = 最接近地面)
        if (prev1.y > prev2.y && prev1.y >= curr.y) {
            // 額外檢查：heel 接近 ankle（腳跟觸地）
            let heelCheck = true
            if (heel && heel.visibility > 0.4) {
                heelCheck = Math.abs(heel.y - ankle.y) < 30
            }

            if (heelCheck) {
                const event: GaitEvent = {
                    type: 'IC',
                    side,
                    timestamp: prev1.timestamp,
                    anklePosition: { x: prev1.x, y: prev1.y },
                    heelPosition: heel ? { x: heel.x, y: heel.y } : { x: prev1.x, y: prev1.y },
                }
                this.events.push(event)
                if (side === 'left') this.lastICLeft = event
                else this.lastICRight = event
            }
        }
    }

    /**
     * 側面視角 TO 偵測：ankle.y 開始上升（離開地面）
     */
    private detectSideTO(
        side: 'left' | 'right',
        ankle: RealLandmark,
        footIndex: RealLandmark | undefined,
        timestamp: number
    ) {
        const history = side === 'left' ? this.leftAnkleHistory : this.rightAnkleHistory
        const lastTO = side === 'left' ? this.lastTOLeft : this.lastTORig
        const lastIC = side === 'left' ? this.lastICLeft : this.lastICRight

        if (!lastIC) return // 需要先有 IC
        if (lastTO && (timestamp - lastTO.timestamp) < this.minEventIntervalMs) return

        const len = history.length
        if (len < 5) return

        const prev2 = history[len - 3]
        const prev1 = history[len - 2]
        const curr = history[len - 1]

        // 局部最高點後開始上升（y 變小 = 離開地面）
        // 但 TO 應在 IC 之後
        if (prev1.y < prev2.y && prev1.y <= curr.y && lastIC.timestamp < prev1.timestamp) {
            const event: GaitEvent = {
                type: 'TO',
                side,
                timestamp: prev1.timestamp,
                anklePosition: { x: prev1.x, y: prev1.y },
                heelPosition: { x: prev1.x, y: prev1.y },
            }
            this.events.push(event)
            if (side === 'left') this.lastTOLeft = event
            else this.lastTORight = event
        }
    }

    /**
     * 正面視角 IC 偵測：ankle.x 達到遠離中軸的極值
     */
    private detectFrontIC(side: 'left' | 'right', ankle: RealLandmark, timestamp: number) {
        const history = side === 'left' ? this.leftAnkleHistory : this.rightAnkleHistory
        const lastIC = side === 'left' ? this.lastICLeft : this.lastICRight

        if (history.length < 5) return
        if (lastIC && (timestamp - lastIC.timestamp) < this.minEventIntervalMs) return

        const len = history.length
        const prev2 = history[len - 3]
        const prev1 = history[len - 2]
        const curr = history[len - 1]

        // Y 軸局部最低點（腳最接近地面）
        if (prev1.y > prev2.y && prev1.y >= curr.y) {
            const event: GaitEvent = {
                type: 'IC',
                side,
                timestamp: prev1.timestamp,
                anklePosition: { x: prev1.x, y: prev1.y },
                heelPosition: { x: prev1.x, y: prev1.y },
            }
            this.events.push(event)
            if (side === 'left') this.lastICLeft = event
            else this.lastICRight = event
        }
    }

    /**
     * 從 IC/TO 事件構建步數
     */
    private buildSteps() {
        // 找連續的 IC 對（左IC → 右IC 或 右IC → 左IC）
        const ics = this.events.filter(e => e.type === 'IC').sort((a, b) => a.timestamp - b.timestamp)
        
        const existingIds = new Set(this.steps.map(s => `${s.side}-${s.icTimestamp}`))
        
        for (let i = 1; i < ics.length; i++) {
            const prev = ics[i - 1]
            const curr = ics[i]
            
            // 一步 = 對側 IC → IC
            if (prev.side !== curr.side) {
                const id = `${curr.side}-${curr.timestamp}`
                if (existingIds.has(id)) continue

                const stepDuration = curr.timestamp - prev.timestamp
                if (stepDuration < 200 || stepDuration > 3000) continue // 異常排除

                // 找此步的 TO
                const tos = this.events.filter(e =>
                    e.type === 'TO' && e.side === prev.side &&
                    e.timestamp > prev.timestamp && e.timestamp < curr.timestamp
                )
                const to = tos[0]

                const stanceDuration = to ? (to.timestamp - prev.timestamp) : stepDuration * 0.6
                const swingDuration = to ? (curr.timestamp - to.timestamp) : stepDuration * 0.4

                // 步長：兩腳 heel 在 IC 時刻的水平距離
                const stepLengthPx = Math.abs(curr.heelPosition.x - prev.heelPosition.x)

                this.steps.push({
                    stepNumber: this.steps.length + 1,
                    side: curr.side,
                    icTimestamp: curr.timestamp,
                    toTimestamp: to?.timestamp || 0,
                    stepLengthPx,
                    stanceDurationMs: stanceDuration,
                    swingDurationMs: swingDuration,
                    stepTimestamp: (prev.timestamp + curr.timestamp) / 2,
                })
            }
        }
    }

    // Getters
    getEvents(): GaitEvent[] { return [...this.events] }
    getSteps(): StepData[] { return [...this.steps] }
    getValidStepCount(): number { return this.steps.length }

    getLeftSteps(): StepData[] { return this.steps.filter(s => s.side === 'left') }
    getRightSteps(): StepData[] { return this.steps.filter(s => s.side === 'right') }

    reset() {
        this.leftAnkleHistory = []
        this.rightAnkleHistory = []
        this.events = []
        this.steps = []
        this.lastICLeft = null
        this.lastICRight = null
        this.lastTOLeft = null
        this.lastTORight = null
    }

    // Fix typo
    private get lastTORig(): GaitEvent | null { return this.lastTORight }
}
