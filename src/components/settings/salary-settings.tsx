import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { updateUserSalarySettings, getUserSalarySettings } from "@/lib/db";

interface SalarySettings {
  amount: number;
  creditDate: number; // 1-31 for day of month, or -1 for month-end
  currency: string;
}

export function SalarySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SalarySettings>({
    amount: 0,
    creditDate: 15,
    currency: "USD",
  });

  useEffect(() => {
    const loadSalarySettings = async () => {
      if (!user) return;
      
      try {
        const settings = await getUserSalarySettings(user.uid);
        if (settings) {
          setFormData(settings);
        }
      } catch (error) {
        console.error("Error loading salary settings:", error);
      }
    };
    
    loadSalarySettings();
  }, [user]);

  const handleChange = (key: keyof SalarySettings, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) return;

      await updateUserSalarySettings(user.uid, formData);

      toast({
        title: "Settings updated",
        description: "Your salary settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating salary settings:", error);
      toast({
        title: "Error",
        description: "Failed to update salary settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate options for credit date (1-31 and month-end)
  const creditDateOptions = [
    { value: -1, label: "Month End" },
    ...Array.from({ length: 31 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}${getDaySuffix(i + 1)}`,
    })),
  ];

  // Helper function to get the suffix for the day (1st, 2nd, 3rd, etc.)
  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary Settings</CardTitle>
        <CardDescription>
          Configure your salary information for better expense tracking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Salary Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creditDate">Credit Date</Label>
            <Select
              value={formData.creditDate.toString()}
              onValueChange={(value) => handleChange("creditDate", parseInt(value))}
            >
              <SelectTrigger id="creditDate">
                <SelectValue placeholder="Select credit date" />
              </SelectTrigger>
              <SelectContent>
                {creditDateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleChange("currency", value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 