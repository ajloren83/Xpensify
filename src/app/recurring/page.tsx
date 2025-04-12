"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getRecurringExpenses, deleteRecurringExpense, updateRecurringExpense, addRecurringExpense } from "@/lib/db";
import { RecurringExpense } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusIcon, TrashIcon, EditIcon, FilterIcon, SearchIcon, LayoutGridIcon, TableIcon } from "lucide-react";
import { RecurringExpenseDialog } from "@/components/recurring/recurring-expense-dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Create a simple toggle group component since the UI component is missing
const ToggleGroup = ({ type, value, onValueChange, children }: { 
  type: "single" | "multiple", 
  value: string, 
  onValueChange: (value: string) => void, 
  children: React.ReactNode 
}) => {
  return (
    <div className="inline-flex rounded-md border border-input bg-background">
      {children}
    </div>
  );
};

const ToggleGroupItem = ({ value, ariaLabel, children, onClick }: { 
  value: string, 
  ariaLabel: string, 
  children: React.ReactNode,
  onClick?: () => void
}) => {
  return (
    <button
      className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

type FilterStatus = "all" | "active" | "upcoming" | "finished";
type ViewMode = "table" | "card";

// Extend the RecurringExpense type to include description
interface ExtendedRecurringExpense extends RecurringExpense {
  description?: string;
}

export default function RecurringPage() {
  const { user } = useAuth();
  const [recurringExpenses, setRecurringExpenses] = useState<ExtendedRecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExtendedRecurringExpense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExtendedRecurringExpense | null>(null);

  useEffect(() => {
    if (user) {
      loadRecurringExpenses();
    }
  }, [user, filterStatus]);

  const loadRecurringExpenses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getRecurringExpenses(user.uid, filterStatus !== "all" ? filterStatus : undefined);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recurring expenses');
      }
      
      setRecurringExpenses(result.recurringExpenses || []);
    } catch (err: any) {
      console.error('Error fetching recurring expenses:', err);
      setError(err.message || 'An error occurred while fetching recurring expenses');
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
      await loadRecurringExpenses();
    } catch (error) {
      console.error("Error deleting recurring expenses:", error);
    }
  };

  const handleEditExpense = (expense: ExtendedRecurringExpense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
  };

  const handleSaveExpense = async (expense: ExtendedRecurringExpense) => {
    if (!user) return;
    
    try {
      if (editingExpense) {
        await updateRecurringExpense(expense.id || "", expense);
      } else {
        // Add new expense
        const newExpense = {
          ...expense,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: expense.status || 'active'
        };
        
        const result = await addRecurringExpense(newExpense);
        if (!result.success) {
          throw new Error(result.error || 'Failed to add recurring expense');
        }
      }
      
      await loadRecurringExpenses();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving recurring expense:", error);
      // Keep dialog open on error
      if (!editingExpense) {
        setIsDialogOpen(true);
      }
    }
  };

  const handleDeleteClick = (expense: ExtendedRecurringExpense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete?.id) return;
    
    try {
      const result = await deleteRecurringExpense(expenseToDelete.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete recurring expense');
      }
      await loadRecurringExpenses();
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const filteredExpenses = recurringExpenses.filter(expense => 
    expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* First row: Heading and Add button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recurring Expenses</h1>
        <Button 
          onClick={() => setIsDialogOpen(true)}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Recurring Expense
        </Button>
      </div>

      {/* Second row: Search, Filter, and View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filters
              {filterStatus !== "all" && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  1
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMode(viewMode === "table" ? "card" : "table")}
        >
          {viewMode === "table" ? (
            <LayoutGridIcon className="h-4 w-4" />
          ) : (
            <TableIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Batch operations row - only shown when items are selected */}
      {selectedExpenses.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedExpenses.length} {selectedExpenses.length === 1 ? 'expense' : 'expenses'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteSelected}
              className="h-8"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Third row: Table or Card view */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded bg-muted"></div>
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? "No expenses match your search." : "No recurring expenses found. Add your first recurring expense to get started."}
        </div>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Expense Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Finish Date</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
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
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(expense)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{expense.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedExpenses.includes(expense.id || "")}
                      onCheckedChange={(checked) => handleSelectExpense(expense.id || "", checked as boolean)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-medium">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Due Date:</span>
                    <span>{formatDate(expense.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Finish Date:</span>
                    <span>{expense.endDate ? formatDate(expense.endDate) : "Infinite"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RecurringExpenseDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        expense={editingExpense}
        onSave={handleSaveExpense}
        onClose={handleDialogClose}
      />

      {/* Add Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recurring Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recurring expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 