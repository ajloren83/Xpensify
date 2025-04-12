import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseCategory } from "@/types/expense";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";

interface ExpenseChartsProps {
  categoryData: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  }[];
  monthlyData: {
    month: string;
    income: number;
    expenses: number;
  }[];
  isLoading?: boolean;
}

export function ExpenseCharts({
  categoryData,
  monthlyData,
  isLoading = false,
}: ExpenseChartsProps) {
  const [activeTab, setActiveTab] = useState("category");
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="category">By Category</TabsTrigger>
              <TabsTrigger value="monthly">By Month</TabsTrigger>
            </TabsList>
            <TabsContent value="category" className="space-y-4">
              {categoryData.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(item.amount, settings.display.currency)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPercentage(item.percentage)}
                  </p>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="monthly" className="space-y-4">
              {monthlyData.map((item) => (
                <div key={item.month} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex gap-4">
                      <span className="text-sm font-medium text-green-500">
                        +{formatCurrency(item.income, settings.display.currency)}
                      </span>
                      <span className="text-sm font-medium text-red-500">
                        -{formatCurrency(item.expenses, settings.display.currency)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(item.income / (item.income + item.expenses)) * 100}%`,
                      }}
                    ></div>
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${(item.expenses / (item.income + item.expenses)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 