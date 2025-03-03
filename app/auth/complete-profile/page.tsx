'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, updateProfile, sendEmailVerification } from 'firebase/auth';
import { app } from '@/app/firebase/config';
import { supabase } from '@/app/supabase/client';

interface GoogleUser {
  uid: string;
  email: string | null;
}

export default function CompleteProfile() {
  const [userType, setUserType] = useState('business'); // 'business' or 'influencer'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    // Get the Google user from session storage
    const userJson = sessionStorage.getItem('googleAuthUser');
    if (!userJson) {
      router.push('/auth/signup');
      return;
    }

    try {
      const user = JSON.parse(userJson);
      setGoogleUser(user);
    } catch (err) {
      console.error('Error parsing Google user:', err);
      router.push('/auth/signup');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!googleUser) {
      setError('User information not found. Please try signing up again.');
      setLoading(false);
      return;
    }

    try {
      // Get the current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Store user type in displayName (format: "userType:displayName")
      await updateProfile(user, {
        displayName: `${userType}:${user.displayName || 'New User'}`
      });
      
      // Store user data in Supabase with the correct column names
      const { error: supabaseError } = await supabase
        .from('Users')
        .insert([
          { 
            firebase_uid: user.uid, 
            email: user.email, 
            userType: userType,
            created_at: new Date().toISOString()
          }
        ]);

      if (supabaseError) {
        // If it's a duplicate key error, it means another process already inserted the user
        // This is not a problem, we can just ignore it and continue
        if (supabaseError.code !== '23505') {
          console.error('Error storing user data in Supabase:', supabaseError);
        }
      }

      // Clear the session storage
      sessionStorage.removeItem('googleAuthUser');

      // Check if email is verified (Google users typically have verified emails)
      if (user.emailVerified) {
        // Email is verified, redirect to dashboard
        if (userType === 'business') {
          router.push('/business/dashboard');
        } else {
          router.push('/influencer/dashboard');
        }
      } else {
        // Send verification email and redirect to verification page
        await sendEmailVerification(user);
        router.push('/auth/verify-email');
      }
    } catch (err: any) {
      console.error('Error completing profile:', err);
      setError(err.message || 'An error occurred while completing your profile');
    } finally {
      setLoading(false);
    }
  };

  if (!googleUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-indigo-900">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-indigo-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Just one more step to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                I am a
              </label>
              <div className="mt-1">
                <select
                  id="userType"
                  name="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="business">Business</option>
                  <option value="influencer">Influencer</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Completing profile...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 