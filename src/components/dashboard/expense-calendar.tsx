// components/dashboard/expense-calendar.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { ExpenseTransaction, TransactionType } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

export default function ExpenseCalendar() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [expensesByDate, setExpensesByDate] = useState<Record<string, number>>({});
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch expenses for the current month
  useEffect(() => {
    const fetchExpensesByDate = async () => {
      if (!user || !date) return;
      
      setLoading(true);
      
      try {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const expensesRef = collection(db, 'users', user.uid, 'transactions');
        const expensesQuery = query(
          expensesRef,
          where('type', '==', TransactionType.EXPENSE),
          where('date', '>=', startOfMonth.toISOString()),
          where('date', '<=', endOfMonth.toISOString())
        );
        
        const expensesSnapshot = await getDocs(expensesQuery);
        const expenses = expensesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExpenseTransaction[];
        
        // Group expenses by date
        const groupedExpenses: Record<string, number> = {};
        expenses.forEach(expense => {
          const dateKey = expense.date.split('T')[0]; // Get YYYY-MM-DD part
          if (!groupedExpenses[dateKey]) {
            groupedExpenses[dateKey] = 0;
          }
          groupedExpenses[dateKey] += expense.amount;
        });
        
        setExpensesByDate(groupedExpenses);
      } catch (error) {
        console.error('Error fetching expenses by date:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpensesByDate();
  }, [user, date?.getMonth(), date?.getFullYear()]);

  // Fetch transactions for selected day
  const fetchDayTransactions = async (selectedDate: Date) => {
    if (!user) return;
    
    try {
      const startOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      
      const endOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        23, 59, 59, 999
      );
      
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const transactionsQuery = query(
        transactionsRef,
        where('date', '>=', startOfDay.toISOString()),
        where('date', '<=', endOfDay.toISOString())
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExpenseTransaction[];
      
      setSelectedDayTransactions(transactions);
    } catch (error) {
      console.error('Error fetching day transactions:', error);
    }
  };

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      setDate(day);
      fetchDayTransactions(day);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expense Calendar</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDayClick}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="rounded-md border p-4">
          <h3 className="mb-2 font-medium">
            {date ? format(date, "MMMM d, yyyy") : "Select a date"}
          </h3>
          
          {selectedDayTransactions.length > 0 ? (
            <div className="space-y-2">
              {selectedDayTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div>
                    <p className="font-medium">{transaction.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category}
                    </p>
                  </div>
                  <p className={cn(
                    "font-medium",
                    transaction.type === TransactionType.EXPENSE
                      ? "text-red-500"
                      : "text-green-500"
                  )}>
                    {transaction.type === TransactionType.EXPENSE ? "-" : "+"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No transactions for this day
            </p>
          )}
        </div>
      )}
    </div>
  );
}