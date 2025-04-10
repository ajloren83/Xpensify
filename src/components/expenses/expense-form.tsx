import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ExpenseCategory, ExpenseStatus, ExpenseType } from '@/types/expense';
import { useAuth } from '@/lib/auth-context';
import { getAutoTags } from '@/lib/db';

interface ExpenseFormProps {
  onSubmit: (expense: {
    name: string;
    amount: number;
    type: ExpenseType;
    category: ExpenseCategory;
    date: string;
    dueDate?: string;
    status: ExpenseStatus;
    notes?: string;
    tags: string[];
    toPay: number;
    willPay: number;
  }) => void;
  initialData?: {
    name: string;
    amount: number;
    type: ExpenseType;
    category: ExpenseCategory;
    date: string;
    dueDate?: string;
    status: ExpenseStatus;
    notes?: string;
    tags: string[];
    toPay: number;
    willPay: number;
  };
  isLoading?: boolean;
}

export function ExpenseForm({ onSubmit, initialData, isLoading = false }: ExpenseFormProps) {
  const { user } = useAuth();
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    amount: initialData?.amount || 0,
    type: initialData?.type || 'expense',
    category: initialData?.category || 'Other',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || '',
    status: initialData?.status || 'pending',
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    toPay: initialData?.toPay || 0,
    willPay: initialData?.willPay || 0,
  });

  useEffect(() => {
    if (user) {
      loadAutoTags();
    }
  }, [user]);

  const loadAutoTags = async () => {
    try {
      const tags = await getAutoTags(user!.uid);
      setAutoTags(tags);
    } catch (error) {
      console.error('Error loading auto tags:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' || name === 'toPay' || name === 'willPay' 
        ? parseFloat(value) || 0 
        : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAutoTagClick = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter expense name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value as ExpenseType)}
              >
                <SelectTrigger>
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
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Bills">Bills</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value as ExpenseStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toPay">To Pay</Label>
              <Input
                id="toPay"
                name="toPay"
                type="number"
                min="0"
                step="0.01"
                value={formData.toPay}
                onChange={handleInputChange}
                placeholder="Amount to pay"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="willPay">Will Pay</Label>
              <Input
                id="willPay"
                name="willPay"
                type="number"
                min="0"
                step="0.01"
                value={formData.willPay}
                onChange={handleInputChange}
                placeholder="Amount will pay"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter notes"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {autoTags.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {autoTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => handleAutoTagClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update Expense' : 'Add Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 