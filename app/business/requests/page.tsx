'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface CollaborationRequest {
  id: number;
  influencer_name: string;
  influencer_image: string;
  campaign_title: string;
  platform: string;
  followers: number;
  engagement_rate: number;
  requested_date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function PendingRequests() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);

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
      
      // Fetch requests data (mock data for now)
      fetchRequests();
    }
  }, [user, loading, router]);

  const fetchRequests = async () => {
    // Simulate API call
    setTimeout(() => {
      const mockRequests: CollaborationRequest[] = [
        {
          id: 1,
          influencer_name: 'Alex Johnson',
          influencer_image: '/placeholder-profile.png',
          campaign_title: 'Summer Product Launch',
          platform: 'Instagram',
          followers: 45000,
          engagement_rate: 3.2,
          requested_date: '2023-07-15',
          status: 'pending'
        },
        {
          id: 2,
          influencer_name: 'Sarah Williams',
          influencer_image: '/placeholder-profile.png',
          campaign_title: 'Summer Product Launch',
          platform: 'TikTok',
          followers: 120000,
          engagement_rate: 4.5,
          requested_date: '2023-07-14',
          status: 'pending'
        },
        {
          id: 3,
          influencer_name: 'Michael Chen',
          influencer_image: '/placeholder-profile.png',
          campaign_title: 'Brand Awareness',
          platform: 'YouTube',
          followers: 85000,
          engagement_rate: 2.8,
          requested_date: '2023-07-12',
          status: 'pending'
        },
        {
          id: 4,
          influencer_name: 'Jessica Lee',
          influencer_image: '/placeholder-profile.png',
          campaign_title: 'Holiday Promotion',
          platform: 'Instagram',
          followers: 65000,
          engagement_rate: 3.7,
          requested_date: '2023-07-10',
          status: 'pending'
        },
        {
          id: 5,
          influencer_name: 'David Smith',
          influencer_image: '/placeholder-profile.png',
          campaign_title: 'Brand Awareness',
          platform: 'TikTok',
          followers: 95000,
          engagement_rate: 5.1,
          requested_date: '2023-07-08',
          status: 'pending'
        }
      ];
      
      setRequests(mockRequests);
      setIsLoading(false);
    }, 800);
  };

  const handleApprove = (id: number) => {
    setRequests(requests.map(request => 
      request.id === id ? { ...request, status: 'approved' } : request
    ));
  };

  const handleReject = (id: number) => {
    setRequests(requests.map(request => 
      request.id === id ? { ...request, status: 'rejected' } : request
    ));
  };

  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Influencers
                </Link>
                <Link 
                  href="/business/requests" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Requests
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Pending Requests
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage collaboration requests from influencers
            </p>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {requests.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {requests.map((request) => (
                <li key={request.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden">
                          <Image
                            src={request.influencer_image}
                            alt={request.influencer_name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-indigo-600">
                            {request.influencer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.platform} • {formatNumber(request.followers)} followers • {request.engagement_rate}% engagement
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {request.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Reject
                            </button>
                          </>
                        ) : request.status === 'approved' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">Campaign:</span> {request.campaign_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Requested:</span> {formatDate(request.requested_date)}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Link
                        href={`/business/influencers/${request.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any pending collaboration requests at the moment.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 