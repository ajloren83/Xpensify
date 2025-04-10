"use client";

import { useState, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    date: "",
    category: "",
  });

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.date || !newExpense.category) {
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      date: newExpense.date,
      category: newExpense.category,
    };

    setExpenses([...expenses, expense]);
    setNewExpense({
      description: "",
      amount: "",
      date: "",
      category: "",
    });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExpense((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Expenses</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={newExpense.description}
                onChange={handleInputChange}
                placeholder="Enter description"
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={newExpense.date}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={newExpense.category}
                onChange={handleInputChange}
                placeholder="Enter category"
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleAddExpense}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{expense.description}</h3>
                  <p className="text-sm text-gray-500">
                    {expense.category} • {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">${expense.amount.toFixed(2)}</span>
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
              <p className="text-center text-gray-500">No expenses added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 