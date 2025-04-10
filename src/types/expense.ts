export type ExpenseType = "expense" | "income";

export type ExpenseCategory =
  | "Food"
  | "Transportation"
  | "Housing"
  | "Utilities"
  | "Insurance"
  | "Healthcare"
  | "Entertainment"
  | "Shopping"
  | "Education"
  | "Savings"
  | "Bills"
  | "Travel"
  | "Other";

export type ExpenseStatus = "pending" | "paid" | "overdue";

export interface Expense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringExpenseId?: string;
}

export interface RecurringExpense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  startDate: string;
  dueDate: string;
  finishDate: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  frequency: "daily" | "weekly" | "monthly" | "yearly";
}

export interface ExpenseSummary {
  total: number;
  byCategory: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  }[];
  byMonth: {
    month: string;
    income: number;
    expenses: number;
  }[];
}

export interface ExpenseFilters {
  search?: string;
  type?: ExpenseType;
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
}

export interface ExpenseStats {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  savings: number;
  byCategory: Record<ExpenseCategory, number>;
  byStatus: Record<ExpenseStatus, number>;
  byType: Record<ExpenseType, number>;
} 