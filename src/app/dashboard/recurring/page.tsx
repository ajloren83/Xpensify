"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { addRecurringExpense, deleteRecurringExpense, updateRecurringExpense, getRecurringExpenses } from "@/lib/db";

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  finishDate: string | null;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export default function RecurringExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'finished'>('all');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    dueDate: "",
    finishDate: "",
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user, filter]);

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedExpenses = await getRecurringExpenses(user.uid);
      
      // Apply filter
      let filteredExpenses = fetchedExpenses;
      if (filter === 'active') {
        filteredExpenses = fetchedExpenses.filter(expense => 
          !expense.finishDate || new Date(expense.finishDate) > new Date()
        );
      } else if (filter === 'upcoming') {
        filteredExpenses = fetchedExpenses.filter(expense => 
          new Date(expense.dueDate) > new Date()
        );
      } else if (filter === 'finished') {
        filteredExpenses = fetchedExpenses.filter(expense => 
          expense.finishDate && new Date(expense.finishDate) <= new Date()
        );
      }
      
      setExpenses(filteredExpenses);
    } catch (error) {
      console.error("Error loading recurring expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!user || !newExpense.name || !newExpense.amount || !newExpense.dueDate) {
      return;
    }

    try {
      const expense: Omit<RecurringExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name: newExpense.name,
        amount: parseFloat(newExpense.amount),
        dueDate: newExpense.dueDate,
        finishDate: newExpense.finishDate || null,
      };

      await addRecurringExpense(user.uid, expense);
      setNewExpense({
        name: "",
        amount: "",
        dueDate: "",
        finishDate: "",
      });
      loadExpenses();
    } catch (error) {
      console.error("Error adding recurring expense:", error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;

    try {
      await deleteRecurringExpense(user.uid, id);
      loadExpenses();
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
    }
  };

  const handleBatchDelete = async () => {
    if (!user || selectedExpenses.length === 0) return;

    try {
      await Promise.all(
        selectedExpenses.map(id => deleteRecurringExpense(user.uid, id))
      );
      setSelectedExpenses([]);
      loadExpenses();
    } catch (error) {
      console.error("Error batch deleting recurring expenses:", error);
    }
  };

  const handleUpdateExpense = async (id: string, updatedData: Partial<RecurringExpense>) => {
    if (!user) return;

    try {
      await updateRecurringExpense(user.uid, id, updatedData);
      setIsEditing(null);
      loadExpenses();
    } catch (error) {
      console.error("Error updating recurring expense:", error);
    }
  };

  const toggleSelectExpense = (id: string) => {
    if (selectedExpenses.includes(id)) {
      setSelectedExpenses(selectedExpenses.filter(expenseId => expenseId !== id));
    } else {
      setSelectedExpenses([...selectedExpenses, id]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Expenses</h1>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'active' ? 'default' : 'outline'} 
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button 
            variant={filter === 'upcoming' ? 'default' : 'outline'} 
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button 
            variant={filter === 'finished' ? 'default' : 'outline'} 
            onClick={() => setFilter('finished')}
          >
            Finished
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Recurring Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Expense Name</Label>
              <Input
                id="name"
                name="name"
                value={newExpense.name}
                onChange={handleInputChange}
                placeholder="Enter expense name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={newExpense.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={newExpense.dueDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finishDate">Finish Date (Optional)</Label>
              <Input
                id="finishDate"
                name="finishDate"
                type="date"
                value={newExpense.finishDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleAddExpense}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recurring Expense
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recurring Expenses List</CardTitle>
          {selectedExpenses.length > 0 && (
            <Button variant="destructive" onClick={handleBatchDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedExpenses.length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleSelectExpense(expense.id)}
                      className="h-4 w-4"
                    />
                    {isEditing === expense.id ? (
                      <div className="flex flex-col gap-2 w-full">
                        <Input
                          value={expense.name}
                          onChange={(e) => handleUpdateExpense(expense.id, { name: e.target.value })}
                          placeholder="Expense name"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => handleUpdateExpense(expense.id, { amount: parseFloat(e.target.value) })}
                            placeholder="Amount"
                          />
                          <Input
                            type="date"
                            value={expense.dueDate}
                            onChange={(e) => handleUpdateExpense(expense.id, { dueDate: e.target.value })}
                          />
                          <Input
                            type="date"
                            value={expense.finishDate || ''}
                            onChange={(e) => handleUpdateExpense(expense.id, { finishDate: e.target.value || null })}
                            placeholder="Finish date (optional)"
                          />
                          <Button size="icon" onClick={() => setIsEditing(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="icon" onClick={() => handleUpdateExpense(expense.id, {})}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold">{expense.name}</h3>
                        <p className="text-sm text-gray-500">
                          Due: {formatDate(expense.dueDate)}
                          {expense.finishDate && ` • Ends: ${formatDate(expense.finishDate)}`}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{formatCurrency(expense.amount)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(expense.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-center text-gray-500">No recurring expenses found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 