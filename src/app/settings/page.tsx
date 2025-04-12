"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context"; // Import the settings context
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserProfile, updateUserSettings, updateUserEmail, updateUserPassword, getUserSettings } from "@/lib/db";
import { LogOutIcon, SaveIcon, EditIcon, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { toast } from 'sonner';
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user, logout, updateProfile, deleteProfileImage } = useAuth();
  const { settings, setSettings } = useSettings(); // Get the settings from the context
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL || null);
  const [isEditing, setIsEditing] = useState(true);
  
  // Salary settings
  const [salaryAmount, setSalaryAmount] = useState(0);
  const [salaryDate, setSalaryDate] = useState("15");
  
  // Notification settings
  const [notifySalary, setNotifySalary] = useState(true);
  const [notifyExpenses, setNotifyExpenses] = useState(true);
  const [notifyRecurring, setNotifyRecurring] = useState(true);
  
  // Display settings
  const [darkMode, setDarkMode] = useState(settings.display.darkMode);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setPhotoURL(user.photoURL || "");
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      const userSettings = await getUserSettings(user.uid);
      if (userSettings) {
        setDarkMode(userSettings.display?.darkMode ?? true);
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Store the Base64 string in state
      setPhotoURL(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Ensure we have a display name
      if (!displayName.trim()) {
        throw new Error('Display name cannot be empty');
      }

      const result = await updateProfile({
        displayName: displayName.trim(),
        photoURL: photoURL || null,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        // Update local state with the new values
        setDisplayName(displayName.trim());
        setPhotoURL(photoURL);
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateUserEmail(user.uid, email);

      if (result.success) {
        toast({
          title: "Success",
          description: "Email updated successfully",
        });
        setIsEditing(false);
      } else {
        throw new Error(result.error || 'Failed to update email');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateUserPassword(currentPassword, newPassword);

      if (result.success) {
        toast({
          title: "Success",
          description: "Password updated successfully",
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(result.error || 'Failed to update password');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await updateUserSettings(user.uid, {
        display: {
          darkMode: darkMode,
        },
        notifications: {
          salary: notifySalary,
          expenses: notifyExpenses,
          recurring: notifyRecurring,
        },
      });
      
      setSettings({
        ...settings,
        display: {
          ...settings.display,
          darkMode: darkMode,
        },
      });
      
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      setError("Failed to update settings. Please try again.");
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        router.push('/auth/login');
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to log out",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteProfileImage();

      if (result.success) {
        toast({
          title: "Success",
          description: "Profile image deleted successfully",
        });
        setPhotoURL(null);
      } else {
        throw new Error(result.error || 'Failed to delete profile image');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to delete profile image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
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
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-muted">
                    {photoURL ? (
                      <img 
                        src={photoURL || undefined} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xl font-medium">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    variant="outline"
                    className="w-40"
                    onClick={() => document.getElementById('profile-image')?.click()}
                  >
                    <EditIcon className="mr-2 h-4 w-4" />
                    {user?.photoURL ? "Change Photo" : "Upload Photo"}
                  </Button>
                  {user?.photoURL && (
                    <Button
                      variant="outline"
                      className="w-40 text-destructive hover:text-destructive"
                      onClick={handleDeleteImage}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Photo
                    </Button>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
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
              <Button onClick={handleProfileUpdate} disabled={isLoading}>
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
                <Select value={settings.display.currency} onValueChange={(value) => {
                  setSettings({
                    ...settings,
                    display: {
                      ...settings.display,
                      currency: value,
                    },
                  });
                }}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode">Dark Mode</Label>
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={handleDarkModeChange}
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