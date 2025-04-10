import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "expense" | "income";
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({
  transactions,
  isLoading = false,
}: RecentTransactionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            <div className="h-6 w-48 animate-pulse rounded bg-muted"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
                  <div className="space-y-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                    <div className="h-3 w-32 animate-pulse rounded bg-muted"></div>
                  </div>
                </div>
                <div className="h-6 w-20 animate-pulse rounded bg-muted"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between space-x-4"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    transaction.type === "expense"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {transaction.type === "expense" ? (
                    <ArrowDownIcon className="h-5 w-5" />
                  ) : (
                    <ArrowUpIcon className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-medium ${
                    transaction.type === "expense"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {transaction.type === "expense" ? "-" : "+"}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 