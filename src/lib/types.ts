// lib/types.ts
export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense'
  }
  
  export enum TransactionStatus {
    PAID = 'paid',
    PENDING = 'pending',
    OVERDUE = 'overdue'
  }
  
  export enum RecurringFrequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    BIWEEKLY = 'biweekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly'
  }
  
  export interface ExpenseTransaction {
    id: string;
    userId: string;
    name: string;
    amount: number;
    category: string;
    date: string; // ISO string
    type: TransactionType;
    status?: TransactionStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface RecurringExpense {
    id: string;
    userId: string;
    name: string;
    amount: number;
    category: string;
    startDate: string; // ISO string
    endDate?: string; // ISO string, optional for infinite recurring
    frequency: RecurringFrequency;
    status: TransactionStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface UserProfile {
    uid: string;
    fullName: string;
    email: string;
    photoURL?: string;
    createdAt: string;
    preferences: {
      currency: string;
      theme: 'dark' | 'light';
      language: string;
    };
    salary: {
      amount: number;
      creditDate: 'month-end' | '15th' | string; // Can be 'month-end', '15th', or a custom date
    };
  }
  
  export interface NotificationSettings {
    salary: boolean;
    expenses: boolean;
    recurring: boolean;
  }
  
  export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    link?: string;
  }