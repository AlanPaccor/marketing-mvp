'use client';

import { useParams } from 'next/navigation';
import CampaignDisplay from '@/app/components/CampaignDisplay';

export default function CampaignCustomIdPage() {
  const { customId } = useParams();
  
  return <CampaignDisplay campaignId="" customId={customId as string} />;
} 