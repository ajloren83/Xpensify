import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, PiggyBankIcon, WalletIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";

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
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
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
          <div className="text-2xl font-bold">{formatCurrency(balance, settings.display.currency)}</div>
          <p className="text-xs text-muted-foreground">
            {balance >= 0 ? "+" : ""}{formatCurrency(balance - (income - expenses), settings.display.currency)} from last month
          </p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(income, settings.display.currency)}</div>
          <p className="text-xs text-muted-foreground">
            +{formatCurrency(income, settings.display.currency)} this month
          </p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(expenses, settings.display.currency)}</div>
          <p className="text-xs text-muted-foreground">
            -{formatCurrency(expenses, settings.display.currency)} this month
          </p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings</CardTitle>
          <PiggyBankIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(savings, settings.display.currency)}</div>
          <p className="text-xs text-muted-foreground">
            {savings >= 0 ? "+" : ""}{formatCurrency(savings, settings.display.currency)} total savings
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 