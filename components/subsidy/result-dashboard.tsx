'use client';

import React from 'react';
import { SubsidyResult } from '@/lib/subsidy/types';

interface ResultDashboardProps {
  result: SubsidyResult;
  onReset: () => void;
}

export default function ResultDashboard({ result, onReset }: ResultDashboardProps) {
  const isA = result.path === 'A';
  const isB = result.path === 'B';
  const isC = result.path === 'C';

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">導航結果</h2>
        <p className="text-sm text-slate-500 mt-1">系統已自動為您判斷最佳路徑</p>
      </div>

      <div
        className={`p-6 rounded-lg mb-6 border-l-8 ${
          isA
            ? 'bg-green-50 border-green-500 text-green-900'
            : isB
            ? 'bg-yellow-50 border-yellow-500 text-yellow-900'
            : 'bg-red-50 border-red-500 text-red-900'
        }`}
      >
        <h3 className="text-2xl font-bold mb-2">
          {isA && '路徑 A：可直接送件'}
          {isB && '路徑 B：請先做評估'}
          {isC && '路徑 C：升級審查 (灰區案件)'}
        </h3>
        {isC && (
          <div className="mt-4 bg-white/60 p-4 rounded-md">
            <p className="font-semibold text-red-800">灰區類別：{result.grayZoneCategory}</p>
            <p className="text-red-700">退件/風險原因：{result.grayZoneReason}</p>
            <p className="text-sm mt-3 text-red-600 font-medium">👉 第一線請勿直接裁決，請將此案轉交總部或縣市審查窗口。</p>
          </div>
        )}
        {isA && (
          <p className="text-green-800 font-medium">
            文件齊全，可以直接進入申請流程，無需等待進一步評估。
          </p>
        )}
        {isB && (
          <p className="text-yellow-800 font-medium">
            此個案需要先補照管中心或輔具中心的評估報告，請協助個案聯繫相關單位。
          </p>
        )}
      </div>

      {result.requiredDocuments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-bold text-slate-800 mb-3">應備文件清單（系統輸出）：</h4>
          <ul className="list-disc list-inside space-y-1 text-slate-700 bg-slate-50 p-4 rounded-md border border-slate-200">
            {result.requiredDocuments.map((doc, idx) => (
              <li key={idx} className="font-medium">{doc}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-4 text-center rounded-lg font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200"
      >
        重新啟動導航
      </button>
    </div>
  );
}
