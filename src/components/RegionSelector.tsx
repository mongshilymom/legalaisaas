import React from 'react';

export const RegionSelector = ({ selectedRegion, onChange }: { selectedRegion: string; onChange: (value: string) => void }) => {
  return (
    <select
      value={selectedRegion}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="KR">🇰🇷 대한민국 (PIPA)</option>
      <option value="EU">🇪🇺 유럽연합 (GDPR)</option>
      <option value="US">🇺🇸 미국 (CCPA)</option>
    </select>
  );
};