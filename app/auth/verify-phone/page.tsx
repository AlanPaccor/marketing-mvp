'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  getAuth, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  updatePhoneNumber, 
  PhoneInfoOptions,
  linkWithCredential,
  multiFactor,
  PhoneMultiFactorGenerator
} from 'firebase/auth';
import { app } from '@/app/firebase/config';

export default function VerifyPhone() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter code
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '';
  const auth = getAuth(app);

  useEffect(() => {
    // Check if email is verified
    const checkEmailVerification = async () => {
      const user = auth.currentUser;
      if (user) {
        // Reload user to get latest email verification status
        await user.reload();
        
        if (!user.emailVerified) {
          // Email not verified, redirect to verification page
          router.push('/auth/verify-email');
        }
      } else {
        // Not logged in, redirect to login
        router.push('/auth/login');
      }
    };
    
    checkEmailVerification();
    
    // Initialize reCAPTCHA verifier
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'normal',
          'callback': () => {
            // reCAPTCHA solved, allow sending verification code
            setRecaptchaVerified(true);
          },
          'expired-callback': () => {
            // Reset reCAPTCHA
            setRecaptchaVerified(false);
            setError('reCAPTCHA has expired. Please solve the reCAPTCHA again.');
          }
        });
        
        // Render the reCAPTCHA
        recaptchaVerifierRef.current.render();
      } catch (err) {
        console.error('Error initializing reCAPTCHA:', err);
      }
    }

    // Cleanup function
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (err) {
          console.error('Error clearing reCAPTCHA:', err);
        }
      }
    };
  }, [auth, router]);

  const sendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!recaptchaVerified) {
      setError('Please solve the reCAPTCHA before continuing.');
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to set up 2FA');
      }

      if (!user.emailVerified) {
        throw new Error('Please verify your email before setting up 2FA. Check your inbox for a verification link.');
      }

      // Format phone number to E.164 format
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedPhone = `+${phoneNumber}`;
      }

      // Get the multifactor session
      const multiFactorSession = await multiFactor(user).getSession();

      // Specify phone auth provider
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      // Send verification code
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        {
          phoneNumber: formattedPhone,
          session: multiFactorSession
        },
        recaptchaVerifierRef.current!
      );

      // Save the verification ID
      setVerificationId(verificationId);
      
      // Move to next step
      setStep(2);
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      
      // Provide a more user-friendly error message for unverified emails
      if (err.code === 'auth/unverified-email') {
        setError('You need to verify your email before setting up 2FA. Please check your inbox and click the verification link.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('The phone number you entered is invalid. Please enter a valid phone number including country code (e.g., +1234567890).');
      } else if (err.code === 'auth/invalid-app-credential' || err.code === 'auth/argument-error') {
        setError('reCAPTCHA verification failed. Please refresh the page and try again.');
        
        // Reset reCAPTCHA
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
            
            // Reinitialize reCAPTCHA
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'normal',
              'callback': () => {
                setRecaptchaVerified(true);
              },
              'expired-callback': () => {
                setRecaptchaVerified(false);
              }
            });
            
            recaptchaVerifierRef.current.render();
          } catch (err) {
            console.error('Error resetting reCAPTCHA:', err);
          }
        }
      } else {
        setError(err.message || 'Failed to send verification code');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to set up 2FA');
      }

      // Create credential
      const credential = PhoneMultiFactorGenerator.credential(verificationId, verificationCode);
      
      // Enroll the second factor
      await multiFactor(user).enroll(credential, "Phone Number");

      setSuccess(true);
      
      // Redirect after successful verification
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Get user type from displayName
        const userType = user.displayName?.split(':')[0];
        
        if (userType === 'business') {
          router.push('/business/dashboard');
        } else {
          router.push('/influencer/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-indigo-900">
          {step === 1 ? 'Set Up Two-Factor Authentication' : 'Verify Your Phone Number'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 
            ? 'Add an extra layer of security to your account' 
            : 'Enter the verification code sent to your phone'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-6" onSubmit={sendVerificationCode}>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number (with country code)
                </label>
                <div className="mt-1">
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+1234567890"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Include your country code (e.g., +1 for US, +44 for UK)
                </p>
              </div>

              <div className="flex justify-center">
                <div id="recaptcha-container" className="mb-4"></div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !recaptchaVerified}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (loading || !recaptchaVerified) ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={verifyCode}>
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
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
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 