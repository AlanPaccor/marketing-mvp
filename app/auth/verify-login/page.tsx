'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  getAuth, 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  multiFactor,
  MultiFactorError,
  PhoneMultiFactorGenerator
} from 'firebase/auth';
import { app } from '@/app/firebase/config';

export default function VerifyLogin() {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const auth = getAuth(app);

  useEffect(() => {
    if (!sessionId) {
      router.push('/auth/login');
    }
  }, [sessionId, router]);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get the resolver from session storage
      const resolverData = sessionStorage.getItem('multiFactorResolver');
      if (!resolverData) {
        throw new Error('Authentication session expired. Please login again.');
      }
      
      const resolver = JSON.parse(resolverData);
      
      // Create credential
      const credential = PhoneMultiFactorGenerator.credential(
        resolver.hints[0].uid, 
        verificationCode
      );
      
      // Complete sign in
      const userCredential = await multiFactor(auth).resolveSignIn(resolver, credential);
      const user = userCredential.user;

      // Get user type from displayName
      const userType = user.displayName?.split(':')[0];

      // Redirect based on user type
      if (userType === 'business') {
        router.push('/business/dashboard');
      } else {
        router.push('/influencer/dashboard');
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
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the verification code sent to your phone
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
} 