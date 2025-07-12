'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { createPaymentIntent, TOKEN_PACKAGES, PackageId } from '@/app/utils/stripe';
import { supabase } from '@/app/supabase/client';
import PaymentModal from '@/app/components/PaymentModal';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'tokens' | 'boosts' | 'subscriptions';
  userType: 'all' | 'influencer' | 'business';
  popular?: boolean;
  image?: string;
  duration?: string;
  features?: string[];
}

export default function StorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [userTokens, setUserTokens] = useState(0);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    packageId: PackageId;
    packageName: string;
    tokens: number;
    price: number;
  }>({
    isOpen: false,
    packageId: 'small',
    packageName: '',
    tokens: 0,
    price: 0
  });

  const loadStoreData = useCallback(async () => {
    try {
      setIsLoading(true);
      
            // Load user's token balance via API
      if (user) {
        try {
          console.log('Loading tokens for user:', user.id);
          
          // Get Firebase ID token
          const idToken = await user.firebaseUser?.getIdToken();
          
          if (!idToken) {
            console.error('No ID token available');
            setUserTokens(0);
            return;
          }
          
          // Call API to get tokens
          const response = await fetch('/api/user/tokens', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.error('Failed to fetch tokens:', response.status);
            setUserTokens(0);
            return;
          }
          
          const data = await response.json();
          console.log('User tokens loaded:', data.token_balance);
          setUserTokens(data.token_balance || 0);
          
        } catch (error) {
          console.error('Exception loading user tokens:', error);
          setUserTokens(0);
        }
      }
      
      // Create token packages based on our Stripe configuration
      const tokenItems: StoreItem[] = Object.entries(TOKEN_PACKAGES).map(([id, pkg]) => ({
        id: `tokens-${id}`,
        name: `${pkg.tokens.toLocaleString()} Tokens`,
        description: `${pkg.name} - Perfect for ${pkg.tokens < 2000 ? 'small' : pkg.tokens < 4000 ? 'medium' : 'large'} campaigns and profile boosts.`,
        price: pkg.price,
        category: 'tokens' as const,
        userType: 'all',
        popular: id === 'medium',
        image: '/images/store/tokens-medium.png'
      }));
      
      const allStoreItems: StoreItem[] = [
        ...tokenItems,
        
        // Boosts for Influencers
        {
          id: 'boost-profile-influencer',
          name: 'Profile Boost',
          description: 'Increase your profile visibility to brands for 7 days.',
          price: 50,
          category: 'boosts' as const,
          userType: 'influencer',
          image: '/images/store/profile-boost.png'
        },
        {
          id: 'boost-featured-influencer',
          name: 'Featured Influencer',
          description: 'Get featured in the top influencers section for 3 days.',
          price: 100,
          category: 'boosts' as const,
          userType: 'influencer',
          popular: true,
          image: '/images/store/featured-boost.png'
        },
        
        // Boosts for Businesses
        {
          id: 'boost-campaign-business',
          name: 'Campaign Boost',
          description: 'Promote your campaign to more relevant influencers for 5 days.',
          price: 75,
          category: 'boosts' as const,
          userType: 'business',
          image: '/images/store/campaign-boost.png'
        },
        {
          id: 'boost-urgent-business',
          name: 'Urgent Campaign Tag',
          description: 'Mark your campaign as urgent to attract immediate attention.',
          price: 50,
          category: 'boosts' as const,
          userType: 'business',
          image: '/images/store/urgent-tag.png'
        },
        
        // Subscriptions
        {
          id: 'subscription-basic-weekly',
          name: 'Basic Weekly',
          description: 'Essential features to boost your success on the platform.',
          price: 9.99,
          category: 'subscriptions' as const,
          userType: 'all',
          duration: 'Weekly',
          features: [
            'Verified badge',
            '50 tokens per week',
            'Priority support',
            'Basic analytics'
          ]
        },
        {
          id: 'subscription-pro-monthly',
          name: 'Pro Monthly',
          description: 'Advanced features for serious platform users.',
          price: 29.99,
          category: 'subscriptions' as const,
          userType: 'all',
          popular: true,
          duration: 'Monthly',
          features: [
            'Verified badge',
            '250 tokens per month',
            'Priority support',
            'Advanced analytics',
            'Early access to new features',
            'No commission fees'
          ]
        },
        {
          id: 'subscription-business-monthly',
          name: 'Business Monthly',
          description: 'Specialized features for businesses and brands.',
          price: 49.99,
          category: 'subscriptions' as const,
          userType: 'business',
          duration: 'Monthly',
          features: [
            'Verified business badge',
            '500 tokens per month',
            'Priority campaign placement',
            'Advanced analytics dashboard',
            'Bulk messaging to influencers',
            'Dedicated account manager',
            'Custom campaign templates'
          ]
        },
        {
          id: 'subscription-influencer-monthly',
          name: 'Influencer Monthly',
          description: 'Specialized features for professional influencers.',
          price: 39.99,
          category: 'subscriptions' as const,
          userType: 'influencer',
          duration: 'Monthly',
          features: [
            'Verified influencer badge',
            '350 tokens per month',
            'Priority in search results',
            'Advanced performance analytics',
            'Exclusive campaign access',
            'Custom profile customization',
            'Direct messaging with brands'
          ]
        }
      ];

      // Filter items based on user type
      const filteredItems = allStoreItems.filter(item => {
        return item.userType === 'all' || item.userType === user?.userType;
      });

      setStoreItems(filteredItems);
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      loadStoreData();
    }
  }, [user, loading, loadStoreData]);

  // Handle payment success/cancel URLs
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      // Reload token balance after successful payment
      loadStoreData();
      // Clean up URL
      router.replace('/store');
    } else if (canceled === 'true') {
      // Clean up URL
      router.replace('/store');
    }
  }, [searchParams, router, loadStoreData]);

  const handlePurchase = async (item: StoreItem) => {
    console.log('🛒 Purchase initiated for item:', item);
    
    try {
      setProcessingPayment(item.id);
      console.log('⏳ Processing payment for item:', item.id);
      
      if (item.category === 'tokens') {
        // Extract package ID from item ID (e.g., "tokens-small" -> "small")
        const packageId = item.id.replace('tokens-', '') as PackageId;
        const packageConfig = TOKEN_PACKAGES[packageId];
        
        console.log('💰 Token purchase details:', {
          packageId,
          packageConfig,
          user: user?.id
        });
        
        // Open payment modal
        setPaymentModal({
          isOpen: true,
          packageId,
          packageName: packageConfig.name,
          tokens: packageConfig.tokens,
          price: packageConfig.price
        });
        
        console.log('🎭 Payment modal opened with data:', {
          packageId,
          packageName: packageConfig.name,
          tokens: packageConfig.tokens,
          price: packageConfig.price
        });
        
      } else if (item.category === 'boosts') {
        // Check if user has enough tokens
        if (userTokens < item.price) {
          alert('Not enough tokens for this boost. Please purchase more tokens first.');
          return;
        }
        
        // Deduct tokens from user's balance in Users table
        const { error } = await supabase
          .from('Users')
          .update({ token_balance: userTokens - item.price })
          .eq('firebase_uid', user?.id);
        
        if (error) {
          alert('Error processing boost purchase. Please try again.');
          return;
        }
        
        // Update local state
        setUserTokens(prevTokens => prevTokens - item.price);
        alert(`Successfully purchased ${item.name}!`);
        
      } else if (item.category === 'subscriptions') {
        // Handle subscription logic (would integrate with Stripe Subscriptions)
        alert('Subscription functionality coming soon!');
      }
      
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert('There was an error processing your purchase. Please try again.');
    } finally {
      setProcessingPayment(null);
    }
  };

  // Filter items based on active tab
  const filteredItems = storeItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                InfluencerHub
              </Link>
            </div>
            <div className="flex items-center">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="bg-indigo-100 rounded-full px-3 py-1 text-sm font-medium text-indigo-800">
                  {userTokens} Tokens
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Store
            </h2>
          </div>
        </div>

        <div className="rounded-md bg-blue-50 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Welcome to the InfluencerHub store! Here you can purchase tokens, boosts, and subscriptions to enhance your experience.
                {user?.userType === 'influencer' && (
                  <>
                    <br />
                    <span className="font-medium">As an Influencer:</span> Boost your profile visibility and attract more brand partnerships with our specialized offerings.
                  </>
                )}
                {user?.userType === 'business' && (
                  <>
                    <br />
                    <span className="font-medium">As a Business:</span> Promote your campaigns and reach the perfect influencers for your brand with our targeted solutions.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`${
                activeTab === 'tokens'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Tokens
            </button>
            <button
              onClick={() => setActiveTab('boosts')}
              className={`${
                activeTab === 'boosts'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Boosts
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`${
                activeTab === 'subscriptions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Subscriptions
            </button>
          </nav>
        </div>

        {/* Store Items Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white overflow-hidden shadow rounded-lg border ${item.popular ? 'border-indigo-500' : 'border-transparent'}`}
            >
              {item.popular && (
                <div className="bg-indigo-500 text-white text-xs font-semibold px-2 py-1 text-center">
                  POPULAR
                </div>
              )}
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    {item.category === 'subscriptions' && item.duration && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        {item.duration}
                      </span>
                    )}
                    <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  </div>
                  {item.image && (
                    <div className="h-12 w-12 bg-indigo-100 rounded-md flex items-center justify-center">
                      <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {item.features && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500">Features:</h4>
                    <ul className="mt-2 space-y-1">
                      {item.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-4">
                  <div className="flex items-baseline">
                    {item.category === 'subscriptions' && item.duration ? (
                      <span className="text-2xl font-semibold text-gray-900">${item.price.toFixed(2)}<span className="text-sm text-gray-500">/{item.duration.toLowerCase()}</span></span>
                    ) : item.category === 'tokens' ? (
                      <span className="text-2xl font-semibold text-gray-900">${item.price.toFixed(2)}</span>
                    ) : (
                      <span className="text-2xl font-semibold text-gray-900">{item.price} Tokens</span>
                    )}
                  </div>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handlePurchase(item)}
                    disabled={
                      (item.category === 'boosts' && userTokens < item.price) ||
                      processingPayment === item.id
                    }
                    className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                      ${(item.category === 'boosts' && userTokens < item.price) || processingPayment === item.id
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                  >
                    {processingPayment === item.id ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      item.category === 'subscriptions' ? 'Subscribe' : item.category === 'tokens' ? 'Purchase' : 'Redeem'
                    )}
                  </button>
                  
                  {item.category === 'boosts' && userTokens < item.price && (
                    <p className="mt-2 text-xs text-red-600">
                      Not enough tokens. You need {item.price - userTokens} more.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Information Section */}
        <div className="mt-12 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              About Our Offerings
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">What are tokens?</h4>
                <p className="mt-1 text-sm text-gray-700">
                  Tokens are the platform's virtual currency that can be used to purchase boosts and premium features. 
                  You can buy tokens with real money and use them to enhance your experience on the platform.
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">How do boosts work?</h4>
                <p className="mt-1 text-sm text-gray-700">
                  Boosts are temporary enhancements that increase your visibility and chances of success.
                  {user?.userType === 'influencer' && (
                    <>
                      <br />
                      <span className="font-medium">For Influencers:</span> Boosts can help you get discovered by more brands and receive better campaign offers.
                    </>
                  )}
                  {user?.userType === 'business' && (
                    <>
                      <br />
                      <span className="font-medium">For Businesses:</span> Boosts can help your campaigns reach more relevant influencers and get faster responses.
                    </>
                  )}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Subscription Benefits</h4>
                <p className="mt-1 text-sm text-gray-700">
                  Our subscription plans offer a comprehensive package of premium features at a discounted rate. 
                  Subscribers receive regular token allocations, exclusive features, and priority support to maximize their success on the platform.
                  {user?.userType === 'influencer' && (
                    <> We offer specialized influencer plans designed to help you grow your brand partnerships and increase your earnings. </>
                  )}
                  {user?.userType === 'business' && (
                    <> We offer specialized business plans designed to help you reach the right influencers and maximize your campaign success. </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        packageId={paymentModal.packageId}
        packageName={paymentModal.packageName}
        tokens={paymentModal.tokens}
        price={paymentModal.price}
      />
    </div>
  );
} 