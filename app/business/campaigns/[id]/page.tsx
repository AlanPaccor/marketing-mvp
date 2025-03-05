'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CampaignDisplay from '@/app/components/CampaignDisplay';

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // Check if id is numeric or a custom ID
  const isNumeric = /^\d+$/.test(String(id));
  
  // If it's a custom ID, redirect to the proper URL structure
  useEffect(() => {
    if (!isNumeric) {
      router.replace(`/business/campaigns/c/${id}`);
    }
  }, [id, isNumeric, router]);
  
  if (isNumeric) {
    return <CampaignDisplay campaignId={id.toString()} />;
  } else {
    // This will briefly show while redirecting
    return <div>Redirecting...</div>;
  }
} 