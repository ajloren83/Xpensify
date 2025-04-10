import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { updateUserProfile, updateUserPassword } from "@/lib/db";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera } from "lucide-react";

export function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.photoURL || null);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) return;

      const updatedUser = await updateUserProfile(user.uid, {
        displayName: formData.displayName,
        photoURL: profileImage,
      });

      updateUser(updatedUser);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      if (!user) return;

      await updateUserPassword(formData.currentPassword, formData.newPassword);

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile information and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImage || ""} alt={formData.displayName} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the camera icon to upload a profile picture
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to change your email.
              </p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 