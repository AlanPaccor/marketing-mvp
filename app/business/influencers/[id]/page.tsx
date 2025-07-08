'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/app/supabase/client';
import { spendTokens, getTokenBalance } from '@/app/utils/tokens';
import { notifyInfluencerOfContact } from '@/app/utils/notifications';

interface Influencer {
  id: string;
  user_id: string;
  full_name: string;
  platform: string;
  followers: number;
  niche: string;
  bio: string;
  profile_image_url?: string;
}

export default function InfluencerDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [userTokens, setUserTokens] = useState(0);
  const [contactCost, setContactCost] = useState(0);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  
  useEffect(() => {
    if (!loading) {
      // If not logged in, redirect to login
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      // If not a business account, redirect to appropriate dashboard
      if (user.userType !== 'business') {
        router.push('/influencer/dashboard');
        return;
      }
      
      // Fetch influencer details
      fetchInfluencerDetails();
      // Fetch user's token balance
      fetchUserTokens();
    }
  }, [user, loading, router, params]);
  
  const fetchInfluencerDetails = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setInfluencer(data);
    } catch (err: any) {
      console.error('Error fetching influencer details:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUserTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('tokens')
        .eq('user_id', user?.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setUserTokens(data?.tokens || 0);
    } catch (err: any) {
      console.error('Error fetching token balance:', err);
    }
  };
  
  const calculateContactCost = (followers: number) => {
    // Base cost is 100 tokens
    const baseCost = 100;
    
    // Calculate additional cost based on followers
    // For example: 100 + (followers / 10000) capped at 800
    let additionalCost = Math.floor(followers / 10000);
    
    // Cap the total cost at 800 tokens
    const totalCost = Math.min(baseCost + additionalCost, 800);
    
    return totalCost;
  };
  
  useEffect(() => {
    if (influencer) {
      const cost = calculateContactCost(influencer.followers);
      setContactCost(cost);
    }
  }, [influencer]);
  
  const handleContactClick = () => {
    setShowContactModal(true);
  };
  
  const handleConfirmContact = async () => {
    if (!influencer) return;
    
    try {
      // Use the token utility function to handle the transaction
      const success = await spendTokens(
        user?.id as string,
        contactCost,
        `Contact influencer: ${influencer.full_name}`,
        'influencer_contact',
        influencer.id
      );
      
      if (!success) {
        throw new Error('Failed to process token transaction');
      }
      
      // Create a record of the contact
      const { error: contactError } = await supabase
        .from('influencer_contacts')
        .insert({
          business_id: user?.id,
          influencer_id: influencer.id,
          status: 'pending',
          message: contactMessage,
          tokens_spent: contactCost,
          created_at: new Date().toISOString()
        });
        
      if (contactError) throw contactError;
      
      // Notify the influencer
      await notifyInfluencerOfContact(
        influencer.user_id,
        user?.id as string,
        user?.displayName || 'A business'
      );
      
      // Update local token count
      const newBalance = await getTokenBalance(user?.id as string);
      setUserTokens(newBalance);
      
      // Close the modal and show success message
      setShowContactModal(false);
      setContactSuccess(true);
      
      // Reset after a few seconds
      setTimeout(() => {
        setContactSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error contacting influencer:', err);
      setContactError('Failed to contact influencer. Please try again.');
    }
  };
  
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };
  
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white shadow rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Influencer Not Found</h3>
            <p className="mt-1 text-sm text-gray-500">{error || "We couldn't find the influencer you're looking for."}</p>
            <div className="mt-6">
              <Link
                href="/business/influencers/discover"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Discover
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Influencer Profile</h1>
            <div className="flex items-center">
              <span className="mr-4 text-sm font-medium text-gray-600">
                Your Tokens: <span className="text-indigo-600 font-bold">{userTokens}</span>
              </span>
              <Link 
                href="/business/influencers/discover" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Back to Discover
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                {influencer.profile_image_url ? (
                  <Image 
                    src={influencer.profile_image_url} 
                    alt={influencer.full_name} 
                    width={96} 
                    height={96} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-3xl font-semibold text-gray-500">
                      {influencer.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-900">{influencer.full_name}</h2>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {influencer.platform}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">{formatFollowers(influencer.followers)} followers</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{influencer.niche}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{influencer.bio}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Platform</dt>
                <dd className="mt-1 text-sm text-gray-900">{influencer.platform}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Followers</dt>
                <dd className="mt-1 text-sm text-gray-900">{influencer.followers.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Niche</dt>
                <dd className="mt-1 text-sm text-gray-900">{influencer.niche}</dd>
              </div>
            </dl>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:px-6">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save to List
              </button>
              <button
                type="button"
                onClick={handleContactClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Contact for {contactCost} Tokens
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Contact Influencer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You are about to spend <span className="font-bold">{contactCost} tokens</span> to contact {influencer?.full_name}. 
                        This will allow you to send a direct message and proposal to this influencer.
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Your current balance: <span className="font-bold">{userTokens} tokens</span>
                      </p>
                      {userTokens < contactCost && (
                        <p className="mt-2 text-sm text-red-500 font-medium">
                          You don't have enough tokens. Please purchase more tokens to continue.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmContact}
                  disabled={userTokens < contactCost}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    userTokens >= contactCost ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'
                  }`}
                >
                  Confirm ({contactCost} Tokens)
                </button>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 