'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { supabase } from '@/app/supabase/client';

interface Campaign {
  id: number;
  business_id: string;
  title: string;
  description: string;
  objectives: string[];
  budget: number;
  start_date: string;
  end_date: string;
  target_audience: {
    ageRange: string;
    gender: string[];
    interests: string[];
    location: string;
  };
  requirements: string;
  content_guidelines: string;
  platform_preferences: string[];
  status: string;
  created_at: string;
  custom_id?: string;
}

interface CampaignDisplayProps {
  campaignId: string | number;
  customId?: string;
}

export default function CampaignDisplay({ campaignId, customId }: CampaignDisplayProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      // Temporarily bypass the user check for testing
      // if (!user) return;
      
      try {
        let query;
        
        // If we have a customId, use that for the query
        if (customId) {
          console.log('Fetching campaign with custom ID:', customId);
          console.log('Custom ID type:', typeof customId);
          console.log('Custom ID length:', customId.length);
          console.log('Custom ID character codes:', Array.from(customId).map(c => c.charCodeAt(0)));
          
          // Log all campaigns first to see what's in the database
          console.log('Fetching all campaigns to debug...');
          const { data: allCampaigns } = await supabase
            .from('campaigns')
            .select('id, title, custom_id');
          
          console.log('All campaigns:', allCampaigns);
          console.log('Custom IDs in database:', allCampaigns?.map(c => c.custom_id));
          
          // Now try the specific query
          query = supabase
            .from('campaigns')
            .select('*')
            .eq('custom_id', customId)
            .limit(1);
          
          console.log('Query for custom ID:', customId);
          console.log('SQL equivalent:', 
            `SELECT * FROM campaigns WHERE custom_id = '${customId}' LIMIT 1`
          );
        } else {
          // Check if campaignId is a numeric ID or possibly a custom ID
          const isNumeric = /^\d+$/.test(String(campaignId));
          
          if (isNumeric) {
            // It's a numeric ID
            const numericId = typeof campaignId === 'string' ? parseInt(campaignId, 10) : campaignId;
            console.log('Fetching campaign with numeric ID:', numericId);
            query = supabase
              .from('campaigns')
              .select('*')
              .eq('id', numericId)
              .limit(1);
          } else {
            // It might be a custom ID passed through the campaignId prop
            console.log('Fetching campaign with possible custom ID:', campaignId);
            query = supabase
              .from('campaigns')
              .select('*')
              .eq('custom_id', campaignId)
              .limit(1);
          }
        }
        
        const { data, error } = await query.maybeSingle();
        console.log('Query result:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(error.message);
        }

        if (!data) {
          console.log('Campaign not found with ID:', customId || campaignId);
          console.log('No campaigns found in database. Please create a campaign first.');
          throw new Error(`Campaign not found. Please check the URL and try again.`);
        }

        // Make the authorization check optional during development
        // if (data.business_id !== user.id) {
        //   console.warn('Authorization mismatch:', { 
        //     campaignBusinessId: data.business_id, 
        //     currentUserId: user.id 
        //   });
        //   // Comment this out temporarily for testing
        //   // throw new Error('You are not authorized to view this campaign');
        // }

        console.log('Campaign data loaded:', data);
        setCampaign(data as Campaign);
      } catch (err: any) {
        console.error('Error fetching campaign:', err);
        setError(err.message || 'Failed to load campaign');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId, customId]);

  // Redirect if not logged in
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/auth/login');
  //   }
  // }, [user, loading, router]);

  const searchInfluencers = () => {
    // Navigate to the influencer search page with the campaign ID as a parameter
    if (campaign) {
      router.push(`/business/influencers/search?campaignId=${campaign.id}`);
    }
  };

  const handleEditClick = () => {
    if (customId) {
      router.push(`/business/campaigns/c/${customId}/edit`);
    } else if (campaignId) {
      router.push(`/business/campaigns/${campaignId}/edit`);
    }
  };

  if (loading || isLoading) {
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
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-sm text-red-700 mt-2">
                  The campaign you're looking for might have been deleted or you may not have permission to view it.
                </p>
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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">Campaign not found</p>
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
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <button
              onClick={searchInfluencers}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search for Influencers
            </button>
            <div className="flex space-x-3">
              <Link
                href="/business/campaigns"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Campaigns
              </Link>
              <button
                onClick={handleEditClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Campaign
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Campaign Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Campaign ID: {campaign.custom_id || campaign.id}</p>
            </div>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              campaign.status === 'active' ? 'bg-green-100 text-green-800' : 
              campaign.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </span>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{campaign.description}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Budget</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">${campaign.budget}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'Not set'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Not set'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Objectives</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {campaign.objectives.map((objective, index) => (
                      <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        {objective}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Target Audience</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Age Range:</p>
                      <p>{campaign.target_audience.ageRange}</p>
                    </div>
                    <div>
                      <p className="font-medium">Gender:</p>
                      <p>{campaign.target_audience.gender.join(', ')}</p>
                    </div>
                    <div>
                      <p className="font-medium">Location:</p>
                      <p>{campaign.target_audience.location}</p>
                    </div>
                    <div>
                      <p className="font-medium">Interests:</p>
                      <p>{campaign.target_audience.interests.join(', ')}</p>
                    </div>
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Requirements</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{campaign.requirements}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Content Guidelines</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{campaign.content_guidelines}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Platform Preferences</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {campaign.platform_preferences.map((platform, index) => (
                      <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        {platform}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {campaign.created_at ? new Date(campaign.created_at).toLocaleString() : 'Unknown'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
} 