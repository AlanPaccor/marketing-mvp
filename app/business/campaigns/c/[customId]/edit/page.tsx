'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/client';
import Link from 'next/link';

// Import the EditCampaignForm component (we'll create this next)
import EditCampaignForm from '@/app/components/EditCampaignForm';

export default function EditCampaignByCustomIdPage() {
  const { customId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!customId || authLoading) return;
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/login');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('custom_id', customId)
          .maybeSingle();
          
        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error('Campaign not found');
        }

        // Check if the current user is the creator of the campaign
        if (data.created_by !== user.id && data.business_id !== user.id) {
          // Not authorized - redirect to dashboard
          router.push('/business/dashboard');
          return;
        }

        // User is authorized
        setAuthorized(true);
        setCampaign(data);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [customId, user, authLoading, router]);

  if (authLoading || loading) {
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

  if (!authorized || !campaign) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <EditCampaignForm 
            campaign={campaign} 
            customId={customId as string} 
          />
        </div>
      </main>
    </div>
  );
} 