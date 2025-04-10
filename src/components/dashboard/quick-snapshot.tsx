import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, PiggyBankIcon, WalletIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface QuickSnapshotProps {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  isLoading?: boolean;
}

export function QuickSnapshot({
  balance,
  income,
  expenses,
  savings,
  isLoading = false,
}: QuickSnapshotProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
              </CardTitle>
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="h-7 w-24 animate-pulse rounded bg-muted"></div>
              <p className="mt-1 text-xs text-muted-foreground">
                <div className="h-3 w-16 animate-pulse rounded bg-muted"></div>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <WalletIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
          <p className="text-xs text-muted-foreground">
            {balance >= 0 ? "+" : ""}{formatCurrency(balance - (income - expenses))} from last month
          </p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(income)}</div>
          <p className="text-xs text-muted-foreground">
            +{formatCurrency(income)} this month
          </p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
          <p className="text-xs text-muted-foreground">
            -{formatCurrency(expenses)} this month
          </p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings</CardTitle>
          <PiggyBankIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(savings)}</div>
          <p className="text-xs text-muted-foreground">
            {savings >= 0 ? "+" : ""}{formatCurrency(savings)} total savings
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 