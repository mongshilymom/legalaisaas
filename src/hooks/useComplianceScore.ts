import { useCallback } from 'react';

interface ComplianceCheck {
  label: string;
  status: 'pass' | 'warning' | 'fail';
}

export const useComplianceScore = (checks: ComplianceCheck[]) => {
  const calculate = useCallback(() => {
    const scores = { pass: 25, warning: 15, fail: 5 };
    const total = checks.reduce((sum, check) => sum + scores[check.status], 0);
    const grade = total >= 90 ? 'A' : total >= 70 ? 'B' : 'C';
    return { score: total, grade };
  }, [checks]);

  return calculate();
};