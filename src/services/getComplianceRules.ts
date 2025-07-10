import regionData from './complianceRegions.json';

export const getComplianceRules = (regionCode: string) => {
  return regionData[regionCode] || null;
};