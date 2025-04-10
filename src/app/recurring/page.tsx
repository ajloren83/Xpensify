"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getRecurringExpenses, deleteRecurringExpense, updateRecurringExpense } from "@/lib/db";
import { RecurringExpense } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusIcon, TrashIcon, EditIcon, FilterIcon } from "lucide-react";
import { RecurringExpenseDialog } from "@/components/recurring/recurring-expense-dialog";

type FilterStatus = "all" | "active" | "upcoming" | "finished";

export default function RecurringPage() {
  const { user } = useAuth();
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  useEffect(() => {
    if (user) {
      loadRecurringExpenses();
    }
  }, [user, filterStatus]);

  const loadRecurringExpenses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await getRecurringExpenses(user.uid);
      
      if (!result.success || !result.recurringExpenses) {
        console.error("Error loading recurring expenses:", result.error);
        return;
      }
      
      // Apply filter
      let filteredExpenses = result.recurringExpenses;
      if (filterStatus !== "all") {
        const now = new Date();
        filteredExpenses = result.recurringExpenses.filter((expense: RecurringExpense) => {
          if (filterStatus === "active") {
            return !expense.endDate || new Date(expense.endDate) > now;
          } else if (filterStatus === "upcoming") {
            return new Date(expense.startDate) > now;
          } else if (filterStatus === "finished") {
            return expense.endDate && new Date(expense.endDate) <= now;
          }
          return true;
        });
      }
      
      setRecurringExpenses(filteredExpenses);
    } catch (error) {
      console.error("Error loading recurring expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(recurringExpenses.map(expense => expense.id || ""));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (expenseId: string, checked: boolean) => {
    if (checked) {
      setSelectedExpenses([...selectedExpenses, expenseId]);
    } else {
      setSelectedExpenses(selectedExpenses.filter(id => id !== expenseId));
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedExpenses.length === 0) return;
    
    try {
      await Promise.all(selectedExpenses.map(id => deleteRecurringExpense(id)));
      setSelectedExpenses([]);
      loadRecurringExpenses();
    } catch (error) {
      console.error("Error deleting recurring expenses:", error);
    }
  };

  const handleEditExpense = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
  };

  const handleSaveExpense = async (expense: RecurringExpense) => {
    if (!user) return;
    
    try {
      if (editingExpense) {
        await updateRecurringExpense(expense.id || "", expense);
      } else {
        // Add new expense logic would go here
      }
      loadRecurringExpenses();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving recurring expense:", error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recurring Expenses</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Recurring Expense
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recurring Expenses</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expenses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedExpenses.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Selected ({selectedExpenses.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded bg-muted"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedExpenses.length === recurringExpenses.length && recurringExpenses.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Expense Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Finish Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No recurring expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  recurringExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedExpenses.includes(expense.id || "")}
                          onCheckedChange={(checked) => handleSelectExpense(expense.id || "", checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{expense.name}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{formatDate(expense.dueDate)}</TableCell>
                      <TableCell>{expense.endDate ? formatDate(expense.endDate) : "Infinite"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          !expense.endDate || new Date(expense.endDate) > new Date() 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {!expense.endDate || new Date(expense.endDate) > new Date() ? "Active" : "Finished"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                          <EditIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RecurringExpenseDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        expense={editingExpense}
        onSave={handleSaveExpense}
        onClose={handleDialogClose}
      />
    </div>
  );
} 