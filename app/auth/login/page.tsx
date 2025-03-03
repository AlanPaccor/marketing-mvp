'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  signInWithEmailAndPassword, 
  getAuth, 
  MultiFactorError,
  PhoneAuthProvider,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
  multiFactor,
  sendEmailVerification
} from 'firebase/auth';
import { app } from '@/app/firebase/config';
import { supabase } from '@/app/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize invisible reCAPTCHA for 2FA
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      } catch (err) {
        console.error('Error initializing reCAPTCHA:', err);
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (err) {
          console.error('Error clearing reCAPTCHA:', err);
        }
      }
    };
  }, [auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Send verification email again
        await sendEmailVerification(user);
        
        // Redirect to email verification page
        router.push('/auth/verify-email');
        return;
      }
      
      // Get user type from Supabase
      const { data, error: supabaseError } = await supabase
        .from('Users')
        .select('userType')
        .eq('firebase_uid', user.uid)
        .single();
      
      if (supabaseError) {
        console.error('Error fetching user data from Supabase:', supabaseError);
        
        // If the error is that no rows were found, try to create the user in Supabase
        if (supabaseError.code === 'PGRST116') {
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
        
        // If we can't get the user type from Supabase, try to get it from Firebase
        const userType = user.displayName?.split(':')[0];
        
        if (userType === 'business') {
          router.push('/business/dashboard');
        } else if (userType === 'influencer') {
          router.push('/influencer/dashboard');
        } else {
          // No user type, redirect to complete profile
          sessionStorage.setItem('googleAuthUser', JSON.stringify({
            uid: user.uid,
            email: user.email
          }));
          router.push('/auth/complete-profile');
        }
        return;
      }
      
      // Redirect based on user type from Supabase
      if (data.userType === 'business') {
        router.push('/business/dashboard');
      } else {
        router.push('/influencer/dashboard');
      }
    } catch (err: any) {
      console.error('Error during login:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if this is a new user
      const isNewUser = result.operationType === 'signIn' && 
                        result._tokenResponse.isNewUser;

      if (isNewUser) {
        // New user - redirect to complete profile
        sessionStorage.setItem('googleAuthUser', JSON.stringify({
          uid: user.uid,
          email: user.email
        }));
        router.push('/auth/complete-profile');
      } else {
        // Check if email is verified
        if (!user.emailVerified) {
          await sendEmailVerification(user);
          router.push('/auth/verify-email');
          return;
        }
        
        // Get user type from Supabase
        const { data, error: supabaseError } = await supabase
          .from('Users')
          .select('userType')
          .eq('firebase_uid', user.uid)
          .single();
        
        if (supabaseError) {
          console.error('Error fetching user data from Supabase:', supabaseError);
          
          // If the error is that no rows were found, try to create the user in Supabase
          if (supabaseError.code === 'PGRST116') {
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
          
          // If we can't get the user type from Supabase, try to get it from Firebase
          const userType = user.displayName?.split(':')[0];
          
          if (userType === 'business') {
            router.push('/business/dashboard');
          } else if (userType === 'influencer') {
            router.push('/influencer/dashboard');
          } else {
            // No user type, redirect to complete profile
            sessionStorage.setItem('googleAuthUser', JSON.stringify({
              uid: user.uid,
              email: user.email
            }));
            router.push('/auth/complete-profile');
          }
          return;
        }
        
        // Redirect based on user type from Supabase
        if (data.userType === 'business') {
          router.push('/business/dashboard');
        } else {
          router.push('/influencer/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Error during Google sign in:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-indigo-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
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
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            {/* Hidden reCAPTCHA container for 2FA */}
            <div id="recaptcha-container"></div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Sign in with Google</span>
                <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                <span className="ml-2">{googleLoading ? 'Signing in...' : 'Google'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 