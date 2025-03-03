'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { app } from '@/app/firebase/config';
import { supabase } from '@/app/supabase/client';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmail(user.email || '');
        
        // If email is already verified, redirect to dashboard
        if (user.emailVerified) {
          redirectToDashboard(user.uid);
        }
      } else {
        // Not logged in, redirect to login
        router.push('/auth/login');
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, resendDisabled]);

  const redirectToDashboard = async (uid: string) => {
    try {
      // Get user type using the correct column name
      const { data, error } = await supabase
        .from('Users')
        .select('userType')
        .eq('firebase_uid', uid)
        .single();
      
      if (error) {
        console.error('Error fetching user data from Supabase:', error);
        
        // If the error is that no rows were found, try to create the user in Supabase
        if (error.code === 'PGRST116') {
          const user = auth.currentUser;
          if (user) {
            const userType = user.displayName?.split(':')[0];
            
            if (userType) {
              try {
                // Store user data in Supabase
                const { error: insertError } = await supabase
                  .from('Users')
                  .insert([
                    { 
                      firebase_uid: user.uid, 
                      email: user.email, 
                      userType: userType,
                      created_at: new Date().toISOString()
                    }
                  ]);
                
                if (insertError) {
                  // If it's a duplicate key error, it means another process already inserted the user
                  // This is not a problem, we can just ignore it and continue
                  if (insertError.code !== '23505') {
                    console.error('Error storing user data in Supabase:', insertError);
                  }
                }
              } catch (insertErr) {
                console.error('Exception storing user data in Supabase:', insertErr);
              }
              
              // Redirect based on user type
              if (userType === 'business') {
                router.push('/business/dashboard');
              } else {
                router.push('/influencer/dashboard');
              }
              return;
            } else {
              // No user type, redirect to complete profile
              sessionStorage.setItem('googleAuthUser', JSON.stringify({
                uid: user.uid,
                email: user.email
              }));
              router.push('/auth/complete-profile');
              return;
            }
          }
        }
        
        // Fallback to Firebase if we can't get the user type from Supabase
        const user = auth.currentUser;
        const userType = user?.displayName?.split(':')[0];
        
        if (userType === 'business') {
          router.push('/business/dashboard');
        } else if (userType === 'influencer') {
          router.push('/influencer/dashboard');
        } else {
          // No user type, redirect to complete profile
          sessionStorage.setItem('googleAuthUser', JSON.stringify({
            uid: user?.uid,
            email: user?.email
          }));
          router.push('/auth/complete-profile');
        }
        return;
      }
      
      // Redirect based on user type
      if (data.userType === 'business') {
        router.push('/business/dashboard');
      } else {
        router.push('/influencer/dashboard');
      }
    } catch (err) {
      console.error('Error redirecting to dashboard:', err);
      router.push('/auth/login');
    }
  };

  const handleContinue = async () => {
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not found');
      }

      // Reload the user to get the latest email verification status
      await user.reload();

      if (user.emailVerified) {
        // Email is verified, redirect to dashboard
        redirectToDashboard(user.uid);
      } else {
        setError('Your email is not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err: any) {
      console.error('Error checking email verification:', err);
      setError(err.message || 'An error occurred while checking email verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not found');
      }

      await sendEmailVerification(user);
      
      // Disable resend button for 60 seconds
      setResendDisabled(true);
      setCountdown(60);
      
      setError('');
    } catch (err: any) {
      console.error('Error resending verification email:', err);
      setError(err.message || 'An error occurred while resending verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-indigo-900">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a verification email to {email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <p>Please check your email and click the verification link to continue.</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Checking...' : 'I\'ve verified my email'}
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading || resendDisabled}
                className={`w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading || resendDisabled ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {resendDisabled 
                  ? `Resend email (${countdown}s)` 
                  : loading 
                    ? 'Sending...' 
                    : 'Resend verification email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 