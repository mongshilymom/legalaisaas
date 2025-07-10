import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function ClickStatsChart() {
  const [data, setData] = useState<Array<{ price: string; count: number }>>([]);

  const fetchData = async () => {
    const res = await fetch('/api/admin/price-stats');
    const json = await res.json();
    const formatted = Object.entries(json).map(([price, count]) => ({
      price: `₩${Number(price).toLocaleString()}`,
      count: count as number
    }));
    setData(formatted);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h2 className="text-lg font-bold mb-2">추천가 클릭 통계 (실시간)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="price" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
