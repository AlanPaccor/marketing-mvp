'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/supabase/client';
import Link from 'next/link';

interface Influencer {
  id: string;
  firebase_uid: string;
  email: string;
  userType: string;
  created_at: string;
  profile?: any;
  followers: number;
  primary_platform: string;
  niche: string;
  bio: string;
  full_name: string;
  avatar_url: string;
  engagement_rate?: number;
  avg_likes?: number;
  location?: string;
  audience_demographics?: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  platform: string;
  followers: number;
  niche: string;
  bio: string;
  profile_image_url: string;
}

interface Campaign {
  id: number;
  title: string;
  custom_id?: string;
  // Add other properties as needed
}

export default function SearchInfluencersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filters, setFilters] = useState({
    platform: '',
    category: '',
    minFollowers: '',
    maxFollowers: '',
    location: ''
  });
  const [selectionMode, setSelectionMode] = useState<'individual' | 'group'>('individual');

  // Fetch campaign details
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;
      
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .maybeSingle();
          
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Campaign not found');
        
        setCampaign(data);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('Failed to load campaign details');
      }
    };
    
    fetchCampaign();
  }, [campaignId]);

  // Fetch influencers
  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch influencers...');
        
        // Check if any filters are applied
        const hasActiveFilters = 
          filters.platform !== '' || 
          filters.category !== '' || 
          filters.minFollowers !== '' || 
          filters.maxFollowers !== '' || 
          filters.location !== '';
        
        // Direct query to influencer_profiles table
        let query = supabase.from('influencer_profiles').select('*');
        
        // Apply filters
        if (filters.platform && filters.platform !== '') {
          query = query.eq('platform', filters.platform);
        }
        
        if (filters.category && filters.category !== '') {
          // Make the category filter case-insensitive
          query = query.ilike('niche', `%${filters.category}%`);
        }
        
        if (filters.minFollowers && filters.minFollowers !== '') {
          query = query.gte('followers', parseInt(filters.minFollowers));
        }
        
        if (filters.maxFollowers && filters.maxFollowers !== '') {
          query = query.lte('followers', parseInt(filters.maxFollowers));
        }
        
        if (filters.location && filters.location.trim() !== '') {
          query = query.ilike('location', `%${filters.location}%`);
        }
        
        const { data, error } = await query;
        
        console.log('Query results:', { data, error });
        
        if (error) {
          console.error('Error fetching influencers:', error);
          throw new Error('Could not fetch influencers');
        }
        
        if (data && data.length > 0) {
          console.log('Found influencers:', data.length);
          
          // Map the data to the expected format
          let mappedInfluencers = data.map(profile => ({
            id: profile.id,
            firebase_uid: profile.user_id,
            email: profile.email || '',
            userType: 'influencer',
            created_at: profile.created_at || new Date().toISOString(),
            followers: profile.followers || 0,
            primary_platform: profile.platform || '',
            niche: profile.niche || '',
            bio: profile.bio || '',
            full_name: profile.full_name || '',
            avatar_url: profile.profile_image_url || '',
            engagement_rate: profile.engagement_rate,
            avg_likes: profile.avg_likes,
            location: profile.location,
            audience_demographics: profile.audience_demographics
          }));
          
          // Randomize the order if no filters are applied
          if (!hasActiveFilters) {
            mappedInfluencers = shuffleArray(mappedInfluencers);
          }
          
          setInfluencers(mappedInfluencers);
        } else {
          console.log('No influencers found');
          setInfluencers([]);
        }
      } catch (err) {
        console.error('Error in fetchInfluencers:', err);
        setError('Failed to load influencers: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchInfluencers();
  }, [filters]);

  // Add this helper function to shuffle the array
  const shuffleArray = (array: any[]) => {
    // Create a copy of the array to avoid mutating the original
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      // Generate a random index from 0 to i
      const j = Math.floor(Math.random() * (i + 1));
      // Swap elements at indices i and j
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleInfluencerSelection = (influencerId: string) => {
    if (selectionMode === 'individual') {
      setSelectedInfluencers([influencerId]);
    } else {
      setSelectedInfluencers(prev => {
        if (prev.includes(influencerId)) {
          return prev.filter(id => id !== influencerId);
        } else {
          return [...prev, influencerId];
        }
      });
    }
  };

  const inviteInfluencers = async () => {
    if (selectedInfluencers.length === 0) {
      alert('Please select at least one influencer');
      return;
    }
    
    setInviting(true);
    
    try {
      // Create campaign invitations for each selected influencer
      const invitations = selectedInfluencers.map(influencerId => ({
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: 'pending',
        created_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('campaign_invitations')
        .insert(invitations)
        .select();
        
      if (error) throw new Error(error.message);
      
      alert(`Successfully invited ${selectedInfluencers.length} influencer(s) to your campaign!`);
      
      // Redirect back to campaign page
      router.push(campaign?.custom_id 
        ? `/business/campaigns/c/${campaign.custom_id}` 
        : `/business/campaigns/${campaignId}`);
        
    } catch (err) {
      console.error('Error inviting influencers:', err);
      setError('Failed to invite influencers. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
          <Link href="/business/campaigns" className="text-indigo-600 hover:text-indigo-900">
            ← Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Search Influencers for {campaign?.title}
            </h1>
            <Link
              href={campaign?.custom_id 
                ? `/business/campaigns/c/${campaign.custom_id}` 
                : `/business/campaigns/${campaignId}`}
              className="text-indigo-600 hover:text-indigo-900"
            >
              ← Back to campaign
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Filter Influencers</h2>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Selection Mode:</span>
              <div className="relative inline-flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('individual');
                    // When switching to individual mode, either clear all selections or keep only the first one
                    if (selectedInfluencers.length > 1) {
                      // Option 1: Keep only the first selected influencer
                      setSelectedInfluencers([selectedInfluencers[0]]);
                      
                      // Option 2 (alternative): Clear all selections
                      // setSelectedInfluencers([]);
                    }
                  }}
                  className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
                    selectionMode === 'individual' 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('group');
                    // Keep current selections when switching to group mode
                  }}
                  className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
                    selectionMode === 'group' 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                >
                  Group
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700">
                Platform
              </label>
              <select
                id="platform"
                name="platform"
                value={filters.platform}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Platforms</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Twitter">Twitter</option>
                <option value="Facebook">Facebook</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Pinterest">Pinterest</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Niche
              </label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Niches</option>
                <option value="fashion">Fashion</option>
                <option value="beauty">Beauty</option>
                <option value="fitness">Fitness</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="technology">Technology</option>
                <option value="gaming">Gaming</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="business">Business</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. New York, USA"
              />
            </div>
            
            <div>
              <label htmlFor="minFollowers" className="block text-sm font-medium text-gray-700">
                Min Followers
              </label>
              <input
                type="number"
                id="minFollowers"
                name="minFollowers"
                value={filters.minFollowers}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. 1000"
              />
            </div>
            
            <div>
              <label htmlFor="maxFollowers" className="block text-sm font-medium text-gray-700">
                Max Followers
              </label>
              <input
                type="number"
                id="maxFollowers"
                name="maxFollowers"
                value={filters.maxFollowers}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. 100000"
              />
            </div>
          </div>
        </div>
        
        {/* Influencer List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Influencers ({influencers.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Select influencers to invite to your campaign
              </p>
            </div>
            
            <button
              onClick={inviteInfluencers}
              disabled={selectedInfluencers.length === 0 || inviting}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {inviting 
                ? 'Sending Invites...' 
                : selectionMode === 'individual' 
                  ? `Invite Influencer${selectedInfluencers.length ? '' : ' (Select One)'}` 
                  : `Invite Selected (${selectedInfluencers.length})`
              }
            </button>
          </div>
          
          <div className="border-t border-gray-200">
            {influencers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No influencers found matching your criteria
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6">
                {influencers.map(influencer => (
                  <div key={influencer.id} className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`select-${influencer.id}`}
                          checked={selectedInfluencers.includes(influencer.id)}
                          onChange={() => toggleInfluencerSelection(influencer.id)}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-4"
                        />
                        
                        <div className="flex-shrink-0 h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                          {influencer.avatar_url ? (
                            <img 
                              src={influencer.avatar_url} 
                              alt={influencer.full_name || influencer.email || 'Influencer'} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <span className="text-2xl font-semibold text-gray-500">
                                {(influencer.full_name || influencer.email || 'User').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {influencer.full_name || influencer.email?.split('@')[0] || 'Anonymous Influencer'}
                          </h3>
                          <div className="flex items-center mt-1 flex-wrap">
                            {influencer.primary_platform && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2 mb-1">
                                {influencer.primary_platform}
                              </span>
                            )}
                            {influencer.followers > 0 && (
                              <span className="text-sm text-gray-500 mb-1">
                                {influencer.followers.toLocaleString()} followers
                              </span>
                            )}
                          </div>
                          {influencer.niche && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                              {influencer.niche}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {influencer.bio && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 line-clamp-3">{influencer.bio}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        {influencer.engagement_rate && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>{influencer.engagement_rate}% engagement</span>
                          </div>
                        )}
                        {influencer.avg_likes && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>~{influencer.avg_likes?.toLocaleString()} likes/post</span>
                          </div>
                        )}
                        {influencer.location && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{influencer.location}</span>
                          </div>
                        )}
                        {influencer.audience_demographics && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{influencer.audience_demographics}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="flex justify-between">
                        <Link
                          href={`/business/influencers/${influencer.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Profile
                        </Link>
                        <button
                          onClick={() => toggleInfluencerSelection(influencer.id)}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                            selectedInfluencers.includes(influencer.id)
                              ? 'text-red-700 bg-red-100 hover:bg-red-200'
                              : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                          }`}
                        >
                          {selectedInfluencers.includes(influencer.id) ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Deselect
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Select
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}