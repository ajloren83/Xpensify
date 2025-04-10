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
import { LogOutIcon, SaveIcon, EditIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
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
        photoURL: avatar || undefined,
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
      await logout();
      router.push("/auth/login");
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
    <div className="space-y-6 max-w-full">
      {/* First row: Heading */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      {/* Second row: Horizontal tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="salary">Salary Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display Settings</TabsTrigger>
        </TabsList>
        
        {/* Tab heading */}
        <div className="mt-6 mb-2">
          <h2 className="text-xl font-semibold">
            {activeTab === "profile" && "Profile Settings"}
            {activeTab === "salary" && "Salary Settings"}
            {activeTab === "notifications" && "Notification Settings"}
            {activeTab === "display" && "Display Settings"}
          </h2>
        </div>
        
        {/* Third row: Settings content without box */}
        <div className="mt-6">
          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-muted">
                    {avatar ? (
                      <img 
                        src={avatar} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xl font-medium">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 cursor-pointer hover:bg-primary/90">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Label 
                      htmlFor="avatar-upload" 
                      className="cursor-pointer"
                    >
                      <EditIcon className="h-4 w-4 text-primary-foreground" />
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutDialog(true)}
                className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="salary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="salaryAmount">Monthly Salary Amount</Label>
                <Input
                  id="salaryAmount"
                  type="number"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(parseFloat(e.target.value))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="salaryDate">Salary Credit Date</Label>
                <Select value={salaryDate} onValueChange={setSalaryDate}>
                  <SelectTrigger id="salaryDate">
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
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
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Salary Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about your salary
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
                    Receive notifications about your expenses
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
                    Receive notifications about your recurring expenses
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
          </TabsContent>
          
          <TabsContent value="display" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="it">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode for the application
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        description="Are you sure you want to log out? You will need to sign in again to access your account."
        confirmText="Log out"
        cancelText="Cancel"
        isDangerous={true}
      />
    </div>
  );
} 