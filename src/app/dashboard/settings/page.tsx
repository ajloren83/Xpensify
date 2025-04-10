"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateUserProfile, updateUserSettings, getUserSettings } from "@/lib/db";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Moon, Sun, Upload, LogOut } from "lucide-react";

interface UserSettings {
  salary: {
    amount: number;
    creditDate: number;
  };
  notifications: {
    salary: boolean;
    expenses: boolean;
    recurring: boolean;
  };
  display: {
    currency: string;
    theme: 'light' | 'dark';
    language: string;
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settings, setSettings] = useState<UserSettings>({
    salary: {
      amount: 0,
      creditDate: 15,
    },
    notifications: {
      salary: true,
      expenses: true,
      recurring: true,
    },
    display: {
      currency: "USD",
      theme: "dark",
      language: "en",
    },
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load user profile data
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      
      // Load user settings
      const userSettings = await getUserSettings(user.uid);
      if (userSettings) {
        setSettings(userSettings);
      }
      
      // Load profile image if exists
      if (user.photoURL) {
        setProfileImage(user.photoURL);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      await updateUserProfile(user.uid, {
        displayName,
        photoURL: profileImage,
      });
      // Show success message
    } catch (error) {
      console.error("Error updating profile:", error);
      // Show error message
    }
  };

  const handleUpdateSettings = async () => {
    if (!user) return;
    
    try {
      await updateUserSettings(user.uid, settings);
      // Show success message
    } catch (error) {
      console.error("Error updating settings:", error);
      // Show error message
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-0">
              <TabsList className="flex flex-col h-full w-full">
                <TabsTrigger 
                  value="profile" 
                  className="w-full justify-start px-4 py-3 data-[state=active]:bg-accent"
                  onClick={() => setActiveTab("profile")}
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="salary" 
                  className="w-full justify-start px-4 py-3 data-[state=active]:bg-accent"
                  onClick={() => setActiveTab("salary")}
                >
                  Salary Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="w-full justify-start px-4 py-3 data-[state=active]:bg-accent"
                  onClick={() => setActiveTab("notifications")}
                >
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="display" 
                  className="w-full justify-start px-4 py-3 data-[state=active]:bg-accent"
                  onClick={() => setActiveTab("display")}
                >
                  Display Settings
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                        {profileImage ? (
                          <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                        <label 
                          htmlFor="profile-image" 
                          className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer"
                        >
                          <Upload className="h-4 w-4" />
                        </label>
                        <input 
                          id="profile-image" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Full Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                      <Button onClick={handleUpdateProfile}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="salary">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="salaryAmount">Monthly Salary</Label>
                      <Input
                        id="salaryAmount"
                        type="number"
                        value={settings.salary.amount}
                        onChange={(e) => setSettings({
                          ...settings,
                          salary: {
                            ...settings.salary,
                            amount: parseFloat(e.target.value) || 0
                          }
                        })}
                        placeholder="Enter your monthly salary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="creditDate">Salary Credit Date</Label>
                      <Select
                        value={settings.salary.creditDate.toString()}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          salary: {
                            ...settings.salary,
                            creditDate: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger id="creditDate">
                          <SelectValue placeholder="Select credit date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st of the month</SelectItem>
                          <SelectItem value="15">15th of the month</SelectItem>
                          <SelectItem value="28">28th of the month</SelectItem>
                          <SelectItem value="30">30th of the month</SelectItem>
                          <SelectItem value="31">31st of the month</SelectItem>
                          <SelectItem value="0">End of the month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleUpdateSettings}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Salary Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about your salary
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.salary}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            salary: checked
                          }
                        })}
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
                        checked={settings.notifications.expenses}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            expenses: checked
                          }
                        })}
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
                        checked={settings.notifications.recurring}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            recurring: checked
                          }
                        })}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleUpdateSettings}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="display">
              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={settings.display.currency}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          display: {
                            ...settings.display,
                            currency: value
                          }
                        })}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                          <SelectItem value="AUD">AUD (A$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Theme</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose between light and dark mode
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4" />
                        <Switch
                          checked={settings.display.theme === 'dark'}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            display: {
                              ...settings.display,
                              theme: checked ? 'dark' : 'light'
                            }
                          })}
                        />
                        <Moon className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={settings.display.language}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          display: {
                            ...settings.display,
                            language: value
                          }
                        })}
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                          <SelectItem value="ru">Russian</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleUpdateSettings}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 