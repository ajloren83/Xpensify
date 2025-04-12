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
    Query,
    DocumentData,
    runTransaction,
  } from 'firebase/firestore';
  import { ref, set, get, remove, update } from 'firebase/database';
  import { db, rtdb } from './firebase';
  import { auth } from './firebase';
  import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
  
  // Types for our data models
  export interface Expense {
    id?: string;
    name: string;
    amount: number;
    dueDate: string;
    category: string;
    status: 'pending' | 'paid' | 'cancelled';
    userId: string;
    recurringId?: string;
    createdAt: string;
    updatedAt: string;
    toPay: number;
    willPay: number;
    description?: string;
    type: 'expense' | 'income';
    monthKey?: string;
  }
  
  export type RecurringExpense = {
    id?: string;
    userId: string;
    name: string;
    amount: number;
    dueDate: string; // Day of month (1-31)
    startDate: string;
    endDate?: string | null; // null for infinite
    category: string;
    status: string; // 'active' | 'upcoming' | 'finished'
    notes?: string;
  };
  
  // Add a new expense
  export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      // Validate required fields
      if (!expense.userId || !expense.name || !expense.category) {
        return { success: false, error: "Missing required fields" };
      }

      // Ensure numeric fields are valid numbers
      const numericFields: (keyof Omit<Expense, 'id' | 'createdAt'>)[] = ['amount', 'toPay', 'willPay'];
      for (const field of numericFields) {
        const value = expense[field];
        if (typeof value !== 'number' || isNaN(value)) {
          return { success: false, error: `Invalid ${field} value` };
        }
      }

      // Ensure type is set
      const expenseData = {
        ...expense,
        type: expense.type || 'expense',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, `users/${expense.userId}/expenses`), expenseData);
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error("Error adding expense:", error);
      return { success: false, error: error.message };
    }
  };
  
  // Get all expenses for a user with filtering options
  export const getExpenses = async (
    userId: string,
    month?: number,
    year?: number
  ): Promise<{ success: boolean; expenses?: Expense[]; error?: string }> => {
    try {
      console.log("Getting expenses for user:", userId, "month:", month, "year:", year);
      
      // Use the correct collection path
      const expensesRef = collection(db, `users/${userId}/expenses`);
      let q = query(expensesRef, orderBy('dueDate', 'asc'));
      
      // If month and year are provided, filter by them
      if (month !== undefined && year !== undefined) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        q = query(
          expensesRef,
          where('dueDate', '>=', startDate.toISOString()),
          where('dueDate', '<=', endDate.toISOString()),
          orderBy('dueDate', 'asc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push({
          id: doc.id,
          ...data,
          type: data.type || 'expense'
        } as Expense);
      });
      
      console.log("Found expenses:", expenses.length);
      return { success: true, expenses };
    } catch (error) {
      console.error("Error getting expenses:", error);
      return { success: false, error: (error as Error).message };
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
  export const updateExpense = async (userId: string, id: string, expenseData: Partial<Expense>) => {
    try {
      await updateDoc(doc(db, 'expenses', id), expenseData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Delete an expense
  export const deleteExpense = async (userId: string, id: string) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/expenses`, id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Batch delete expenses
  export const batchDeleteExpenses = async (userId: string, ids: string[]) => {
    try {
      // Firestore doesn't support batch operations in client SDK as easily
      // So we'll delete one by one
      for (const id of ids) {
        await deleteDoc(doc(db, `users/${userId}/expenses`, id));
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Add a recurring expense
  export const addRecurringExpense = async (expense: RecurringExpense): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      // Validate required fields
      if (!expense.name || !expense.amount || !expense.dueDate || !expense.startDate || !expense.category) {
        return { success: false, error: "Missing required fields" };
      }

      // Remove id field if it exists
      const { id, ...expenseData } = expense;

      // Add the recurring expense
      const docRef = await addDoc(collection(db, `users/${user.uid}/recurring`), {
        ...expenseData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: expense.status || 'active'
      });

      // Generate expenses for this recurring expense
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Parse dates
      const startDate = new Date(expense.startDate);
      const endDate = expense.endDate ? new Date(expense.endDate) : null;
      const dueDate = new Date(expense.dueDate);
      const dueDay = dueDate.getDate();

      // Calculate the range of months to generate expenses for
      const startMonth = startDate.getMonth();
      const startYear = startDate.getFullYear();
      
      // Get end date or calculate based on max future months
      const endMonth = endDate ? endDate.getMonth() : currentMonth + 12;
      const endYear = endDate ? endDate.getFullYear() : currentYear + Math.floor((currentMonth + 12) / 12);

      // Generate expenses for each month in the range
      for (let year = startYear; year <= endYear; year++) {
        const startMonthForYear = year === startYear ? startMonth : 0;
        const endMonthForYear = year === endYear ? endMonth : 11;

        for (let month = startMonthForYear; month <= endMonthForYear; month++) {
          // Skip if this month is before the start date
          if (year < startYear || (year === startYear && month < startMonth)) {
            continue;
          }

          // Skip if this month is after the end date
          if (endDate && (year > endYear || (year === endYear && month > endMonth))) {
            continue;
          }

          // Skip if this month is more than 12 months in the future from current date
          const monthsInFuture = (year - currentYear) * 12 + (month - currentMonth);
          if (monthsInFuture > 12) {
            continue;
          }

          // Create due date for this month
          const expenseDueDate = new Date(year, month, dueDay);
          if (isNaN(expenseDueDate.getTime())) {
            console.error("Invalid due date created:", { year, month, day: dueDay });
            continue;
          }

          // Create the expense
          const newExpense: Expense = {
            name: expense.name,
            amount: expense.amount,
            dueDate: expenseDueDate.toISOString(),
            category: expense.category,
            status: 'pending',
            userId: user.uid,
            recurringId: docRef.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            toPay: expense.amount,
            willPay: 0,
            description: expense.notes || '',
            type: 'expense',
            monthKey: `${docRef.id}-${year}-${month}`
          };

          // Add the expense
          await addDoc(collection(db, `users/${user.uid}/expenses`), newExpense);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error adding recurring expense:", error);
      return { success: false, error: (error as Error).message };
    }
  };
  
  // Get all recurring expenses for a user
  export const getRecurringExpenses = async (
    userId: string,
    status?: string
  ) => {
    try {
      console.log("Fetching recurring expenses for user:", userId);
      
      // Use the correct collection path based on Firestore rules
      const recurringRef = collection(db, `users/${userId}/recurring`);
      
      let q: Query<DocumentData> = recurringRef;
      
      // Apply status filter if provided
      if (status && status !== "all") {
        q = query(recurringRef, where("status", "==", status));
      }
      
      const querySnapshot = await getDocs(q);
      const recurringExpenses: RecurringExpense[] = [];
      
      querySnapshot.forEach((doc) => {
        recurringExpenses.push({
          id: doc.id,
          ...doc.data(),
        } as RecurringExpense);
      });
      
      console.log("Fetched recurring expenses:", recurringExpenses);
      
      return {
        success: true,
        recurringExpenses,
      };
    } catch (error: any) {
      console.error("Error fetching recurring expenses:", error);
      return {
        success: false,
        error: error.message,
        recurringExpenses: [],
      };
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
  export const deleteRecurringExpense = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      // First, find all expenses associated with this recurring expense
      const expensesRef = collection(db, `users/${user.uid}/expenses`);
      const q = query(expensesRef, where("recurringId", "==", id));
      const querySnapshot = await getDocs(q);

      // Delete all associated expenses
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );

      // Wait for all expenses to be deleted
      await Promise.all(deletePromises);

      // Then delete the recurring expense itself
      await deleteDoc(doc(db, `users/${user.uid}/recurring`, id));

      console.log(`Deleted recurring expense ${id} and ${querySnapshot.size} associated expenses`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
      return { success: false, error: (error as Error).message };
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

  // Profile Management Functions
  export async function updateUserProfile(
    userId: string,
    data: {
      displayName?: string;
      photoURL?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(db, `users/${userId}`);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      return { success: false, error: error.message };
    }
  }

  export async function updateUserEmail(
    userId: string,
    newEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user");
      }

      // Update email in Firebase Auth
      await updateEmail(user, newEmail);

      // Update email in Firestore
      const userRef = doc(db, `users/${userId}`);
      await updateDoc(userRef, {
        email: newEmail,
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error updating user email:", error);
      return { success: false, error: error.message };
    }
  }

  export async function updateUserPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("No authenticated user");
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      return { success: true };
    } catch (error: any) {
      console.error("Error updating password:", error);
      return { success: false, error: error.message };
    }
  }

  // User settings functions
  export const getUserSettings = async (userId: string) => {
    try {
      console.log('Getting settings for user:', userId);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('No user document found');
        return null;
      }
      
      const userData = userDoc.data();
      console.log('User data:', userData);
      return userData?.settings || null;
    } catch (error: any) {
      console.error("Error getting user settings:", error);
      return null;
    }
  };

  export const updateUserSettings = async (userId: string, settingsData: {
    display?: {
      currency?: string;
      language?: string;
      darkMode?: boolean;
    };
    notifications?: {
      salary?: boolean;
      expenses?: boolean;
      recurring?: boolean;
    };
    salarySettings?: {
      amount?: number;
      creditDateType?: 'first' | 'middle' | 'last' | 'custom';
      customDate?: number;
      currency?: string;
    };
  }) => {
    try {
      console.log('Updating settings for user:', userId, 'with data:', settingsData);
      const userRef = doc(db, 'users', userId);
      
      // First get the current settings
      const userDoc = await getDoc(userRef);
      const currentSettings = userDoc.exists() ? userDoc.data()?.settings || {} : {};
      
      // Merge the new settings with existing ones
      const mergedSettings = {
        display: {
          ...currentSettings.display,
          ...settingsData.display,
        },
        notifications: {
          ...currentSettings.notifications,
          ...settingsData.notifications,
        },
        salarySettings: {
          ...currentSettings.salarySettings,
          ...settingsData.salarySettings,
        },
      };
      
      console.log('Merged settings:', mergedSettings);
      
      // Update the settings in Firestore
      await updateDoc(userRef, { 
        settings: mergedSettings,
        updatedAt: new Date().toISOString(),
      });
      
      console.log('Settings updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error("Error updating user settings:", error);
      return { success: false, error: error.message };
    }
  };

  // Salary Settings
  export async function updateUserSalarySettings(userId: string, settings: {
    amount: number;
    creditDateType: 'first' | 'middle' | 'last' | 'custom';
    customDate?: number;
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
    creditDateType: 'first' | 'middle' | 'last' | 'custom';
    customDate?: number;
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

  // Helper function to get expense by recurring ID and month
  const getExpenseByRecurringIdAndMonth = async (
    userId: string, 
    recurringId: string, 
    month: number, 
    year: number
  ): Promise<Expense | null> => {
    try {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      const q = query(
        collection(db, `users/${userId}/expenses`),
        where("recurringId", "==", recurringId),
        where("dueDate", ">=", firstDayOfMonth.toISOString()),
        where("dueDate", "<=", lastDayOfMonth.toISOString())
      );

      const querySnapshot = await getDocs(q);
      
      // Log the query results for debugging
      console.log("Checking for existing expenses:", {
        userId,
        recurringId,
        month,
        year,
        firstDay: firstDayOfMonth.toISOString(),
        lastDay: lastDayOfMonth.toISOString(),
        foundCount: querySnapshot.size
      });

      if (querySnapshot.empty) return null;

      // If we found multiple expenses, log them for debugging
      if (querySnapshot.size > 1) {
        console.warn("Found multiple expenses for the same month:", {
          recurringId,
          month,
          year,
          expenseIds: querySnapshot.docs.map(doc => doc.id)
        });
      }

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Expense;
    } catch (error) {
      console.error("Error getting expense by recurring ID and month:", error);
      return null;
    }
  };

  // Add a lock to prevent multiple executions
  let isGeneratingExpenses = false;

  export const generateExpensesFromRecurring = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if we're already generating expenses
      if (isGeneratingExpenses) {
        console.log("Expense generation already in progress, skipping...");
        return { success: true };
      }

      // Set the lock
      isGeneratingExpenses = true;

      // Get all active recurring expenses
      const recurringResult = await getRecurringExpenses(userId, 'active');
      if (!recurringResult.success || !recurringResult.recurringExpenses) {
        isGeneratingExpenses = false;
        return { success: false, error: recurringResult.error };
      }

      const recurringExpenses = recurringResult.recurringExpenses;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // For each recurring expense
      for (const recurring of recurringExpenses) {
        try {
          // Parse and validate dates
          const startDate = new Date(recurring.startDate);
          if (isNaN(startDate.getTime())) {
            console.error("Invalid start date:", recurring.startDate);
            continue;
          }

          const endDate = recurring.endDate ? new Date(recurring.endDate) : null;
          if (endDate && isNaN(endDate.getTime())) {
            console.error("Invalid end date:", recurring.endDate);
            continue;
          }

          // Extract day from due date
          let dueDay: number;
          try {
            const dueDate = new Date(recurring.dueDate);
            if (isNaN(dueDate.getTime())) {
              console.error("Invalid due date:", recurring.dueDate);
              continue;
            }
            dueDay = dueDate.getDate();
          } catch (error) {
            console.error("Error parsing due date:", recurring.dueDate);
            continue;
          }

          // Validate due day
          if (dueDay < 1 || dueDay > 31) {
            console.error("Invalid due day:", dueDay);
            continue;
          }

          // Calculate the range of months to generate expenses for
          const startMonth = startDate.getMonth();
          const startYear = startDate.getFullYear();
          
          // Get end date or calculate based on max future months
          const endMonth = endDate ? endDate.getMonth() : currentMonth + 12;
          const endYear = endDate ? endDate.getFullYear() : currentYear + Math.floor((currentMonth + 12) / 12);

          // Generate expenses for each month in the range
          for (let year = startYear; year <= endYear; year++) {
            const startMonthForYear = year === startYear ? startMonth : 0;
            const endMonthForYear = year === endYear ? endMonth : 11;

            for (let month = startMonthForYear; month <= endMonthForYear; month++) {
              // Skip if this month is before the start date
              if (year < startYear || (year === startYear && month < startMonth)) {
                continue;
              }

              // Skip if this month is after the end date
              if (endDate && (year > endYear || (year === endYear && month > endMonth))) {
                continue;
              }

              // Skip if this month is more than 12 months in the future from current date
              const monthsInFuture = (year - currentYear) * 12 + (month - currentMonth);
              if (monthsInFuture > 12) {
                continue;
              }

              // Create due date for this month
              const dueDate = new Date(year, month, dueDay);
              if (isNaN(dueDate.getTime())) {
                console.error("Invalid due date created:", { year, month, day: dueDay });
                continue;
              }

              // Use a transaction to check and create expense atomically
              const result = await runTransaction(db, async (transaction) => {
                // Check if we already have an expense for this recurring expense in this month
                const firstDayOfMonth = new Date(year, month, 1);
                const lastDayOfMonth = new Date(year, month + 1, 0);

                // Create a unique key for this month's expense
                const monthKey = `${recurring.id}-${year}-${month}`;

                // First, check if we already have an expense for this exact due date
                const exactDateQuery = query(
                  collection(db, `users/${userId}/expenses`),
                  where("recurringId", "==", recurring.id),
                  where("dueDate", "==", dueDate.toISOString())
                );

                const exactDateSnapshot = await getDocs(exactDateQuery);
                if (!exactDateSnapshot.empty) {
                  console.log("Found exact date match, skipping:", {
                    recurringId: recurring.id,
                    dueDate: dueDate.toISOString(),
                    existingExpenseIds: exactDateSnapshot.docs.map(doc => doc.id)
                  });
                  return { success: false, error: "Expense already exists" };
                }

                // Then check for any expenses in the same month
                const monthQuery = query(
                  collection(db, `users/${userId}/expenses`),
                  where("recurringId", "==", recurring.id),
                  where("monthKey", "==", monthKey)
                );

                const monthSnapshot = await getDocs(monthQuery);
                
                if (!monthSnapshot.empty) {
                  // If we found multiple expenses, log them for debugging
                  if (monthSnapshot.size > 1) {
                    console.warn("Found multiple expenses for the same month:", {
                      recurringId: recurring.id,
                      month,
                      year,
                      expenseIds: monthSnapshot.docs.map(doc => doc.id),
                      dueDates: monthSnapshot.docs.map(doc => doc.data().dueDate)
                    });
                  }
                  return { success: false, error: "Expense already exists" };
                }

                // Create new expense
                const newExpense: Expense = {
                  name: recurring.name,
                  amount: recurring.amount,
                  dueDate: dueDate.toISOString(),
                  category: recurring.category,
                  status: 'pending',
                  userId: userId,
                  recurringId: recurring.id || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  toPay: recurring.amount,
                  willPay: 0,
                  description: recurring.notes || '',
                  type: 'expense',
                  monthKey: monthKey // Add a unique key for this month
                };

                // Add the expense within the transaction
                const docRef = doc(collection(db, `users/${userId}/expenses`));
                transaction.set(docRef, newExpense);

                return { success: true, id: docRef.id };
              });

              if (result.success) {
                console.log("Created new expense for:", { 
                  month, 
                  year, 
                  recurringId: recurring.id,
                  newExpenseId: result.id,
                  dueDate: dueDate.toISOString()
                });
              } else if (result.error !== "Expense already exists") {
                console.error("Failed to create expense:", result.error);
              }
            }
          }
        } catch (error) {
          console.error("Error processing recurring expense:", error, recurring);
          continue;
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error generating expenses from recurring:", error);
      return { success: false, error: (error as Error).message };
    } finally {
      // Always release the lock
      isGeneratingExpenses = false;
    }
  };

  // Helper function to find and delete duplicate expenses
  export const findAndDeleteDuplicateExpenses = async (userId: string, recurringId: string): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
    try {
      // Get all expenses for this recurring expense
      const expensesRef = collection(db, `users/${userId}/expenses`);
      const q = query(expensesRef, where("recurringId", "==", recurringId));
      const querySnapshot = await getDocs(q);

      // Group expenses by month
      const expensesByMonth = new Map<string, any[]>();
      querySnapshot.forEach((doc) => {
        const expense = doc.data();
        const dueDate = new Date(expense.dueDate);
        const monthKey = `${dueDate.getFullYear()}-${dueDate.getMonth()}`;
        
        if (!expensesByMonth.has(monthKey)) {
          expensesByMonth.set(monthKey, []);
        }
        expensesByMonth.get(monthKey)?.push({ id: doc.id, ...expense });
      });

      // Find duplicates (months with more than one expense)
      const duplicates = new Set<string>();
      expensesByMonth.forEach((expenses, month) => {
        if (expenses.length > 1) {
          console.log(`Found ${expenses.length} expenses for month ${month}:`, 
            expenses.map(e => ({ id: e.id, dueDate: e.dueDate })));
          expenses.forEach(expense => duplicates.add(expense.id));
        }
      });

      // Delete all duplicates
      const deletePromises = Array.from(duplicates).map(expenseId => 
        deleteDoc(doc(db, `users/${userId}/expenses`, expenseId))
      );

      await Promise.all(deletePromises);

      return { 
        success: true, 
        deletedCount: duplicates.size,
        error: duplicates.size > 0 ? `Deleted ${duplicates.size} duplicate expenses` : undefined
      };
    } catch (error) {
      console.error("Error finding and deleting duplicate expenses:", error);
      return { success: false, deletedCount: 0, error: (error as Error).message };
    }
  };