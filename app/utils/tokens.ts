import { supabase } from '@/app/supabase/client';
import { createNotification } from './notifications';

// Add tokens to a user's account
export async function addTokens(userId: string, amount: number, reason: string = 'purchase') {
  try {
    // Record the transaction
    const { error } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: reason,
        description: `Added ${amount} tokens via ${reason}`
      });
      
    if (error) throw error;
    
    // Notify the user
    await createNotification({
      user_id: userId,
      title: 'Tokens Added',
      message: `${amount} tokens have been added to your account.`,
      type: 'token_update'
    });
    
    return true;
  } catch (err) {
    console.error('Error adding tokens:', err);
    return false;
  }
}

// Spend tokens from a user's account
export async function spendTokens(
  userId: string, 
  amount: number, 
  description: string,
  entityType?: string,
  entityId?: string
) {
  try {
    // First check if user has enough tokens
    const { data: userData, error: userError } = await supabase
      .from('business_profiles')
      .select('tokens')
      .eq('user_id', userId)
      .single();
      
    if (userError) throw userError;
    
    if (!userData || userData.tokens < amount) {
      throw new Error('Insufficient tokens');
    }
    
    // Record the transaction (negative amount for spending)
    const { error } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        transaction_type: 'spend',
        description: description,
        related_entity_type: entityType,
        related_entity_id: entityId
      });
      
    if (error) throw error;
    
    // Notify the user
    await createNotification({
      user_id: userId,
      title: 'Tokens Spent',
      message: `${amount} tokens have been spent: ${description}`,
      type: 'token_update'
    });
    
    return true;
  } catch (err) {
    console.error('Error spending tokens:', err);
    return false;
  }
}

// Get user's token balance
export async function getTokenBalance(userId: string) {
  try {
    // Try business profile first
    let { data, error } = await supabase
      .from('business_profiles')
      .select('tokens')
      .eq('user_id', userId)
      .single();
      
    if (error || !data) {
      // If not found, try influencer profile
      const result = await supabase
        .from('influencer_profiles')
        .select('tokens')
        .eq('user_id', userId)
        .single();
        
      if (result.error) throw result.error;
      data = result.data;
    }
    
    return data?.tokens || 0;
  } catch (err) {
    console.error('Error getting token balance:', err);
    return 0;
  }
}

// Get token transaction history
export async function getTokenHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('Error getting token history:', err);
    return [];
  }
} 