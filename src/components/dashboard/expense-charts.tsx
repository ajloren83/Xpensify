import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseCategory } from "@/types/expense";
import { formatCurrency, formatPercentage } from "@/lib/utils";

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

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full animate-pulse rounded bg-muted"></div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full animate-pulse rounded bg-muted"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort categories by amount (descending)
  const sortedCategories = [...categoryData].sort((a, b) => b.amount - a.amount);

  // Calculate total expenses for percentage
  const totalExpenses = categoryData.reduce((sum, item) => sum + item.amount, 0);

  // Generate colors for categories
  const categoryColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedCategories.map((item, index) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        categoryColors[index % categoryColors.length]
                      }`}
                    ></div>
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${
                      categoryColors[index % categoryColors.length]
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPercentage(item.percentage)}</span>
                  <span>
                    {formatCurrency(item.amount)} of {formatCurrency(totalExpenses)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="category">By Category</TabsTrigger>
              <TabsTrigger value="monthly">By Month</TabsTrigger>
            </TabsList>
            <TabsContent value="category" className="space-y-4">
              {sortedCategories.map((item, index) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          categoryColors[index % categoryColors.length]
                        }`}
                      ></div>
                      <span className="text-sm font-medium">{item.category}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${
                        categoryColors[index % categoryColors.length]
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="monthly" className="space-y-4">
              {monthlyData.map((item, index) => (
                <div key={item.month} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex gap-4">
                      <span className="text-sm font-medium text-green-500">
                        +{formatCurrency(item.income)}
                      </span>
                      <span className="text-sm font-medium text-red-500">
                        -{formatCurrency(item.expenses)}
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