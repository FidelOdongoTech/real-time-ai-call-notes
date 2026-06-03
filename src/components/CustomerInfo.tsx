import { Phone, Hash, User, Building2, CreditCard } from 'lucide-react';
import type { Customer } from '../types';
import { cn } from '../utils/cn';

interface CustomerInfoProps {
  customer: Customer;
  compact?: boolean;
}

const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE').format(amount);
};

export function CustomerInfo({ customer, compact = false }: CustomerInfoProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
          {customer.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{customer.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{customer.phone}</p>
        </div>
      </div>
    );
  }

  const statusColor = customer.debtAmount > 0 ? 'text-rose-500' : 'text-emerald-500';
  const statusBadge = customer.debtAmount > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      {/* Profile Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-base font-semibold shadow-sm">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{customer.name}</h2>
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', statusBadge)}>
                {customer.debtAmount > 0 ? 'Outstanding' : 'Cleared'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Customer Profile</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-4 pb-4 space-y-2">
        <InfoRow icon={Phone} label="Phone" value={customer.phone} />
        <InfoRow icon={Hash} label="Account" value={customer.accountNumber} />
        <InfoRow icon={Building2} label="Branch" value="Nairobi" />
      </div>

      {/* Debt Section */}
      <div className="mx-4 mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Outstanding Balance</span>
          <CreditCard className={cn('w-3.5 h-3.5', statusColor)} />
        </div>
        <p className={cn('text-lg font-bold tabular-nums', statusColor)}>
          KES {formatKES(customer.debtAmount)}
        </p>
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: typeof User;
  label: string;
  value: string;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-slate-400 dark:text-slate-500">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xs font-medium text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
