import { SubsidyCity } from './types';

export const countyRules: Partial<Record<SubsidyCity, { requiresExtraDoc?: boolean; rulesGrayZone?: string }>> = {
  Taipei: {},
  NewTaipei: {},
  Taoyuan: { rulesGrayZone: '租賃認定不清' },
  // Can be expanded as needed to maintain 22 county differences
};
