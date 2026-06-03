import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, User, Hash, X, Phone } from 'lucide-react';
import type { Customer } from '../types';

const params = new URLSearchParams(window.location.search);

interface NewCallFormProps {
  onStart: (customer: Customer) => void;
  onCancel: () => void;
}

export function NewCallForm({ onStart, onCancel }: NewCallFormProps) {
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: params.get('phone') || '',
    accountNumber: params.get('account') || '',
    debtAmount: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customer.name && customer.phone && customer.accountNumber && customer.debtAmount > 0) {
      onStart(customer);
    }
  };

  const isValid = customer.name && customer.phone && customer.accountNumber && customer.debtAmount > 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">New Session</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enter customer details</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <FormField
            label="Customer Name"
            icon={User}
            type="text"
            value={customer.name}
            onChange={(v) => setCustomer({ ...customer, name: v })}
            placeholder="Enter customer name"
          />
          <FormField
            label="Phone Number"
            icon={Phone}
            type="tel"
            value={customer.phone}
            onChange={(v) => setCustomer({ ...customer, phone: v })}
            placeholder="+254 7XX XXX XXX"
          />
          <FormField
            label="Account Number"
            icon={Hash}
            type="text"
            value={customer.accountNumber}
            onChange={(v) => setCustomer({ ...customer, accountNumber: v })}
            placeholder="ACC-2024-0001"
          />
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Outstanding Debt (KES)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">KES</span>
              <input
                type="number"
                value={customer.debtAmount || ''}
                onChange={(e) => setCustomer({ ...customer, debtAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                step="1"
                className="w-full pl-11 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600/60 rounded-md text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-3 border border-slate-200/60 dark:border-slate-600/60 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 py-2 px-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
            >
              <Mic className="w-3.5 h-3.5" />
              Start Session
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  icon: typeof User;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function FormField({ label, icon: Icon, type, value, onChange, placeholder }: FormFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600/60 rounded-md text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
        />
      </div>
    </div>
  );
}
