import { useState, useEffect } from "react";
import { useSettings } from "@/lib/settings-context";
import { getUserSettings, updateUserSettings } from "@/lib/db";
import { auth } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const { settings, setSettings } = useSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userSettings = await getUserSettings(auth.currentUser.uid);
        if (userSettings) {
          console.log('Loaded user settings:', userSettings);
          setSettings({
            ...settings,
            display: {
              ...settings.display,
              ...userSettings.display,
            },
            notifications: {
              ...settings.notifications,
              ...userSettings.notifications,
            },
          });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Saving settings with currency:', {
        userId: auth.currentUser.uid,
        currency: settings.display.currency,
        fullSettings: settings
      });
      
      const result = await updateUserSettings(auth.currentUser.uid, {
        display: {
          currency: settings.display.currency,
          language: settings.display.language,
          darkMode: settings.display.darkMode,
        },
        notifications: {
          salary: settings.notifications.salary,
          expenses: settings.notifications.expenses,
          recurring: settings.notifications.recurring,
        },
      });
      
      console.log('Settings save result:', result);
      
      if (result.success) {
        setSuccess("Settings saved successfully!");
        toast({
          title: "Success",
          description: "Your settings have been saved.",
        });

        // Reload settings to ensure they're properly updated
        const updatedSettings = await getUserSettings(auth.currentUser.uid);
        console.log('Reloaded settings after save:', {
          currency: updatedSettings?.display?.currency,
          fullSettings: updatedSettings
        });
        
        if (updatedSettings) {
          setSettings({
            ...settings,
            display: {
              ...settings.display,
              ...updatedSettings.display,
            },
            notifications: {
              ...settings.notifications,
              ...updatedSettings.notifications,
            },
          });
        }
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError("Failed to save settings. Please try again.");
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCurrencyChange = (value: string) => {
    console.log('Currency change triggered:', {
      oldCurrency: settings.display.currency,
      newCurrency: value
    });
    setSettings({
      ...settings,
      display: {
        ...settings.display,
        currency: value,
      },
    });
  };

  const handleLanguageChange = (value: string) => {
    setSettings({
      ...settings,
      display: {
        ...settings.display,
        language: value,
      },
    });
  };

  const handleDarkModeChange = (checked: boolean) => {
    setSettings({
      ...settings,
      display: {
        ...settings.display,
        darkMode: checked,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select value={settings.display.currency} onValueChange={handleCurrencyChange}>
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

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select value={settings.display.language} onValueChange={handleLanguageChange}>
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

      <div className="flex items-center justify-between">
        <Label htmlFor="darkMode">Dark Mode</Label>
        <Switch
          id="darkMode"
          checked={settings.display.darkMode}
          onCheckedChange={handleDarkModeChange}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {success && (
        <div className="text-green-500 text-sm">{success}</div>
      )}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
} 