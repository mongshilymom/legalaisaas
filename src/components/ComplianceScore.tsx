import { useComplianceScore } from './useComplianceScore';

interface ComplianceCheck {
  label: string;
  status: 'pass' | 'warning' | 'fail';
}

export const ComplianceScore = ({ checks }: { checks: ComplianceCheck[] }) => {
  const { score, grade } = useComplianceScore(checks);

  return (
    <div className="mt-4 p-4 border rounded bg-white shadow">
      <h3 className="text-lg font-bold mb-2">📊 종합 컴플라이언스 점수</h3>
      <p className="text-xl font-semibold">
        {score}/100점 — <span className="text-blue-600">등급 {grade}</span>
      </p>
    </div>
  );
};