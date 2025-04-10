// components/dashboard/transaction-list.tsx
import { formatCurrency, formatDate } from '@/lib/utils';
import { ExpenseTransaction, TransactionType } from '@/lib/types';
import { ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

interface TransactionListProps {
  transactions: ExpenseTransaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-muted-foreground">No transactions to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              transaction.type === TransactionType.INCOME 
                ? 'bg-green-500/10' 
                : 'bg-red-500/10'
            }`}>
              {transaction.type === TransactionType.INCOME ? (
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div>
              <p className="font-semibold">{transaction.name}</p>
              <div className="flex items-center text-xs text-muted-foreground gap-2">
                <span>{formatDate(transaction.date)}</span>
                {transaction.category && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      <span>{transaction.category}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className={`font-semibold ${
            transaction.type === TransactionType.INCOME 
              ? 'text-green-500' 
              : 'text-red-500'
          }`}>
            {transaction.type === TransactionType.INCOME ? '+' : '-'} 
            {formatCurrency(transaction.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}