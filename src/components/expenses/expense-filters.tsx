"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseCategory, ExpenseStatus, ExpenseType } from "@/types/expense";
import { Filter, Search } from "lucide-react";
import { useState } from "react";

interface ExpenseFiltersProps {
  filters: {
    search: string;
    type: ExpenseType | "all";
    status: ExpenseStatus | "all";
    category: ExpenseCategory | "all";
  };
  onFiltersChange: (filters: ExpenseFiltersProps["filters"]) => void;
}

export function ExpenseFilters({ filters, onFiltersChange }: ExpenseFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleTypeChange = (value: ExpenseType | "all") => {
    onFiltersChange({ ...filters, type: value });
  };

  const handleStatusChange = (value: ExpenseStatus | "all") => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleCategoryChange = (value: ExpenseCategory | "all") => {
    onFiltersChange({ ...filters, category: value });
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== "all" && value !== ""
  ).length;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search expenses..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="flex flex-col items-start">
              <span className="mb-1 text-sm font-medium">Type</span>
              <Select
                value={filters.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start">
              <span className="mb-1 text-sm font-medium">Status</span>
              <Select
                value={filters.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start">
              <span className="mb-1 text-sm font-medium">Category</span>
              <Select
                value={filters.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 