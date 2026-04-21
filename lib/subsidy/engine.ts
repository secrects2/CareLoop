import { SubsidyRequest, SubsidyResult, GrayZoneCategory } from './types';
import { countyRules } from './county-rules';

export function detectGrayZone(req: SubsidyRequest): { category: GrayZoneCategory; reason: string } | null {
  // 01 Qualification Gray Zone
  if (req.identity === 'DualIdentity') return { category: 'Qualification', reason: '長照與身障雙重身分' };
  if (req.specialCondition === 'CrossCounty') return { category: 'Qualification', reason: '戶籍與居住地不同(跨縣市)' };

  // 02 Process Gray Zone
  if (req.progress === 'AlreadyPurchased' || req.progress === 'AlreadyConstructed') {
    return { category: 'Process', reason: '已先購買或先施工 (退件高風險)' };
  }

  // 04 Risk Gray Zone
  if (req.specialCondition && ['Dementia', 'HighFallRisk', 'Polypharmacy'].includes(req.specialCondition)) {
    return { category: 'Risk', reason: `高風險個案: ${req.specialCondition === 'Dementia' ? '失智疑慮' : req.specialCondition === 'HighFallRisk' ? '跌倒高風險' : '多重用藥紅燈'}` };
  }

  // 05 Rule Gray Zone (County specific)
  if (req.city && countyRules[req.city]?.rulesGrayZone) {
    return { category: 'Rule', reason: `縣市規定差異: ${countyRules[req.city]?.rulesGrayZone}` };
  }

  return null;
}

export function evaluateSubsidyPath(req: SubsidyRequest): SubsidyResult {
  // 1. Check for Gray Zones (Path C: Red)
  const grayZone = detectGrayZone(req);
  if (grayZone) {
    return {
      path: 'C',
      grayZoneCategory: grayZone.category,
      grayZoneReason: grayZone.reason,
      requiredDocuments: [],
    };
  }

  // 2. Check Document Completeness (Path C: Red if not complete but they want to submit)
  if (req.documentsComplete === false) {
    return {
      path: 'C',
      grayZoneCategory: 'Document',
      grayZoneReason: '關鍵資料不足或異常 (缺件/過期)',
      requiredDocuments: ['身分證影本', '評估報告 (若有)', '印章'], // Suggest basic docs
    };
  }

  // 3. Check Progress (Path B: Yellow if needs pre-evaluation)
  if (req.progress === 'PreEvaluation') {
    return {
      path: 'B',
      requiredDocuments: ['身分證影本', '身心障礙證明/診斷證明'],
    };
  }

  // 4. Default Path A (Green: Ready to submit)
  return {
    path: 'A',
    requiredDocuments: ['身分證影本', '核定公文', '購買發票/收據', '產品保固書', '存摺影本', '申請書'],
  };
}
