// components/dashboard/transaction-list.tsx
import { formatCurrency, formatDate } from '@/lib/utils';
import { ExpenseTransaction, TransactionType } from '@/lib/types';
import { ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';

interface TransactionListProps {
  transactions: ExpenseTransaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const { settings } = useSettings();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No transactions found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              transaction.type === TransactionType.INCOME 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              {transaction.type === TransactionType.INCOME ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-medium">{transaction.name}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.category}
              </p>
            </div>
          </div>
          <p className={`font-semibold ${
            transaction.type === TransactionType.INCOME 
              ? 'text-green-500' 
              : 'text-red-500'
          }`}>
            {transaction.type === TransactionType.INCOME ? '+' : '-'} 
            {formatCurrency(transaction.amount, settings.display.currency)}
          </p>
        </div>
      ))}
    </div>
  );
}