"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserProfile, updateUserSettings } from "@/lib/db";
import { User } from "@/types/user";
import { LogOutIcon, SaveIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // Salary settings
  const [salaryAmount, setSalaryAmount] = useState(0);
  const [salaryDate, setSalaryDate] = useState("15");
  
  // Notification settings
  const [notifySalary, setNotifySalary] = useState(true);
  const [notifyExpenses, setNotifyExpenses] = useState(true);
  const [notifyRecurring, setNotifyRecurring] = useState(true);
  
  // Display settings
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(true);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: fullName,
        photoURL: avatar,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateUserSettings(user.uid, {
        salaryAmount,
        salaryDate: parseInt(salaryDate),
        notifications: {
          salary: notifySalary,
          expenses: notifyExpenses,
          recurring: notifyRecurring,
        },
        display: {
          currency,
          language,
          darkMode,
        },
      });
      
      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64">
            <TabsList className="flex flex-col h-auto w-full">
              <TabsTrigger value="profile" className="w-full justify-start">
                Profile
              </TabsTrigger>
              <TabsTrigger value="salary" className="w-full justify-start">
                Salary Settings
              </TabsTrigger>
              <TabsTrigger value="notifications" className="w-full justify-start">
                Notifications
              </TabsTrigger>
              <TabsTrigger value="display" className="w-full justify-start">
                Display Settings
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1">
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted">
                        {avatar ? (
                          <img 
                            src={avatar} 
                            alt="Profile" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Label 
                          htmlFor="avatar-upload" 
                          className="cursor-pointer text-sm text-primary hover:underline"
                        >
                          Change avatar
                        </Label>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isLoading}>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="salary">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="salaryAmount">Monthly Salary</Label>
                      <Input
                        id="salaryAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={salaryAmount}
                        onChange={(e) => setSalaryAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="salaryDate">Salary Date</Label>
                      <Select value={salaryDate} onValueChange={setSalaryDate}>
                        <SelectTrigger id="salaryDate">
                          <SelectValue placeholder="Select salary date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st of the month</SelectItem>
                          <SelectItem value="15">15th of the month</SelectItem>
                          <SelectItem value="28">28th of the month</SelectItem>
                          <SelectItem value="last">Last day of the month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} disabled={isLoading}>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Salary Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when your salary is due
                        </p>
                      </div>
                      <Switch
                        checked={notifySalary}
                        onCheckedChange={setNotifySalary}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Expense Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about upcoming expenses
                        </p>
                      </div>
                      <Switch
                        checked={notifyExpenses}
                        onCheckedChange={setNotifyExpenses}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Recurring Expense Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about recurring expenses
                        </p>
                      </div>
                      <Switch
                        checked={notifyRecurring}
                        onCheckedChange={setNotifyRecurring}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} disabled={isLoading}>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="display">
              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Toggle between light and dark mode
                        </p>
                      </div>
                      <Switch
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} disabled={isLoading}>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
} 