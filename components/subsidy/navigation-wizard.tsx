'use client';

import React, { useState } from 'react';
import { SubsidyRequest, SubsidyCity, SubsidyIdentity, SubsidyCategory, SubsidyProgress, SpecialCondition } from '@/lib/subsidy/types';
import { evaluateSubsidyPath } from '@/lib/subsidy/engine';
import ResultDashboard from './result-dashboard';

const initialRequest: SubsidyRequest = {
  city: null,
  identity: null,
  category: null,
  progress: null,
  specialCondition: null,
  documentsComplete: null,
};

export default function NavigationWizard() {
  const [step, setStep] = useState(1);
  const [req, setReq] = useState<SubsidyRequest>(initialRequest);

  const handleNext = (updates: Partial<SubsidyRequest>) => {
    setReq((prev) => ({ ...prev, ...updates }));
    setStep((prev) => prev + 1);
  };

  const handleReset = () => {
    setReq(initialRequest);
    setStep(1);
  };

  if (step > 6) {
    const result = evaluateSubsidyPath(req);
    return <ResultDashboard result={result} onReset={handleReset} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100 mb-20 animate-in fade-in zoom-in duration-300">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2 px-1">
          <span>Q1. 縣市</span>
          <span>Q2. 身分</span>
          <span>Q3. 類別</span>
          <span>Q4. 進度</span>
          <span>Q5. 條件</span>
          <span>Q6. 文件</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
          {[1,2,3,4,5,6].map((idx) => (
             <div key={idx} className={`h-full flex-1 border-r border-white/30 last:border-0 transition-colors duration-500 ${step >= idx ? 'bg-teal-500' : 'bg-transparent'}`} />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <h2 className="text-xl font-bold text-slate-800 text-center mb-6">
        {step === 1 && '請問個案所在縣市為何？'}
        {step === 2 && '請判斷個案身分別？'}
        {step === 3 && '個案的輔具需求類別？'}
        {step === 4 && '目前的辦理進度？'}
        {step === 5 && '是否有特殊灰區條件？'}
        {step === 6 && '文件是否齊備？'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {step === 1 && (
          <>
            {(['Taipei', 'NewTaipei', 'Taoyuan', 'Taichung', 'Tainan', 'Kaohsiung'] as SubsidyCity[]).map(city => (
              <OptionButton key={city} label={getCityLabel(city)} onClick={() => handleNext({ city })} />
            ))}
            {/* Add more cities practically, just keeping 6 for mockup */}
            <OptionButton label="其他縣市" onClick={() => handleNext({ city: 'HsinchuCity' })} />
          </>
        )}

        {step === 2 && (
          <>
            <OptionButton label="一般戶" onClick={() => handleNext({ identity: 'General' })} />
            <OptionButton label="低收入戶" onClick={() => handleNext({ identity: 'LowIncome' })} />
            <OptionButton label="中低收入戶" onClick={() => handleNext({ identity: 'MiddleLowIncome' })} />
            <OptionButton label="單純身心障礙" onClick={() => handleNext({ identity: 'Disability' })} />
            <OptionButton label="長照與身障雙重身分" className="border-red-200 hover:border-red-400" onClick={() => handleNext({ identity: 'DualIdentity' })} />
          </>
        )}

        {step === 3 && (
          <>
            <OptionButton label="購置輔具" onClick={() => handleNext({ category: 'Purchase' })} />
            <OptionButton label="租賃輔具" onClick={() => handleNext({ category: 'Rent' })} />
            <OptionButton label="居家無障礙改善 (居改)" onClick={() => handleNext({ category: 'HomeModification' })} />
          </>
        )}

        {step === 4 && (
          <>
            <OptionButton label="先送件審查" onClick={() => handleNext({ progress: 'PreSubmit' })} />
            <OptionButton label="需先做評估報" onClick={() => handleNext({ progress: 'PreEvaluation' })} className="border-yellow-200 hover:border-yellow-400" />
            <OptionButton label="已購買/已先施工" onClick={() => handleNext({ progress: 'AlreadyPurchased' })} className="border-red-200 hover:border-red-400" />
          </>
        )}

        {step === 5 && (
          <>
            <OptionButton label="無特殊狀況" onClick={() => handleNext({ specialCondition: 'None' })} />
            <OptionButton label="跨縣市申請 (戶外居住地不同)" onClick={() => handleNext({ specialCondition: 'CrossCounty' })} className="border-red-200 hover:border-red-400" />
            <OptionButton label="失智症疑慮" onClick={() => handleNext({ specialCondition: 'Dementia' })} className="border-red-200 hover:border-red-400" />
            <OptionButton label="跌倒高風險" onClick={() => handleNext({ specialCondition: 'HighFallRisk' })} className="border-red-200 hover:border-red-400" />
            <OptionButton label="多重用藥紅燈" onClick={() => handleNext({ specialCondition: 'Polypharmacy' })} className="border-red-200 hover:border-red-400" />
          </>
        )}

        {step === 6 && (
           <>
            <OptionButton label="文件齊全 (身分證/申請書等皆有)" onClick={() => handleNext({ documentsComplete: true })} className="bg-green-50 hover:bg-green-100 border-green-200 text-green-800" />
            <OptionButton label="關鍵資料不足或異常" onClick={() => handleNext({ documentsComplete: false })} className="bg-red-50 hover:bg-red-100 border-red-200 text-red-800" />
          </>
        )}
      </div>
      
      {step > 1 && (
        <div className="mt-8 text-center">
            <button onClick={() => setStep(prev => prev - 1)} className="text-sm font-semibold text-slate-400 hover:text-slate-600 underline underline-offset-4">返回上一題</button>
        </div>
      )}
    </div>
  );
}

function OptionButton({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-teal-400 hover:bg-teal-50 hover:shadow-sm transition-all duration-200 text-slate-700 font-semibold active:scale-[0.98] ${className}`}
    >
      {label}
    </button>
  );
}

function getCityLabel(city: SubsidyCity): string {
    const map: Record<string, string> = {
        Taipei: '台北市',
        NewTaipei: '新北市',
        Taoyuan: '桃園市',
        Taichung: '台中市',
        Tainan: '台南市',
        Kaohsiung: '高雄市'
    };
    return map[city] || city;
}
