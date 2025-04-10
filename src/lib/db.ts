// /lib/db.ts
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    serverTimestamp,
  } from 'firebase/firestore';
  import { ref, set, get, remove, update } from 'firebase/database';
  import { db, rtdb } from './firebase';
  
  // Types for our data models
  export type Expense = {
    id?: string;
    userId: string;
    name: string;
    amount: number;
    toPay: number;
    willPay: number;
    remaining: number;
    type: string; // 'expense' | 'income'
    category: string;
    dueDate: string;
    status: string; // 'paid' | 'pending' | 'overdue'
    tag?: string;
    notes?: string;
    createdAt: string;
  };
  
  export type RecurringExpense = {
    id?: string;
    userId: string;
    name: string;
    amount: number;
    dueDate: string; // Day of month (1-31)
    startDate: string;
    endDate?: string; // null for infinite
    category: string;
    status: string; // 'active' | 'upcoming' | 'finished'
    notes?: string;
  };
  
  // Add a new expense
  export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expense,
        createdAt: new Date().toISOString(),
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get all expenses for a user with filtering options
  export const getExpenses = async (
    userId: string,
    filters: {
      category?: string;
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      minAmount?: number;
      maxAmount?: number;
    } = {},
    lastDoc: any = null,
    pageSize: number = 10
  ) => {
    try {
      let q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
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
      if (filters.startDate && filters.endDate) {
        q = query(
          q,
          where('dueDate', '>=', filters.startDate.toISOString()),
          where('dueDate', '<=', filters.endDate.toISOString())
        );
      }
      // Note: Firestore doesn't support multiple range operators, so we'll filter minAmount and maxAmount in memory
      
      q = query(q, limit(pageSize));
      
      // Apply pagination if lastDoc is provided
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = [];
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Expense;
        
        // Apply amount filters in memory
        if (
          (filters.minAmount === undefined || data.amount >= filters.minAmount) &&
          (filters.maxAmount === undefined || data.amount <= filters.maxAmount)
        ) {
          expenses.push({
            ...data,
            id: doc.id,
          });
        }
      });
      
      return { success: true, expenses, lastVisible };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get expenses by month and year
  export const getExpensesByMonth = async (userId: string, month: number, year: number) => {
    try {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0).toISOString();
      
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        where('dueDate', '>=', startOfMonth),
        where('dueDate', '<=', endOfMonth),
        orderBy('dueDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        expenses.push({
          ...doc.data() as Expense,
          id: doc.id,
        });
      });
      
      return { success: true, expenses };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Update an expense
  export const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
    try {
      await updateDoc(doc(db, 'expenses', id), expenseData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Delete an expense
  export const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Batch delete expenses
  export const batchDeleteExpenses = async (ids: string[]) => {
    try {
      // Firestore doesn't support batch operations in client SDK as easily
      // So we'll delete one by one
      for (const id of ids) {
        await deleteDoc(doc(db, 'expenses', id));
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Add a recurring expense
  export const addRecurringExpense = async (recurringExpense: Omit<RecurringExpense, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'recurringExpenses'), recurringExpense);
      return { success: true, id: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get all recurring expenses for a user
  export const getRecurringExpenses = async (
    userId: string,
    status?: string
  ) => {
    try {
      let q = query(
        collection(db, 'recurringExpenses'),
        where('userId', '==', userId),
        orderBy('dueDate', 'asc')
      );
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      const querySnapshot = await getDocs(q);
      const recurringExpenses: RecurringExpense[] = [];
      
      querySnapshot.forEach((doc) => {
        recurringExpenses.push({
          ...doc.data() as RecurringExpense,
          id: doc.id,
        });
      });
      
      return { success: true, recurringExpenses };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Update a recurring expense
  export const updateRecurringExpense = async (id: string, recurringExpenseData: Partial<RecurringExpense>) => {
    try {
      await updateDoc(doc(db, 'recurringExpenses', id), recurringExpenseData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Delete a recurring expense
  export const deleteRecurringExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recurringExpenses', id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get user dashboard summary
  export const getDashboardSummary = async (userId: string) => {
    try {
      // Get current month's expenses
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        where('dueDate', '>=', startOfMonth),
        where('dueDate', '<=', endOfMonth)
      );
      
      const querySnapshot = await getDocs(q);
      let income = 0;
      let expenses = 0;
      let balance = 0;
      let savings = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Expense;
        if (data.type === 'income') {
          income += data.amount;
        } else {
          expenses += data.amount;
        }
      });
      
      // Get user salary data
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (userData && userData.salary && userData.salary.amount) {
        income += userData.salary.amount;
      }
      
      balance = income - expenses;
      
      // Get savings (from previous months)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
      const qPrevious = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        where('dueDate', '<', lastMonthEnd)
      );
      
      const previousSnapshot = await getDocs(qPrevious);
      let previousIncome = 0;
      let previousExpenses = 0;
      
      previousSnapshot.forEach((doc) => {
        const data = doc.data() as Expense;
        if (data.type === 'income') {
          previousIncome += data.amount;
        } else {
          previousExpenses += data.amount;
        }
      });
      
      savings = previousIncome - previousExpenses;
      if (savings < 0) savings = 0;
      
      return {
        success: true,
        summary: {
          income,
          expenses,
          balance,
          savings
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get recent transactions
  export const getRecentTransactions = async (userId: string, limitCount: number = 5) => {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const transactions: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({
          ...doc.data() as Expense,
          id: doc.id,
        });
      });
      
      return { success: true, transactions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get category distribution for visualization
  export const getCategoryDistribution = async (userId: string, month?: number, year?: number) => {
    try {
      let q;
      
      if (month !== undefined && year !== undefined) {
        const startOfMonth = new Date(year, month, 1).toISOString();
        const endOfMonth = new Date(year, month + 1, 0).toISOString();
        
        q = query(
          collection(db, 'expenses'),
          where('userId', '==', userId),
          where('type', '==', 'expense'),
          where('dueDate', '>=', startOfMonth),
          where('dueDate', '<=', endOfMonth)
        );
      } else {
        q = query(
          collection(db, 'expenses'),
          where('userId', '==', userId),
          where('type', '==', 'expense')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const categories: Record<string, number> = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Expense;
        if (!categories[data.category]) {
          categories[data.category] = 0;
        }
        categories[data.category] += data.amount;
      });
      
      return {
        success: true,
        categories: Object.entries(categories).map(([category, amount]) => ({
          category,
          amount
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get monthly expense trend for visualization
  export const getMonthlyExpenseTrend = async (userId: string, months: number = 6) => {
    try {
      const now = new Date();
      const monthlyData = [];
      
      for (let i = 0; i < months; i++) {
        const month = now.getMonth() - i;
        const year = now.getFullYear() + Math.floor(month / 12);
        const adjustedMonth = ((month % 12) + 12) % 12; // Handle negative months
        
        const startOfMonth = new Date(year, adjustedMonth, 1).toISOString();
        const endOfMonth = new Date(year, adjustedMonth + 1, 0).toISOString();
        
        const q = query(
          collection(db, 'expenses'),
          where('userId', '==', userId),
          where('dueDate', '>=', startOfMonth),
          where('dueDate', '<=', endOfMonth)
        );
        
        const querySnapshot = await getDocs(q);
        let income = 0;
        let expenses = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Expense;
          if (data.type === 'income') {
            income += data.amount;
          } else {
            expenses += data.amount;
          }
        });
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        monthlyData.push({
          month: monthNames[adjustedMonth],
          year,
          income,
          expenses,
          balance: income - expenses
        });
      }
      
      return { success: true, monthlyData: monthlyData.reverse() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get calendar heatmap data
  export const getCalendarData = async (userId: string, year: number) => {
    try {
      const startOfYear = new Date(year, 0, 1).toISOString();
      const endOfYear = new Date(year, 11, 31).toISOString();
      
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        where('dueDate', '>=', startOfYear),
        where('dueDate', '<=', endOfYear)
      );
      
      const querySnapshot = await getDocs(q);
      const calendarData: Record<string, number> = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Expense;
        const date = data.dueDate.split('T')[0]; // Format: YYYY-MM-DD
        
        if (!calendarData[date]) {
          calendarData[date] = 0;
        }
        
        if (data.type === 'expense') {
          calendarData[date] += data.amount;
        }
      });
      
      return {
        success: true,
        calendarData: Object.entries(calendarData).map(([date, value]) => ({
          date,
          value
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Set notification
  export const setNotification = async (userId: string, notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }) => {
    try {
      await set(ref(rtdb, `notifications/${userId}/${notification.id}`), notification);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Get notifications
  export const getNotifications = async (userId: string) => {
    try {
      const snapshot = await get(ref(rtdb, `notifications/${userId}`));
      
      if (snapshot.exists()) {
        const notifications = snapshot.val();
        return {
          success: true,
          notifications: Object.values(notifications)
        };
      }
      
      return { success: true, notifications: [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Mark notification as read
  export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    try {
      await update(ref(rtdb, `notifications/${userId}/${notificationId}`), {
        read: true
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Delete notification
  export const deleteNotification = async (userId: string, notificationId: string) => {
    try {
      await remove(ref(rtdb, `notifications/${userId}/${notificationId}`));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Clear all notifications
  export const clearAllNotifications = async (userId: string) => {
    const notificationsRef = ref(rtdb, `notifications/${userId}`);
    await remove(notificationsRef);
  };
  
  export const getAutoTags = async (userId: string): Promise<string[]> => {
    try {
      const expensesRef = collection(db, 'users', userId, 'expenses');
      const q = query(expensesRef, orderBy('createdAt', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      
      const tags = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const expense = doc.data();
        if (expense.tags && Array.isArray(expense.tags)) {
          expense.tags.forEach((tag: string) => tags.add(tag));
        }
      });
      
      return Array.from(tags);
    } catch (error) {
      console.error('Error getting auto tags:', error);
      return [];
    }
  };

  // User profile functions
  export const updateUserProfile = async (userId: string, profileData: {
    displayName?: string;
    photoURL?: string;
  }) => {
    try {
      await updateDoc(doc(db, 'users', userId), profileData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // User settings functions
  export const updateUserSettings = async (userId: string, settingsData: {
    salaryAmount?: number;
    salaryDate?: number;
    notifications?: {
      salary?: boolean;
      expenses?: boolean;
      recurring?: boolean;
    };
    display?: {
      currency?: string;
      language?: string;
      darkMode?: boolean;
    };
  }) => {
    try {
      await updateDoc(doc(db, 'users', userId), { settings: settingsData });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Salary Settings
  export async function updateUserSalarySettings(userId: string, settings: {
    amount: number;
    creditDate: number;
    currency: string;
  }): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        salarySettings: settings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating salary settings:', error);
      throw error;
    }
  }

  export async function getUserSalarySettings(userId: string): Promise<{
    amount: number;
    creditDate: number;
    currency: string;
  } | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return userData?.salarySettings || null;
    } catch (error) {
      console.error('Error getting salary settings:', error);
      throw error;
    }
  }