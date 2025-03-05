'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/client';
import CampaignDisplay from '@/app/components/CampaignDisplay';

export default function CampaignCustomIdPage() {
  const { customId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (authLoading) return;
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/login');
        return;
      }

      try {
        // Fetch the campaign to check ownership
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('custom_id', customId)
          .maybeSingle();

        if (campaignError) {
          throw new Error(campaignError.message);
        }

        if (!campaign) {
          throw new Error('Campaign not found');
        }

        // Check if the current user is the creator of the campaign
        if (campaign.created_by !== user.id && campaign.business_id !== user.id) {
          // Not authorized - redirect to dashboard
          router.push('/business/dashboard');
          return;
        }

        // User is authorized
        setAuthorized(true);
      } catch (err: any) {
        console.error('Error checking authorization:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [customId, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold">Error</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/business/dashboard')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Don't render anything while redirecting
  }
  
  return <CampaignDisplay campaignId="" customId={customId as string} />;
} 