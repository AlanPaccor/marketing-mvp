'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { supabase } from '@/app/supabase/client';

interface Campaign {
  id: string;
  title: string;
  description: string;
  brand_name: string;
  budget: number;
  requirements: string;
  is_public: boolean;
  created_at: string;
  status: string;
  image_url?: string;
  category?: string;
  deadline?: string;
}

export default function InfluencerOpportunities() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [publicCampaigns, setPublicCampaigns] = useState<Campaign[]>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    budgetMin: 0,
    budgetMax: 100000,
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      // If not an influencer account, redirect to appropriate dashboard
      if (user.userType !== 'influencer') {
        router.push('/business/dashboard');
        return;
      }
      
      fetchPublicCampaigns();
    }
  }, [user, loading, router]);

  const fetchPublicCampaigns = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching public campaigns:', error);
        return;
      }
      
      if (data) {
        console.log('Public campaigns:', data);
        setPublicCampaigns(data as Campaign[]);
      }
    } catch (error) {
      console.error('Error in fetchPublicCampaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to campaigns
  const filteredCampaigns = publicCampaigns
    .filter(campaign => {
      // Filter by category
      if (filters.category !== 'all' && campaign.category !== filters.category) {
        return false;
      }
      
      // Filter by budget range
      if (campaign.budget < filters.budgetMin || campaign.budget > filters.budgetMax) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected option
      if (filters.sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (filters.sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (filters.sortBy === 'budget-high') {
        return b.budget - a.budget;
      } else if (filters.sortBy === 'budget-low') {
        return a.budget - b.budget;
      }
      return 0;
    });

  const handleFilterChange = (name: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      budgetMin: 0,
      budgetMax: 100000,
      sortBy: 'newest'
    });
  };

  const openCampaignDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailOpen(true);
  };

  const closeCampaignDetail = () => {
    setIsDetailOpen(false);
  };

  const applyToCampaign = () => {
    // This would be implemented to handle campaign applications
    alert('Application submitted successfully!');
    closeCampaignDetail();
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
      <header className="bg-white shadow">
        {/* Header content remains the same */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/influencer/dashboard">
                  <span className="text-xl font-bold text-indigo-600">InfluencerHub</span>
                </Link>
              </div>
              <div className="ml-6 flex space-x-4">
                <Link 
                  href="/influencer/dashboard" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/influencer/campaigns" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Campaigns
                </Link>
                <Link 
                  href="/influencer/opportunities" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Opportunities
                </Link>
                <Link 
                  href="/influencer/analytics" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Analytics
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/store" 
                className="flex items-center text-gray-600 hover:text-indigo-600"
              >
                <div className="bg-indigo-100 rounded-full px-3 py-1 text-sm font-medium text-indigo-800 flex items-center">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  0 Tokens
                </div>
              </Link>
              <Link 
                href="/influencer/notifications" 
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and filter button */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Campaign Opportunities
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Discover available campaigns from brands looking for influencers like you.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white shadow rounded-lg mb-8 p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Categories</option>
                  <option value="fashion">Fashion</option>
                  <option value="beauty">Beauty</option>
                  <option value="tech">Tech</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700">Min Budget</label>
                <input
                  type="number"
                  id="budgetMin"
                  name="budgetMin"
                  value={filters.budgetMin}
                  onChange={(e) => handleFilterChange('budgetMin', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700">Max Budget</label>
                <input
                  type="number"
                  id="budgetMax"
                  name="budgetMax"
                  value={filters.budgetMax}
                  onChange={(e) => handleFilterChange('budgetMax', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort By</label>
                <select
                  id="sortBy"
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="budget-high">Budget: High to Low</option>
                  <option value="budget-low">Budget: Low to High</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">
            Showing {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-5">
                  {/* Header with title and category */}
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{campaign.title}</h3>
                    {campaign.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0 ml-2">
                        {campaign.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Brand name with icon */}
                  <div className="mt-2 flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium text-indigo-600">{campaign.brand_name}</p>
                  </div>
                  
                  {/* Divider */}
                  <div className="my-3 border-t border-gray-200"></div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-500 line-clamp-3 mb-4">{campaign.description}</p>
                  
                  {/* Key details in a grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-indigo-50 p-3 rounded-md">
                      <p className="text-xs font-medium text-indigo-700 mb-1">Budget</p>
                      <p className="text-sm font-bold text-gray-900">${campaign.budget.toLocaleString()}</p>
                    </div>
                    
                    {campaign.deadline ? (
                      <div className="bg-amber-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-amber-700 mb-1">Deadline</p>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(campaign.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-green-700 mb-1">Status</p>
                        <p className="text-sm font-bold text-gray-900">Open</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Requirements summary */}
                  {campaign.requirements && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                        <svg className="h-3 w-3 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Requirements
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">{campaign.requirements}</p>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openCampaignDetail(campaign)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      title="Save for later"
                    >
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Created date in small text */}
                  <p className="mt-3 text-xs text-gray-400 text-right">
                    Posted {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No campaigns match your current filter criteria.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Custom Modal Implementation */}
      {isDetailOpen && selectedCampaign && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={closeCampaignDetail}
              aria-hidden="true"
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Campaign Details
                      </h3>
                      <button
                        type="button"
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={closeCampaignDetail}
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mt-4 space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedCampaign.title}</h2>
                        <div className="flex items-center mt-2">
                          <svg className="h-5 w-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-md text-indigo-600 font-medium">{selectedCampaign.brand_name}</p>
                        </div>
                        
                        {selectedCampaign.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                            {selectedCampaign.category}
                          </span>
                        )}
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-500 flex items-center">
                          <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Description
                        </h3>
                        <div className="mt-2 bg-gray-50 p-4 rounded-md">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{selectedCampaign.description}</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Campaign Details</h3>
                        <div className="bg-indigo-50 p-4 rounded-md mb-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-indigo-700 font-medium">Budget</p>
                              <p className="text-xl font-bold text-gray-900">${selectedCampaign.budget.toLocaleString()}</p>
                            </div>
                            <svg className="h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {selectedCampaign.deadline && (
                            <div className="bg-amber-50 p-4 rounded-md">
                              <p className="text-xs text-amber-700 font-medium">Deadline</p>
                              <p className="text-sm font-bold text-gray-900">
                                {new Date(selectedCampaign.deadline).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-amber-600 mt-1">
                                {new Date(selectedCampaign.deadline) > new Date() 
                                  ? `${Math.ceil((new Date(selectedCampaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` 
                                  : 'Expired'}
                              </p>
                            </div>
                          )}
                          
                          <div className="bg-green-50 p-4 rounded-md">
                            <p className="text-xs text-green-700 font-medium">Created</p>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(selectedCampaign.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {Math.ceil((new Date().getTime() - new Date(selectedCampaign.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {selectedCampaign.requirements && (
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="text-sm font-medium text-gray-500 flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Requirements
                          </h3>
                          <div className="mt-2 bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-700 whitespace-pre-line">{selectedCampaign.requirements}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 pt-4">
                        <div className="bg-indigo-50 p-4 rounded-md">
                          <h3 className="text-sm font-medium text-indigo-800">Apply for this Campaign</h3>
                          <p className="mt-2 text-sm text-indigo-600">
                            Interested in working with this brand? Submit your application now.
                          </p>
                          <div className="mt-4 flex space-x-3">
                            <button
                              type="button"
                              onClick={applyToCampaign}
                              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Apply Now
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="Save for later"
                            >
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={closeCampaignDetail}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}