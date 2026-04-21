import React from 'react';
import NavigationWizard from '@/components/subsidy/navigation-wizard';

export default function SubsidyPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50/50 py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/50 text-teal-800 text-sm font-semibold mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            第一線 90 秒判路引擎
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            22 縣市補助導航系統
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto font-medium">
            把地方差異收斂成同一套判路邏輯，讓第一線 90 秒內給出一致答案。遇到灰區條件直接交由系統升級審查。
          </p>
        </div>

        <NavigationWizard />

      </div>
    </div>
  );
}
