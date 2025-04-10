"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expense } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSave: (expense: Expense) => void;
  onClose: () => void;
  autoTags: string[];
}

export function ExpenseDialog({ 
  open, 
  onOpenChange, 
  expense, 
  onSave, 
  onClose,
  autoTags 
}: ExpenseDialogProps) {
  const [expenseData, setExpenseData] = useState<Partial<Expense>>({
    name: "",
    toPay: 0,
    willPay: 0,
    remaining: 0,
    type: "expense",
    category: "",
    dueDate: new Date().toISOString().split("T")[0],
    status: "pending",
    tag: "",
    notes: ""
  });

  useEffect(() => {
    if (expense) {
      setExpenseData({
        ...expense,
        dueDate: new Date(expense.dueDate).toISOString().split("T")[0]
      });
    } else {
      setExpenseData({
        name: "",
        toPay: 0,
        willPay: 0,
        remaining: 0,
        type: "expense",
        category: "",
        dueDate: new Date().toISOString().split("T")[0],
        status: "pending",
        tag: "",
        notes: ""
      });
    }
  }, [expense]);

  const handleChange = (key: keyof Expense, value: string | number) => {
    setExpenseData(prev => {
      const newData = { ...prev, [key]: value };
      
      // Calculate remaining amount
      if (key === "toPay" || key === "willPay") {
        newData.remaining = (newData.toPay || 0) - (newData.willPay || 0);
      }
      
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseData.name || !expenseData.toPay || !expenseData.category) {
      return;
    }
    
    onSave({
      ...expenseData,
      id: expense?.id,
      dueDate: new Date(expenseData.dueDate || "").toISOString(),
      toPay: Number(expenseData.toPay),
      willPay: Number(expenseData.willPay),
      remaining: Number(expenseData.remaining),
      tag: expenseData.tag === "none" ? "" : expenseData.tag
    } as Expense);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={expenseData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Expense name"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="toPay">To Pay</Label>
              <Input
                id="toPay"
                type="number"
                value={expenseData.toPay}
                onChange={(e) => handleChange("toPay", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="willPay">Will Pay</Label>
              <Input
                id="willPay"
                type="number"
                value={expenseData.willPay}
                onChange={(e) => handleChange("willPay", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remaining">Remaining</Label>
            <Input
              id="remaining"
              type="number"
              value={expenseData.remaining}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={expenseData.type}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={expenseData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Housing">Housing</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Bills">Bills</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={expenseData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={expenseData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tag">Tag</Label>
            <Select
              value={expenseData.tag}
              onValueChange={(value) => handleChange("tag", value)}
            >
              <SelectTrigger id="tag">
                <SelectValue placeholder="Select tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Tag</SelectItem>
                {autoTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={expenseData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Add notes (optional)"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {expense ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 