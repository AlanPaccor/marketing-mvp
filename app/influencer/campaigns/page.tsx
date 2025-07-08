'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

interface Campaign {
  id: number;
  brand: string;
  title: string;
  status: string;
  compensation: string;
  deadline: string;
  requirements: string;
}

export default function InfluencerCampaigns() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      if (user.userType !== 'influencer') {
        router.push('/business/dashboard');
        return;
      }
      
      loadCampaigns();
    }
  }, [user, loading, router]);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      
      // This would be replaced with an actual API call
      // For now, using sample data
      setCampaigns([
        {
          id: 1,
          brand: 'FitLife Supplements',
          title: 'Summer Fitness Challenge',
          status: 'active',
          compensation: '$750',
          deadline: '2023-08-15',
          requirements: 'Post 3 Instagram photos with product'
        },
        {
          id: 2,
          brand: 'EcoStyle Clothing',
          title: 'Sustainable Fashion Line',
          status: 'pending',
          compensation: '$500',
          deadline: '2023-09-01',
          requirements: 'Create 1 TikTok video showcasing outfit'
        },
        {
          id: 3,
          brand: 'TechGadget Pro',
          title: 'New Smartwatch Launch',
          status: 'completed',
          compensation: '$1,200',
          deadline: '2023-07-10',
          requirements: 'YouTube review video + 2 Instagram stories'
        }
      ]);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/influencer/dashboard" className="text-xl font-bold text-indigo-600">
                InfluencerHub
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Your Campaigns
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/influencer/opportunities"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Find New Opportunities
            </Link>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <Link href={`/influencer/campaigns/${campaign.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">{campaign.title}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="text-sm text-gray-500">{campaign.compensation}</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {campaign.brand}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Deadline: {campaign.deadline}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-4 py-5 sm:px-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">No campaigns found.</p>
                </div>
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
} 