"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/lib/settings-context";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getExpenses } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { Wallet, Banknote, TrendingUp, Calendar } from "lucide-react";

export function FinancialSummary() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [previousMonthBalance, setPreviousMonthBalance] = useState(0);
  const [extraIncome, setExtraIncome] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [currentMonthSalary, setCurrentMonthSalary] = useState(0);

  useEffect(() => {
    const loadFinancialData = async () => {
      if (!user) return;

      try {
        // Get current date
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const isLastDayOfMonth = currentDate.getDate() === lastDayOfMonth;

        // Get current month's expenses
        const result = await getExpenses(user.uid, currentMonth, currentYear);
        if (!result.success) return;

        // Calculate extra income (income type expenses)
        const extraIncomeAmount = result.expenses
          ?.filter(expense => expense.type === 'income')
          .reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

        setExtraIncome(extraIncomeAmount);

        // Handle salary based on credit date and current date
        let salaryAmount = 0;
        const salarySettings = settings.salarySettings;
        
        if (salarySettings.lastUpdated) {
          const lastUpdatedMonth = salarySettings.lastUpdated.month;
          const lastUpdatedYear = salarySettings.lastUpdated.year;
          
          // If salary was updated in the current month or
          // if it's the last day of the month and salary is set to last day
          if (
            (lastUpdatedMonth === currentMonth && lastUpdatedYear === currentYear) ||
            (isLastDayOfMonth && 
             (salarySettings.creditDateType === 'last' || 
              (salarySettings.creditDateType === 'custom' && salarySettings.customDate === lastDayOfMonth)))
          ) {
            salaryAmount = salarySettings.amount;
          }
        }

        setCurrentMonthSalary(salaryAmount);

        // Calculate total balance
        const totalBalance = salaryAmount + extraIncomeAmount + previousMonthBalance;
        setTotalBalance(totalBalance);
      } catch (error) {
        console.error("Error loading financial data:", error);
      }
    };

    loadFinancialData();
  }, [user, settings.salarySettings, previousMonthBalance]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance, settings.display.currency)}</div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Salary</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(currentMonthSalary, settings.display.currency)}</div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Extra Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(extraIncome, settings.display.currency)}</div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Previous Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(previousMonthBalance, settings.display.currency)}</div>
        </CardContent>
      </Card>
    </div>
  );
} 