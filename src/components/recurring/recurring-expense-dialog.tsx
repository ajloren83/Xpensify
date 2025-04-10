import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RecurringExpense } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/lib/auth-context';

interface RecurringExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: RecurringExpense | null;
  onSave: (expense: RecurringExpense) => void;
  onClose: () => void;
}

export function RecurringExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSave,
  onClose,
}: RecurringExpenseDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<RecurringExpense> & { isInfinite: boolean }>({
    name: "",
    amount: 0,
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isInfinite: true,
    category: "Bills",
    notes: "",
    status: "active",
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        ...expense,
        startDate: new Date(expense.startDate).toISOString().split("T")[0],
        dueDate: new Date(expense.dueDate).toISOString().split("T")[0],
        endDate: expense.endDate ? new Date(expense.endDate).toISOString().split("T")[0] : "",
        isInfinite: !expense.endDate,
      });
    } else {
      setFormData({
        name: "",
        amount: 0,
        startDate: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
        endDate: "",
        isInfinite: true,
        category: "Bills",
        notes: "",
        status: "active",
      });
    }
  }, [expense, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({ 
      ...formData, 
      isInfinite: checked,
      endDate: checked ? "" : new Date().toISOString().split("T")[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseData: RecurringExpense = {
      id: expense?.id,
      userId: expense?.userId || user?.uid || "",
      name: formData.name || "",
      amount: formData.amount || 0,
      startDate: new Date(formData.startDate || new Date()).toISOString(),
      dueDate: new Date(formData.dueDate || new Date()).toISOString(),
      endDate: formData.isInfinite ? undefined : (formData.endDate ? new Date(formData.endDate).toISOString() : undefined),
      category: formData.category || "Bills",
      notes: formData.notes || "",
      status: formData.status || "active",
    };
    
    onSave(expenseData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Recurring Expense" : "Add Recurring Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date
              </Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isInfinite" className="text-right">
                Infinite
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="isInfinite"
                  checked={formData.isInfinite}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isInfinite">No end date</Label>
              </div>
            </div>
            {!formData.isInfinite && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="col-span-3">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 