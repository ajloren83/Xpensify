import { useState } from 'react';
import { format } from 'date-fns';
import { Expense } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { LayoutGrid, Table as TableIcon, Trash2, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  selectedExpenses: string[];
  onSelectExpense: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onDelete: (ids: string[]) => void;
  onEdit: (expense: Expense) => void;
}

export function ExpenseList({
  expenses,
  selectedExpenses,
  onSelectExpense,
  onSelectAll,
  onDelete,
  onEdit,
}: ExpenseListProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const handleDeleteSelected = () => {
    onDelete(selectedExpenses);
  };

  const getStatusColor = (status: Expense['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'overdue':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getTypeColor = (type: Expense['type']) => {
    return type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';
  };

  if (viewMode === 'grid') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          {selectedExpenses.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{expense.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedExpenses.includes(expense.id)}
                      onCheckedChange={() => onSelectExpense(expense.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(expense)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className={getTypeColor(expense.type)}>
                    {expense.type}
                  </Badge>
                  <Badge variant="outline">{expense.category}</Badge>
                  <Badge className={getStatusColor(expense.status)}>
                    {expense.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">To Pay:</span>
                    <span className="font-medium">{formatCurrency(expense.toPay)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Will Pay:</span>
                    <span className="font-medium">{formatCurrency(expense.willPay)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-medium">{formatCurrency(expense.remaining)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
        {selectedExpenses.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedExpenses.length === expenses.length}
                  onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">To Pay</TableHead>
              <TableHead className="text-right">Will Pay</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedExpenses.includes(expense.id)}
                    onCheckedChange={() => onSelectExpense(expense.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{expense.name}</TableCell>
                <TableCell>
                  <Badge className={getTypeColor(expense.type)}>
                    {expense.type}
                  </Badge>
                </TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(expense.status)}>
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(expense.toPay)}</TableCell>
                <TableCell className="text-right">{formatCurrency(expense.willPay)}</TableCell>
                <TableCell className="text-right">{formatCurrency(expense.remaining)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(expense)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 