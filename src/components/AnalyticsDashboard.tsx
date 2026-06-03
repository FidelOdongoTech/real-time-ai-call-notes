import { useState } from 'react';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { motion } from 'framer-motion';
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
  TrendingUp,
  Phone,
  Clock,
  Target,
  Handshake,
  Calendar
} from 'lucide-react';
import type { CallHistoryItem } from '../types';
import { cn } from '../utils/cn';

interface AnalyticsDashboardProps {
  history: CallHistoryItem[];
}

const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE').format(amount);
};

export function AnalyticsDashboard({ history }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  const filteredHistory = history.filter(call => {
    if (dateRange === 'all') return true;
    const days = dateRange === '7d' ? 7 : 30;
    const cutoffDate = startOfDay(subDays(new Date(), days));
    return isAfter(new Date(call.startedAt), cutoffDate);
  });

  const totalCalls = filteredHistory.length;
  const totalDuration = filteredHistory.reduce((sum, c) => sum + c.duration, 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const totalPromised = filteredHistory.reduce((sum, c) => sum + c.totalPromisedAmount, 0);
  const totalPromises = filteredHistory.reduce((sum, c) => sum + c.promisesCount, 0);

  const chartColors = {
    primary: '#6366f1',
    primaryLight: '#a5b4fc',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    grid: '#e2e8f0',
    text: '#94a3b8',
  };

  const sentimentData = [
    { name: 'Positive', value: filteredHistory.filter(c => c.sentiment === 'positive').length, color: '#10b981' },
    { name: 'Neutral', value: filteredHistory.filter(c => c.sentiment === 'neutral').length, color: '#94a3b8' },
    { name: 'Negative', value: filteredHistory.filter(c => c.sentiment === 'negative').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

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

  const tooltipStyle = {
    backgroundColor: '#1e293b',
    border: 'none',
    borderRadius: '6px',
    color: '#f1f5f9',
    fontSize: '12px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8">
        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
          <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No Data Yet</h3>
          <p className="text-xs text-center max-w-md leading-relaxed">
            Complete some sessions to see analytics and insights here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-indigo-500 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Analytics</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Performance insights and trends</p>
          </div>
        </div>
        <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-700 rounded-md">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-[4px] transition-all duration-200',
                dateRange === range
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Phone} label="Total Sessions" value={totalCalls.toString()} color="indigo" />
        <MetricCard icon={Clock} label="Avg Duration" value={`${Math.floor(avgDuration / 60)}:${(avgDuration % 60).toString().padStart(2, '0')}`} color="violet" />
        <MetricCard icon={Target} label="Conversion" value={`${conversionRate}%`} subtext={`${totalPromises} promises`} trend={conversionRate > 50 ? 'up' : conversionRate < 30 ? 'down' : null} color="emerald" />
        <MetricCard icon={Handshake} label="Total Promised" value={`KES ${formatKES(totalPromised)}`} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Calendar} title="Sessions This Week" color="text-indigo-500">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="day" stroke={chartColors.text} fontSize={11} tickLine={false} />
                <YAxis stroke={chartColors.text} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value as number, 'Sessions']} />
                <Area type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} fill="url(#colorCalls)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard icon={null} title="Sentiment Distribution" color="text-emerald-500">
          <div className="h-56 flex items-center justify-center">
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value} sessions`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No sentiment data</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Performance by Day */}
      <ChartCard icon={TrendingUp} title="Performance by Day" color="text-emerald-500">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="day" stroke={chartColors.text} fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke={chartColors.text} fontSize={11} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke={chartColors.text} fontSize={11} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar yAxisId="left" dataKey="calls" name="Sessions" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="successRate" name="Success Rate %" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Promised Amounts */}
      <ChartCard icon={Handshake} title="Promised Amounts This Week" color="text-amber-500">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="day" stroke={chartColors.text} fontSize={11} tickLine={false} />
              <YAxis stroke={chartColors.text} fontSize={11} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`KES ${formatKES(value as number)}`, 'Promised']} />
              <Line type="monotone" dataKey="promised" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: filteredHistory.filter(c => c.sentiment === 'positive').length, label: 'Happy Customers', color: 'text-emerald-500' },
            { value: filteredHistory.filter(c => c.promisesCount > 0).length, label: 'With Promises', color: 'text-sky-500' },
            { value: Math.round(totalDuration / 60), label: 'Total Minutes', color: 'text-violet-500' },
            { value: totalPromised > 0 ? `${(totalPromised / totalCalls / 1000).toFixed(1)}K` : '0', label: 'Avg Promise (KES)', color: 'text-amber-500', prefix: 'KES ' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
              <p className={cn('text-lg font-bold tabular-nums', stat.color)}>
                {stat.prefix ? `${stat.prefix}${stat.value}` : stat.value}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface ChartCardProps {
  icon: typeof Calendar | null;
  title: string;
  color: string;
  children: React.ReactNode;
}

function ChartCard({ icon: Icon, title, children }: ChartCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
      {Icon && (
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
      )}
      {!Icon && (
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}

interface MetricCardProps {
  icon: typeof Phone;
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | null;
  color: 'indigo' | 'violet' | 'emerald' | 'amber';
}

function MetricCard({ icon: Icon, label, value, subtext, trend, color }: MetricCardProps) {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
    violet: 'from-violet-500 to-violet-600 shadow-violet-500/20',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cn('w-8 h-8 rounded-md bg-gradient-to-br flex items-center justify-center shadow-sm', colorClasses[color])}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
          {subtext && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{subtext}</p>}
        </div>
        {trend && (
          <TrendingUp className={cn('w-4 h-4', trend === 'up' ? 'text-emerald-500' : 'text-red-500 rotate-180')} />
        )}
      </div>
    </div>
  );
}
