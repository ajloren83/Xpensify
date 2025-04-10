"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Edit, Trash2 } from "lucide-react";

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete, isSelected, onSelect }: ExpenseCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "income" ? "bg-blue-500" : "bg-purple-500";
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          )}
          <CardTitle className="text-sm font-medium">
            {expense.name}
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className={getTypeColor(expense.type)}>
            {expense.type}
          </Badge>
          <Badge variant="secondary" className={getStatusColor(expense.status)}>
            {expense.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">To Pay</p>
            <p className="text-lg font-semibold">{formatCurrency(expense.toPay)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Will Pay</p>
            <p className="text-lg font-semibold">{formatCurrency(expense.willPay)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold">{formatCurrency(expense.remaining)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-lg font-semibold">{formatDate(expense.dueDate)}</p>
          </div>
        </div>
        {expense.notes && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-sm">{expense.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(expense)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDelete(expense)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 