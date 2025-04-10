"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  getExpenses, 
  addExpense, 
  updateExpense, 
  deleteExpense, 
  batchDeleteExpenses,
  getAutoTags,
  Expense
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  PlusIcon, 
  TrashIcon, 
  EditIcon, 
  FilterIcon, 
  CalendarIcon, 
  TagIcon,
  LayoutGridIcon,
  TableIcon,
  Plus,
  Trash2
} from "lucide-react";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { MonthYearSelector } from "@/components/expenses/month-year-selector";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExpenseCategory, ExpenseStatus, ExpenseType } from "@/types/expense";
import { cn } from "@/lib/utils";
import { ExpenseService } from "@/lib/services/expense-service";

const expenseService = new ExpenseService();

type ViewMode = "table" | "card";

export default function ExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    type: "all" as ExpenseType | "all",
    status: "all" as ExpenseStatus | "all",
    category: "all" as ExpenseCategory | "all",
  });

  const { data: expensesData = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", user?.uid],
    queryFn: () => getExpenses(user?.uid || ""),
    enabled: !!user?.uid,
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
      loadAutoTags();
    }
  }, [user, currentMonth, currentYear, filters]);

  const loadExpenses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      
      const result = await getExpenses(user.uid, {
        startDate,
        endDate,
        category: filters.category || undefined,
        type: filters.type as ExpenseType || undefined,
        status: filters.status as ExpenseStatus || undefined
      });
      
      if (!result.success || !result.expenses) {
        console.error("Error loading expenses:", result.error);
        return;
      }
      
      setExpenses(result.expenses);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutoTags = async () => {
    if (!user) return;
    
    try {
      const tags = await getAutoTags(user.uid);
      setAutoTags(tags);
    } catch (error) {
      console.error("Error loading auto tags:", error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(expenses.map(expense => expense.id || ""));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (expenseId: string) => {
    if (selectedExpenses.includes(expenseId)) {
      setSelectedExpenses(selectedExpenses.filter(id => id !== expenseId));
    } else {
      setSelectedExpenses([...selectedExpenses, expenseId]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!user) return;
    try {
      await Promise.all(
        selectedExpenses.map((id) => expenseService.deleteExpense(user.uid, id))
      );
      setSelectedExpenses([]);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (error) {
      console.error('Error deleting expenses:', error);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!user) return;
    try {
      if (expense.id) {
        await expenseService.deleteExpense(user.uid, expense.id);
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
  };

  const handleSaveExpense = async (expense: Expense) => {
    if (!user) return;
    
    try {
      if (editingExpense) {
        await updateExpense(expense.id || "", expense);
      } else {
        await addExpense({
          ...expense,
          userId: user.uid
        });
      }
      loadExpenses();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const handleMonthYearChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "all" as ExpenseType | "all",
      status: "all" as ExpenseStatus | "all",
      category: "all" as ExpenseCategory | "all",
    });
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesType = filters.type === "all" || expense.type === filters.type;
    const matchesStatus = filters.status === "all" || expense.status === filters.status;
    const matchesCategory = filters.category === "all" || expense.category === filters.category;

    return matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-4 max-w-full">
      {/* Row 1: Heading and Add Expense Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Row 2: Search, View Toggle, and Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px]">
          <ExpenseFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "table" ? "card" : "table")}
        >
          {viewMode === "table" ? (
            <LayoutGridIcon className="h-4 w-4" />
          ) : (
            <TableIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Row 3: Month Selector */}
      <div className="flex items-center w-full">
        <MonthYearSelector
          currentMonth={currentMonth}
          currentYear={currentYear}
          onChange={handleMonthYearChange}
        />
      </div>

      {/* Row 4: Table or Card View */}
      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedExpenses.length === expenses.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Expense</TableHead>
                    <TableHead>To Pay</TableHead>
                    <TableHead>Will Pay</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedExpenses.includes(expense.id || "")}
                          onCheckedChange={() => handleSelectExpense(expense.id || "")}
                        />
                      </TableCell>
                      <TableCell>{expense.name}</TableCell>
                      <TableCell>{formatCurrency(expense.toPay)}</TableCell>
                      <TableCell>{formatCurrency(expense.willPay)}</TableCell>
                      <TableCell>{formatCurrency(expense.remaining)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            {
                              "bg-green-100 text-green-700":
                                expense.type === "income",
                              "bg-red-100 text-red-700":
                                expense.type === "expense",
                            }
                          )}
                        >
                          {expense.type === "income" ? "Income" : "Expense"}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(expense.dueDate)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            {
                              "bg-green-100 text-green-700":
                                expense.status === "paid",
                              "bg-yellow-100 text-yellow-700":
                                expense.status === "pending",
                              "bg-red-100 text-red-700":
                                expense.status === "overdue",
                            }
                          )}
                        >
                          {expense.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(expense)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />
          ))}
        </div>
      )}

      <ExpenseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        expense={editingExpense}
        onSave={handleSaveExpense}
        onClose={handleDialogClose}
        autoTags={autoTags}
      />
    </div>
  );
} 