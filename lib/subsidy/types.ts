export type SubsidyCity = 'Taipei' | 'NewTaipei' | 'Taoyuan' | 'Taichung' | 'Tainan' | 'Kaohsiung' | 'Keelung' | 'HsinchuCity' | 'HsinchuCounty' | 'Miaoli' | 'Changhua' | 'Nantou' | 'Yunlin' | 'ChiayiCity' | 'ChiayiCounty' | 'Pingtung' | 'Yilan' | 'Hualien' | 'Taitung' | 'Penghu' | 'Kinmen' | 'Lienchiang';
export type SubsidyIdentity = 'General' | 'LowIncome' | 'MiddleLowIncome' | 'Disability' | 'DualIdentity';
export type SubsidyCategory = 'Purchase' | 'Rent' | 'HomeModification';
export type SubsidyProgress = 'PreEvaluation' | 'PreSubmit' | 'AlreadyPurchased' | 'AlreadyConstructed';
export type SpecialCondition = 'None' | 'CrossCounty' | 'Dementia' | 'HighFallRisk' | 'Polypharmacy';

export interface SubsidyRequest {
  city: SubsidyCity | null;
  identity: SubsidyIdentity | null;
  category: SubsidyCategory | null;
  progress: SubsidyProgress | null;
  specialCondition: SpecialCondition | null;
  documentsComplete: boolean | null;
}

export type SubsidyPath = 'A' | 'B' | 'C'; // A: 可直接送件, B: 先做評估, C: 升級審查
export type GrayZoneCategory = 'Qualification' | 'Process' | 'Document' | 'Risk' | 'Rule' | null;

export interface SubsidyResult {
  path: SubsidyPath;
  grayZoneCategory?: GrayZoneCategory;
  grayZoneReason?: string;
  requiredDocuments: string[];
}
