import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ClickEvent {
  timestamp: string;
  button: string;
  user: string;
  session: string;
  page: string;
}

interface ClickStats {
  button: string;
  count: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ClickLogAnalyzer: React.FC = () => {
  const [clickData, setClickData] = useState<ClickEvent[]>([]);
  const [stats, setStats] = useState<ClickStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parseClickLogs = async () => {
      try {
        const response = await fetch('/click-events.log');
        const logText = await response.text();
        
        const events: ClickEvent[] = logText
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const match = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*button=([^,]+).*user=([^,]+).*session=([^,]+).*page=(.+)/);
            if (match) {
              return {
                timestamp: match[1],
                button: match[2],
                user: match[3],
                session: match[4],
                page: match[5]
              };
            }
            return null;
          })
          .filter(event => event !== null) as ClickEvent[];

        const buttonCounts = events.reduce((acc, event) => {
          acc[event.button] = (acc[event.button] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const total = events.length;
        const statsData = Object.entries(buttonCounts)
          .map(([button, count]) => ({
            button,
            count,
            percentage: Math.round((count / total) * 100)
          }))
          .sort((a, b) => b.count - a.count);

        setClickData(events);
        setStats(statsData);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing click logs:', error);
        setLoading(false);
      }
    };

    parseClickLogs();
  }, []);

  if (loading) {
    return <div className="p-4">Loading click log analysis...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Click Log Analysis Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Button Click Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="button" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Click Percentage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({button, percentage}) => `${button} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Detailed Statistics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Button</th>
                <th className="px-4 py-2 text-left">Click Count</th>
                <th className="px-4 py-2 text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 font-medium">{stat.button}</td>
                  <td className="px-4 py-2">{stat.count}</td>
                  <td className="px-4 py-2">{stat.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Click Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Button</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Page</th>
              </tr>
            </thead>
            <tbody>
              {clickData.slice(-10).map((event, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{event.timestamp}</td>
                  <td className="px-4 py-2">{event.button}</td>
                  <td className="px-4 py-2">{event.user}</td>
                  <td className="px-4 py-2">{event.page}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClickLogAnalyzer;