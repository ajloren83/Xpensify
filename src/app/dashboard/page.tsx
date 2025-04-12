// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, CalendarDays, TrendingUp, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ExpenseTransaction, TransactionType } from '@/lib/types';
import TransactionList from '@/components/dashboard/transaction-list';
import ExpenseCalendar from '@/components/dashboard/expense-calendar';
import { useSettings } from '@/lib/settings-context';

// Dashboard stats card component
const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue 
}: { 
  title: string, 
  value: string, 
  description: string, 
  icon: React.ReactNode, 
  trend: 'up' | 'down' | 'neutral', 
  trendValue: string 
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend !== 'neutral' && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <p className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trendValue}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mock data for initial display
const COLORS = ['#63C94E', '#15614E', '#3F8DAD', '#75E5B1', '#FFB86C'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
    expensesByCategory: [] as { name: string; value: number }[]
  });
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch transactions
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const recentTransactionsQuery = query(
          transactionsRef,
          orderBy('date', 'desc'),
          limit(5)
        );
        
        const transactionsSnapshot = await getDocs(recentTransactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExpenseTransaction[];
        
        setTransactions(transactionsData);
        
        // Calculate stats
        const allTransactionsQuery = query(transactionsRef);
        const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
        const allTransactions = allTransactionsSnapshot.docs.map(doc => doc.data() as ExpenseTransaction);
        
        const income = allTransactions
          .filter(t => t.type === TransactionType.INCOME)
          .reduce((sum, t) => sum + t.amount, 0);
          
        const expenses = allTransactions
          .filter(t => t.type === TransactionType.EXPENSE)
          .reduce((sum, t) => sum + t.amount, 0);
          
        // Group expenses by category
        const categories: Record<string, number> = {};
        allTransactions
          .filter(t => t.type === TransactionType.EXPENSE)
          .forEach(t => {
            if (!categories[t.category]) {
              categories[t.category] = 0;
            }
            categories[t.category] += t.amount;
          });
          
        const expensesByCategory = Object.entries(categories).map(([name, value]) => ({
          name,
          value
        }));
        
        setStats({
          balance: income - expenses,
          income,
          expenses,
          savings: income - expenses,
          expensesByCategory
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Helper for empty state
  if (loading) {
    return (
      <div className="space-y-4 max-w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-80 bg-card animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 max-w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button>
            + Add Expense
          </Button>
          <Button>
            + Add Recurring Expense
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Current Balance"
          value={formatCurrency(stats.balance, settings.display.currency)}
          description="Your total balance"
          icon={<Wallet className="h-5 w-5 text-primary" />}
          trend="neutral"
          trendValue=""
        />
        <StatsCard
          title="Monthly Income"
          value={formatCurrency(stats.income, settings.display.currency)}
          description="This month's earnings"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          trend="up"
          trendValue="+5.2% from last month"
        />
        <StatsCard
          title="Monthly Expenses"
          value={formatCurrency(stats.expenses, settings.display.currency)}
          description="This month's spending"
          icon={<CircleDollarSign className="h-5 w-5 text-primary" />}
          trend="down"
          trendValue="-3.1% from last month"
        />
        <StatsCard
          title="Total Savings"
          value={formatCurrency(stats.savings, settings.display.currency)}
          description="Your accumulated savings"
          icon={<CalendarDays className="h-5 w-5 text-primary" />}
          trend="up"
          trendValue="+2.5% from last month"
        />
      </div>
      
      {/* Charts and Transactions Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Expense by Category Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Expense by Category</CardTitle>
                <CardDescription>Breakdown of your expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {stats.expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.expensesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value, settings.display.currency)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No expense data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Transactions */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activities</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionList transactions={transactions} />
                {transactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <p className="text-muted-foreground mb-2">No transactions yet</p>
                    <Button variant="outline" size="sm">Add your first transaction</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Expense Calendar</CardTitle>
              <CardDescription>View your expenses by date</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseCalendar />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>Income vs Expense over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Jan', income: 4000, expenses: 2400 },
                      { name: 'Feb', income: 3000, expenses: 1398 },
                      { name: 'Mar', income: 2000, expenses: 9800 },
                      { name: 'Apr', income: 2780, expenses: 3908 },
                      { name: 'May', income: 1890, expenses: 4800 },
                      { name: 'Jun', income: 2390, expenses: 3800 },
                      { name: 'Jul', income: 3490, expenses: 4300 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value, settings.display.currency)} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#63C94E" />
                    <Bar dataKey="expenses" name="Expenses" fill="#15614E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}