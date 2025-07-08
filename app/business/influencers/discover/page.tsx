'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/app/supabase/client';

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

export default function DiscoverInfluencers() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState(0);
  const [filters, setFilters] = useState({
    platform: '',
    niche: '',
    minFollowers: '',
    maxFollowers: '',
    searchQuery: ''
  });
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  
  // Available filter options
  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'Other'];
  const niches = ['Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 'Technology', 'Gaming', 'Lifestyle', 'Business', 'Other'];
  
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
      
      // Fetch influencers
      fetchInfluencers();
      // Fetch user's token balance
      fetchUserTokens();
    }
  }, [user, loading, router]);
  
  const fetchInfluencers = async () => {
    try {
      setIsLoading(true);
      
      // Build the query
      let query = supabase.from('influencer_profiles').select('*');
      
      // Check if any filters are applied
      const hasFilters = filters.platform || 
                        filters.niche || 
                        filters.minFollowers || 
                        filters.maxFollowers || 
                        filters.searchQuery;
      
      // Apply filters if they exist
      if (filters.platform) {
        query = query.eq('platform', filters.platform);
      }
      
      if (filters.niche) {
        query = query.eq('niche', filters.niche);
      }
      
      if (filters.minFollowers) {
        query = query.gte('followers', parseInt(filters.minFollowers));
      }
      
      if (filters.maxFollowers) {
        query = query.lte('followers', parseInt(filters.maxFollowers));
      }
      
      if (filters.searchQuery) {
        query = query.or(`full_name.ilike.%${filters.searchQuery}%,bio.ilike.%${filters.searchQuery}%`);
      }
      
      // If no filters are applied, order by random
      if (!hasFilters) {
        // Use the correct syntax for random ordering in Supabase
        const { data, error } = await query.limit(12);
        
        if (error) {
          throw error;
        }
        
        // Randomize the results client-side if no filters are applied
        const randomizedData = data ? [...data].sort(() => Math.random() - 0.5) : [];
        setInfluencers(randomizedData);
        return; // Exit early since we've already set the influencers
      } else {
        // With filters, sort by followers (descending) as a default sort
        query = query.order('followers', { ascending: false });
      }
      
      // Limit the number of results to prevent loading too many
      query = query.limit(12);
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setInfluencers(data || []);
    } catch (err: any) {
      console.error('Error fetching influencers:', err);
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
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInfluencers();
  };
  
  const resetFilters = () => {
    setFilters({
      platform: '',
      niche: '',
      minFollowers: '',
      maxFollowers: '',
      searchQuery: ''
    });
  };
  
  const formatFollowers = (count: number | null | undefined): string => {
    if (count === null || count === undefined) {
      return '0';
    }
    
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };
  
  const handleContactClick = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setShowContactModal(true);
  };
  
  const handleConfirmContact = async () => {
    if (!selectedInfluencer) return;
    
    try {
      const contactCost = calculateContactCost(selectedInfluencer.followers);
      
      // Check if user has enough tokens
      if (userTokens < contactCost) {
        alert('You do not have enough tokens to contact this influencer.');
        return;
      }
      
      // Deduct tokens from user's balance
      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({ tokens: userTokens - contactCost })
        .eq('user_id', user?.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Record the contact in the database
      const { error: contactError } = await supabase
        .from('influencer_contacts')
        .insert({
          business_id: user?.id,
          influencer_id: selectedInfluencer.user_id,
          tokens_spent: contactCost,
          status: 'pending',
          created_at: new Date()
        });
      
      if (contactError) {
        throw contactError;
      }
      
      // Update local token count
      setUserTokens(userTokens - contactCost);
      
      // Close modal and show success message
      setShowContactModal(false);
      alert('Contact request sent successfully!');
      
    } catch (err: any) {
      console.error('Error processing contact request:', err);
      alert('Failed to process your request. Please try again.');
    }
  };
  
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/business/dashboard">
                  <span className="text-xl font-bold text-indigo-600">InfluencerHub</span>
                </Link>
              </div>
              <div className="ml-6 flex space-x-4">
                <Link 
                  href="/business/dashboard" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/business/campaigns" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Campaigns
                </Link>
                <Link 
                  href="/business/influencers/discover" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Influencers
                </Link>
                <Link 
                  href="/business/analytics" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Analytics
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600">
                Your Tokens: <span className="text-indigo-600 font-bold">{userTokens}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Discover Influencers</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Filter Influencers</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-gray-700">Platform</label>
                  <select
                    id="platform"
                    name="platform"
                    value={filters.platform}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Platforms</option>
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="niche" className="block text-sm font-medium text-gray-700">Niche</label>
                  <select
                    id="niche"
                    name="niche"
                    value={filters.niche}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Niches</option>
                    {niches.map(niche => (
                      <option key={niche} value={niche}>{niche}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="minFollowers" className="block text-sm font-medium text-gray-700">Min Followers</label>
                  <input
                    type="number"
                    name="minFollowers"
                    id="minFollowers"
                    value={filters.minFollowers}
                    onChange={handleFilterChange}
                    placeholder="e.g. 1000"
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="maxFollowers" className="block text-sm font-medium text-gray-700">Max Followers</label>
                  <input
                    type="number"
                    name="maxFollowers"
                    id="maxFollowers"
                    value={filters.maxFollowers}
                    onChange={handleFilterChange}
                    placeholder="e.g. 100000"
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700">Search</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="searchQuery"
                    id="searchQuery"
                    value={filters.searchQuery}
                    onChange={handleFilterChange}
                    placeholder="Search by name or bio"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Search
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                >
                  Reset Filters
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Results */}
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : influencers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No influencers found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {influencers.map((influencer) => {
              const contactCost = calculateContactCost(influencer.followers);
              
              return (
                <div key={influencer.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                        {influencer.profile_image_url ? (
                          <Image 
                            src={influencer.profile_image_url} 
                            alt={influencer.full_name} 
                            width={64} 
                            height={64} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-xl font-semibold text-gray-500">
                              {influencer.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{influencer.full_name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {influencer.platform}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">{formatFollowers(influencer.followers)} followers</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{influencer.niche}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 line-clamp-3">{influencer.bio}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="flex justify-between items-center">
                      <Link 
                        href={`/business/influencers/${influencer.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleContactClick(influencer)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        Contact ({contactCost} Tokens)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Contact Modal */}
      {showContactModal && selectedInfluencer && (
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
                        You are about to spend <span className="font-bold">{calculateContactCost(selectedInfluencer.followers)} tokens</span> to contact {selectedInfluencer.full_name}. 
                        This will allow you to send a direct message and proposal to this influencer.
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Your current balance: <span className="font-bold">{userTokens} tokens</span>
                      </p>
                      {userTokens < calculateContactCost(selectedInfluencer.followers) && (
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
                  disabled={userTokens < calculateContactCost(selectedInfluencer.followers)}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    userTokens >= calculateContactCost(selectedInfluencer.followers) ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'
                  }`}
                >
                  Confirm ({calculateContactCost(selectedInfluencer.followers)} Tokens)
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