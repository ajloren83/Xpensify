// app/auth/verify-email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, MailIcon } from 'lucide-react';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // No user is signed in, redirect to login
        router.push('/auth/login');
      } else if (user.emailVerified) {
        // User is verified, redirect to dashboard
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      await sendEmailVerification(user);
      setSuccess('Verification email has been sent. Please check your inbox.');
      setCountdown(60); // Set a 60-second countdown for resend
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error refreshing user status:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <MailIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We've sent you a verification link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Click the link in the email to verify your account. If you don't see it, check your spam folder.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={handleRefreshStatus} 
            variant="outline" 
            className="w-full"
          >
            I've verified my email
          </Button>
          
          <Button 
            onClick={handleResendVerification} 
            variant="ghost" 
            className="w-full"
            disabled={loading || countdown > 0}
          >
            {loading ? 'Sending...' : 
             countdown > 0 ? `Resend in ${countdown}s` : 
             'Resend verification email'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}