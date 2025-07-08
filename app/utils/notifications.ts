import { supabase } from '@/app/supabase/client';

interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
}

export async function createNotification(data: NotificationData) {
  const { error } = await supabase
    .from('notifications')
    .insert([data]);
  
  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }
  
  return true;
}

// Example usage:
// When a business invites an influencer to a campaign
export async function notifyInfluencerOfCampaignInvite(
  influencerId: string, 
  campaignId: string, 
  businessName: string, 
  campaignTitle: string
) {
  return createNotification({
    user_id: influencerId,
    title: 'New Campaign Invitation',
    message: `${businessName} has invited you to their campaign: ${campaignTitle}`,
    type: 'campaign_invite',
    related_id: campaignId
  });
}

// When a business contacts an influencer
export async function notifyInfluencerOfContact(
  influencerId: string,
  businessId: string,
  businessName: string
) {
  return createNotification({
    user_id: influencerId,
    title: 'New Business Contact',
    message: `${businessName} has contacted you and is interested in working with you.`,
    type: 'contact',
    related_id: businessId
  });
}

// When a payment is made
export async function notifyUserOfPayment(
  userId: string,
  amount: number,
  transactionId: string,
  isReceived: boolean
) {
  return createNotification({
    user_id: userId,
    title: isReceived ? 'Payment Received' : 'Payment Sent',
    message: isReceived 
      ? `You have received a payment of $${amount.toFixed(2)}.`
      : `Your payment of $${amount.toFixed(2)} has been processed.`,
    type: 'payment',
    related_id: transactionId
  });
} 