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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
  const [showDialog, setShowDialog] = useState(false);
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

  const { data: expensesData = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", user?.uid],
    queryFn: () => getExpenses(user?.uid || ""),
    enabled: !!user?.uid,
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user, currentMonth, currentYear]);

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Calculate the correct date range for the selected month
      const startDate = new Date(currentYear, currentMonth, 1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      
      console.log("Loading expenses for date range:", {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        month: currentMonth,
        year: currentYear
      });
      
      // Get expenses without date filtering first to ensure we get data
      const result = await getExpenses(user.uid);
      
      if (result.success && result.expenses) {
        console.log("Fetched expenses:", result.expenses.length);
        
        // Filter expenses by dueDate to ensure they belong to the selected month
        // Use a more robust date parsing approach
        const filteredExpenses = result.expenses.filter(expense => {
          if (!expense.dueDate) return false;
          
          try {
            // Ensure we have a valid date string
            const dueDateStr = expense.dueDate as string;
            const expenseDate = new Date(dueDateStr);
            
            // Check if the date is valid
            if (isNaN(expenseDate.getTime())) {
              console.error("Invalid date:", dueDateStr);
              return false;
            }
            
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
          } catch (error) {
            console.error("Error parsing date:", expense.dueDate, error);
            return false;
          }
        });
        
        console.log("Filtered expenses for current month:", filteredExpenses.length);
        setExpenses(filteredExpenses);
        
        // If no expenses found for the current month, show a message
        if (filteredExpenses.length === 0) {
          toast({
            title: "No expenses found",
            description: `No expenses found for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`,
            variant: "default",
            toastType: "info",
            duration: 5000, // Auto-dismiss after 5 seconds
          });
        }
      } else {
        console.error("Error loading expenses:", result.error);
        setExpenses([]);
        toast({
          title: "Error loading expenses",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
          toastType: "error",
          duration: 8000, // Auto-dismiss after 8 seconds for errors
        });
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      setExpenses([]);
      toast({
        title: "Error loading expenses",
        description: "An unexpected error occurred while loading expenses",
        variant: "destructive",
        toastType: "error",
        duration: 8000, // Auto-dismiss after 8 seconds for errors
      });
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

  const handleDeleteExpense = async (expense: Expense) => {
    if (!user) return;
    
    try {
      // Delete the expense
      const deleteResult = await deleteExpense(user.uid, expense.id || "");
      
      if (deleteResult.success) {
        // If this is an original expense (not a carry forward), delete all its carry forwards
        if (!expense.name.includes("(Carry Forward)")) {
          // Find all carry forward expenses for this transaction
          const carryForwards = expenses.filter(e => 
            e.name === expense.name && 
            e.id !== expense.id && 
            (e.dueDate && expense.dueDate) && // Check if both dates exist
            new Date(e.dueDate as string) > new Date(expense.dueDate as string)
          );
          
          // Delete all carry forward expenses
          for (const cf of carryForwards) {
            await deleteExpense(user.uid, cf.id || "");
          }
        }
        
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
          toastType: "success",
          duration: 5000, // Auto-dismiss after 5 seconds
        });
        
        // Reload expenses to update the UI
        loadExpenses();
      } else {
        throw new Error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
        toastType: "error",
        duration: 8000, // Auto-dismiss after 8 seconds for errors
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedExpenses.length === 0) return;
    
    try {
      // Delete all selected expenses
      for (const expenseId of selectedExpenses) {
        const expense = expenses.find(e => e.id === expenseId);
        if (expense) {
          await handleDeleteExpense(expense);
        }
      }
      
      // Clear selection
      setSelectedExpenses([]);
      
      toast({
        title: "Success",
        description: "Selected transactions deleted successfully",
        toastType: "success",
        duration: 5000, // Auto-dismiss after 5 seconds
      });
    } catch (error) {
      console.error("Error deleting selected expenses:", error);
      toast({
        title: "Error",
        description: "Failed to delete selected transactions",
        variant: "destructive",
        toastType: "error",
        duration: 8000, // Auto-dismiss after 8 seconds for errors
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setEditingExpense(null);
  };

  const handleSaveExpense = async (expenseData: Expense) => {
    if (!user) return;
    
    console.log("Saving expense:", expenseData);
    
    try {
      // Set the due date to the selected month/year
      const dueDate = new Date(currentYear, currentMonth, expenseData.dueDate ? new Date(expenseData.dueDate).getDate() : 1);
      expenseData.dueDate = dueDate.toISOString();
      
      if (expenseData.id) {
        // Update existing expense
        console.log("Updating expense:", expenseData);
        const result = await updateExpense(user.uid, expenseData.id, expenseData);
        if (result.success) {
          toast({
            title: "Success",
            description: "Expense updated successfully",
            toastType: "success",
            duration: 5000, // Auto-dismiss after 5 seconds
          });
          loadExpenses();
        }
      } else {
        // Add new expense
        console.log("Adding new expense:", expenseData);
        const newExpense = {
          ...expenseData,
          userId: user.uid,
          amount: expenseData.toPay,
          toPay: expenseData.toPay || 0,
          willPay: expenseData.willPay || 0,
          remaining: expenseData.remaining || 0,
          type: expenseData.type || "expense",
          category: expenseData.category || "Other",
          status: expenseData.status || "pending",
          notes: expenseData.notes || "",
          createdAt: new Date().toISOString()
        };
        
        const result = await addExpense(newExpense);
        
        console.log("Add result:", result);
        
        if (result.success) {
          // If there's a remaining amount, create a carry forward expense
          if (newExpense.remaining > 0) {
            // Calculate next month's date
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;
            if (nextMonth > 11) {
              nextMonth = 0;
              nextYear++;
            }
            
            const carryForwardExpense = {
              ...newExpense,
              name: newExpense.name,
              amount: newExpense.remaining,
              toPay: newExpense.remaining,
              willPay: 0,
              remaining: newExpense.remaining,
              dueDate: new Date(nextYear, nextMonth, dueDate.getDate()).toISOString(),
              status: "pending",
              createdAt: new Date().toISOString()
            };
            
            console.log("Creating carry forward expense:", carryForwardExpense);
            await addExpense(carryForwardExpense);
          }
          
          toast({
            title: "Success",
            description: "Expense added successfully",
            toastType: "success",
            duration: 5000, // Auto-dismiss after 5 seconds
          });
          loadExpenses();
        }
      }
      
      setShowDialog(false);
      setEditingExpense(null);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
        toastType: "error",
        duration: 8000, // Auto-dismiss after 8 seconds for errors
      });
    }
  };

  const handleMonthYearChange = (month: number, year: number) => {
    console.log('Month/Year changed:', { month, year });
    setCurrentMonth(month);
    setCurrentYear(year);
    // The useEffect with [user, currentMonth, currentYear] dependency will automatically trigger loadExpenses
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "all" as ExpenseType | "all",
      status: "all" as ExpenseStatus | "all",
      category: "all" as ExpenseCategory | "all",
    });
  };

  const filteredExpenses = expenses.filter(expense => {
    if (!expense.dueDate) return false;
    
    const expenseDate = new Date(expense.dueDate);
    const matchesMonth = expenseDate.getMonth() === currentMonth;
    const matchesYear = expenseDate.getFullYear() === currentYear;
    const matchesSearch = filters.search === "" || 
      expense.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      expense.category.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesMonth && matchesYear && matchesSearch;
  });

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setShowDeleteDialog(true);
  };

  const handleBatchDeleteClick = () => {
    if (selectedExpenses.length > 0) {
      setShowBatchDeleteDialog(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      await handleDeleteExpense(expenseToDelete);
      setShowDeleteDialog(false);
      setExpenseToDelete(null);
    }
  };

  const handleBatchDeleteConfirm = async () => {
    await handleDeleteSelected();
    setShowBatchDeleteDialog(false);
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Row 1: Heading and Add Expense Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <div className="flex gap-2">
          {selectedExpenses.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBatchDeleteClick}
              disabled={selectedExpenses.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedExpenses.length})
            </Button>
          )}
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
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
                    <TableHead>Transaction</TableHead>
                    <TableHead>To Pay</TableHead>
                    <TableHead>Will Pay</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={`${expense.id || ''}-${expense.name}-${expense.dueDate}`}>
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
                        {expense.status === "paid" 
                          ? formatCurrency(expense.type === "income" 
                              ? expense.amount + expense.willPay 
                              : expense.amount - expense.willPay)
                          : formatCurrency(expense.type === "income" 
                              ? expense.amount 
                              : -expense.amount)}
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
                            onClick={() => handleDeleteClick(expense)}
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
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <ExpenseDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        expense={editingExpense}
        onSave={handleSaveExpense}
        onClose={handleDialogClose}
        autoTags={autoTags}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
              {expenseToDelete?.remaining && expenseToDelete.remaining > 0 && " All carry forward transactions will also be deleted."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Transactions</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedExpenses.length} selected transaction(s)? 
              This action cannot be undone. All carry forward transactions will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBatchDeleteConfirm}>
              Delete Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 