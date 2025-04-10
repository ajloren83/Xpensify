// app/auth/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, LockKeyhole } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <LockKeyhole className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Reset password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  Password reset link sent. Check your email.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Click the link in the email to reset your password. If you don't see it, check your spam folder.
                </p>
                <Button 
                  onClick={() => router.push('/auth/login')} 
                  className="mt-4 w-full bg-gradient-to-br from-[#63C94E] to-[#15614E]"
                >
                  Back to login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-br from-[#63C94E] to-[#15614E]" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </CardContent>
        {!success && (
          <CardFooter className="flex justify-center">
            <Link href="/auth/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}