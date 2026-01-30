import { useState } from 'react';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Phone,
  Clock,
  Target,
  AlertCircle,
  Handshake,
  Calendar
} from 'lucide-react';
import type { CallHistoryItem } from '../types';
import { cn } from '../utils/cn';

interface AnalyticsDashboardProps {
  history: CallHistoryItem[];
}

// Format number with Kenyan locale
const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE').format(amount);
};

export function AnalyticsDashboard({ history }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Filter by date range
  const filteredHistory = history.filter(call => {
    if (dateRange === 'all') return true;
    const days = dateRange === '7d' ? 7 : 30;
    const cutoffDate = startOfDay(subDays(new Date(), days));
    return isAfter(new Date(call.startedAt), cutoffDate);
  });

  // Calculate statistics
  const totalCalls = filteredHistory.length;
  const totalDuration = filteredHistory.reduce((sum, c) => sum + c.duration, 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const totalPromised = filteredHistory.reduce((sum, c) => sum + c.totalPromisedAmount, 0);
  const totalPromises = filteredHistory.reduce((sum, c) => sum + c.promisesCount, 0);

  // Sentiment distribution
  const sentimentData = [
    { name: 'Positive', value: filteredHistory.filter(c => c.sentiment === 'positive').length, color: '#22c55e' },
    { name: 'Neutral', value: filteredHistory.filter(c => c.sentiment === 'neutral').length, color: '#6b7280' },
    { name: 'Negative', value: filteredHistory.filter(c => c.sentiment === 'negative').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Calls over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, 'EEE');
    const dateStr = format(date, 'MMM d');
    const callsOnDay = filteredHistory.filter(c => 
      format(new Date(c.startedAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      day: dayStr,
      date: dateStr,
      calls: callsOnDay.length,
      promised: callsOnDay.reduce((sum, c) => sum + c.totalPromisedAmount, 0),
    };
  });

  // Performance metrics
  const avgSentimentScore = totalCalls > 0
    ? Math.round(
        filteredHistory.reduce((sum, c) => {
          const score = c.sentiment === 'positive' ? 85 : c.sentiment === 'neutral' ? 50 : 25;
          return sum + score;
        }, 0) / totalCalls
      )
    : 0;

  const conversionRate = totalCalls > 0
    ? Math.round((filteredHistory.filter(c => c.promisesCount > 0).length / totalCalls) * 100)
    : 0;

  // Top performing days
  const dayPerformance = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
    const dayCalls = filteredHistory.filter(c => format(new Date(c.startedAt), 'EEE') === day);
    return {
      day,
      calls: dayCalls.length,
      successRate: dayCalls.length > 0 
        ? Math.round((dayCalls.filter(c => c.promisesCount > 0).length / dayCalls.length) * 100)
        : 0
    };
  });

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Yet</h3>
          <p className="text-sm text-center max-w-md">
            Complete some sessions to see analytics and insights here.
            Track your performance, sentiment trends, and promise rates over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Performance insights and trends</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                dateRange === range
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Phone}
          label="Total Sessions"
          value={totalCalls.toString()}
          trend={null}
          color="blue"
        />
        <MetricCard
          icon={Clock}
          label="Avg Duration"
          value={`${Math.floor(avgDuration / 60)}:${(avgDuration % 60).toString().padStart(2, '0')}`}
          trend={null}
          color="purple"
        />
        <MetricCard
          icon={Target}
          label="Conversion Rate"
          value={`${conversionRate}%`}
          subtext={`${totalPromises} promises`}
          trend={conversionRate > 50 ? 'up' : conversionRate < 30 ? 'down' : null}
          color="green"
        />
        <MetricCard
          icon={Handshake}
          label="Total Promised"
          value={`KES ${formatKES(totalPromised)}`}
          trend={null}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Sessions This Week</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [value as number, 'Sessions']}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorCalls)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Sentiment Distribution</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value, name) => [`${value} sessions`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm">No sentiment data</p>
            )}
          </div>
          {/* Sentiment Score */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Sentiment Score</span>
              <span className={cn(
                'text-lg font-bold',
                avgSentimentScore >= 70 ? 'text-green-500' :
                avgSentimentScore >= 40 ? 'text-yellow-500' : 'text-red-500'
              )}>
                {avgSentimentScore}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  avgSentimentScore >= 70 ? 'bg-green-500' :
                  avgSentimentScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${avgSentimentScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance by Day of Week */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Performance by Day</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="calls" name="Sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="successRate" name="Success Rate %" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Promised Amounts Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Handshake className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Promised Amounts This Week</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [`KES ${formatKES(value as number)}`, 'Promised']}
              />
              <Line
                type="monotone"
                dataKey="promised"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sessions Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Quick Stats</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredHistory.filter(c => c.sentiment === 'positive').length}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">Happy Customers</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredHistory.filter(c => c.promisesCount > 0).length}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">With Promises</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(totalDuration / 60)}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Total Minutes</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalPromised > 0 ? `${(totalPromised / totalCalls / 1000).toFixed(1)}K` : '0'}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">Avg Promise (KES)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: typeof Phone;
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | null;
  color: 'blue' | 'purple' | 'green' | 'amber';
}

function MetricCard({ icon: Icon, label, value, subtext, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    green: 'from-green-500 to-green-600 shadow-green-500/25',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-lg',
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
        </div>
        {trend && (
          <TrendingUp className={cn(
            'w-5 h-5',
            trend === 'up' ? 'text-green-500' : 'text-red-500 rotate-180'
          )} />
        )}
      </div>
    </div>
  );
}
