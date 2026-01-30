import { Phone, Hash, User } from 'lucide-react';
import type { Customer } from '../types';
import { cn } from '../utils/cn';

interface CustomerInfoProps {
  customer: Customer;
  compact?: boolean;
}

// Format number with Kenyan locale
const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE').format(amount);
};

export function CustomerInfo({ customer, compact = false }: CustomerInfoProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
          {customer.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-semibold shadow-lg">
          {customer.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{customer.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">Customer</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <InfoRow icon={Phone} label="Phone" value={customer.phone} />
        <InfoRow icon={Hash} label="Account" value={customer.accountNumber} />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <span className="text-xs font-bold">KES</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
            <p className="font-medium text-red-600 dark:text-red-400">
              KES {formatKES(customer.debtAmount)}
            </p>
          </div>
        </div>
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
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
