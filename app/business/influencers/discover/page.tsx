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
  const [filters, setFilters] = useState({
    platform: '',
    niche: '',
    minFollowers: '',
    maxFollowers: '',
    searchQuery: ''
  });
  
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
    }
  }, [user, loading, router]);
  
  const fetchInfluencers = async () => {
    try {
      setIsLoading(true);
      
      // Build the query
      let query = supabase.from('influencer_profiles').select('*');
      
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Discover Influencers</h1>
            <Link 
              href="/business/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {influencers.map((influencer) => (
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
                  <div className="flex justify-between">
                    <Link 
                      href={`/business/influencers/${influencer.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 