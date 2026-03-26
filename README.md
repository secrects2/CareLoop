# 惠生檢測平台 (EPA Tool)

> 專為社區據點、日照中心與運動指導員打造的長者健康管理與 AI 動作分析平台

## ✨ 核心功能

### 🔐 雙重登入系統
- **指導員/管理員後台**：透過 Google/Email 登入，管理長輩資料與檢測數據。
- **長輩簽到系統**：整合 **LINE Login (LIFF)**，長輩用 LINE 掃描活動 QR Code 即可快速簽到並自動建立基本資料。

### 👥 長輩與活動管理
- **長輩管理 (Elders)**：完整 CRUD 操作、專屬 QR Code 產生、前後測進度追蹤。
- **活動簽到 (Events)**：建立活動場次、即時查看 LINE 簽到名單、一鍵同步簽到長輩至個人管理列表。

### 🤖 三大 AI & 檢測模組
1. **地板滾球 AI 分析 (Boccia Analysis)** 🎯
   - 結合 MediaPipe 即時追蹤投球動作。
   - 分析指標：手肘關節活動度 (ROM)、軀幹穩定度、出手速度。
   - 自動判斷代償動作與手部顫抖。
2. **3D 步態分析 (Gait Analysis)** 👣
   - 單鏡頭即時捕捉全身骨架。
   - 分析指標：步速、步幅、雙腳支撐期比例、左右腳對稱性。
   - 自動產生防跌風險評估報告。
3. **ICOPE 評估** 📋
   - 內建衛福部「長者功能評估(ICOPE)」量表。
   - 涵蓋認知、行動、營養、視力、聽力、憂鬱六大面向初評與後測。

### 📊 數據匯出與儀表板
- **綜合儀表板**：直觀視覺化統計管理長輩數、辦理活動數、分析與檢測進度。
- **Excel 報告匯出**：單鍵匯出長輩的所有檢測歷史紀錄與 AI 分析數據。

## 🚀 快速開始

### 1. 配置環境變數

```bash
cp .env.example .env.local
```

編輯 `.env.local` 檔案：
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE Login (用於長輩簽到)
NEXT_PUBLIC_LIFF_ID=your-liff-id
```

### 2. 資料庫建置

在 Supabase Studio 的 SQL Editor 中執行系統所需的 Table 建置腳本 (包含 `elders`, `events`, `event_checkins`, `analysis_sessions`, `gait_analysis_sessions` 等)。

### 3. 第三方服務設定

1. **Google OAuth**：至 Supabase Authentication 啟用 Google 供應商。
2. **LINE Developer**：
   - 建立 LINE Login Channel。
   - 建立 LIFF App (大小設為 Full)。
   - 將 LIFF ID 填入環境變數。
   - 設定 Callback URL 指向部署網域的 `/login`。

### 4. 本地運行

```bash
npm install
npm run dev
```

## 📁 專案重點結構

```text
epa_tool/
├── app/
│   ├── (auth)/login/         # 管理員登入 / LINE 簽到處理
│   ├── (dashboard)/          # 全域儀表板與功能目錄
│   │   ├── dashboard/        # 數據統計首頁
│   │   ├── elders/           # 長輩資料庫
│   │   ├── events/           # 活動與簽到管理
│   │   ├── analysis/         # 地板滾球 AI 分析
│   │   ├── gait-analysis/    # 3D 步態 AI 分析
│   │   └── icope/            # 長者功能評估
│   ├── api/                  # 後端 API 路由
│   └── checkin/              # 公開的長輩簽到前台
├── components/
│   ├── gait/                 # 步態分析相關元件
│   └── events/               # 活動管理相關元件
└── lib/
    ├── analysis/             # MediaPipe 核心演算法
    └── supabase/             # 資料庫客戶端
```

## 🔧 技術堆疊

- **前端**：Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript
- **後端 & 資料庫**：Supabase (PostgreSQL, Auth, Edge Functions)
- **AI 視覺引擎**：MediaPipe Pose & Holistic (@mediapipe/tasks-vision)
- **視覺化與圖示**：Lucide React, qrcode.react
- **第三方整合**：LINE Front-end Framework (LIFF)

## 📄 授權條款

Private - 惠生醫藥集團版權所有
