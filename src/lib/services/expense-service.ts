import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  limit,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Expense, ExpenseFilters, ExpenseStats } from '@/types/expense';

const EXPENSES_PER_PAGE = 20;

export class ExpenseService {
  private getExpensesCollection(userId: string) {
    return collection(db, 'users', userId, 'expenses');
  }

  async getExpenses(
    userId: string,
    filters: ExpenseFilters,
    lastDoc?: any,
    pageSize: number = EXPENSES_PER_PAGE
  ): Promise<{ expenses: Expense[]; lastDoc: any }> {
    let q = query(
      this.getExpensesCollection(userId),
      orderBy('date', 'desc'),
      limit(pageSize)
    );

    // Apply filters
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.dateRange) {
      q = query(
        q,
        where('date', '>=', filters.dateRange.start),
        where('date', '<=', filters.dateRange.end)
      );
    }
    if (filters.amountRange) {
      q = query(
        q,
        where('amount', '>=', filters.amountRange.min),
        where('amount', '<=', filters.amountRange.max)
      );
    }
    if (filters.tags && filters.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filters.tags));
    }

    // Apply pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate().toISOString(),
      dueDate: doc.data().dueDate?.toDate().toISOString(),
      createdAt: doc.data().createdAt.toDate().toISOString(),
      updatedAt: doc.data().updatedAt.toDate().toISOString(),
    })) as Expense[];

    return {
      expenses,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  async addExpense(userId: string, expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(this.getExpensesCollection(userId), {
      ...expense,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async updateExpense(userId: string, expenseId: string, expense: Partial<Expense>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId);
    await updateDoc(docRef, {
      ...expense,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId);
    await deleteDoc(docRef);
  }

  async getExpenseStats(userId: string, month: string): Promise<ExpenseStats> {
    const startOfMonth = new Date(month);
    startOfMonth.setDate(1);
    const endOfMonth = new Date(month);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);

    const q = query(
      this.getExpensesCollection(userId),
      where('date', '>=', startOfMonth.toISOString()),
      where('date', '<=', endOfMonth.toISOString())
    );

    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map(doc => doc.data() as Expense);

    const stats: ExpenseStats = {
      totalExpenses: 0,
      totalIncome: 0,
      balance: 0,
      savings: 0,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    expenses.forEach(expense => {
      if (expense.type === 'expense') {
        stats.totalExpenses += expense.amount;
        stats.byCategory[expense.category] = (stats.byCategory[expense.category] || 0) + expense.amount;
      } else {
        stats.totalIncome += expense.amount;
      }
      stats.byStatus[expense.status] = (stats.byStatus[expense.status] || 0) + expense.amount;
      stats.byType[expense.type] = (stats.byType[expense.type] || 0) + expense.amount;
    });

    stats.balance = stats.totalIncome - stats.totalExpenses;
    stats.savings = Math.max(0, stats.balance);

    return stats;
  }

  async getAutoTags(userId: string): Promise<string[]> {
    const q = query(
      this.getExpensesCollection(userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const tags = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const expense = doc.data() as Expense;
      expense.tags.forEach(tag => tags.add(tag));
    });

    return Array.from(tags);
  }
} 