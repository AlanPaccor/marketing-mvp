import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { customAlphabet } from 'nanoid';

export async function POST(request: Request) {
  try {
    // Log environment variables (without revealing full keys)
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Create a Supabase client with service role key from environment variables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Get the campaign data from the request
    const campaignData = await request.json();
    const { userId, ...restData } = campaignData;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log('Creating campaign for user:', userId);
    
    // Generate a more readable custom ID for the campaign
    // Using only lowercase letters and numbers, avoiding confusing characters like 1, l, 0, O
    const nanoid = customAlphabet('23456789abcdefghijkmnpqrstuvwxyz', 8);
    const customId = nanoid();
    console.log('Generated custom ID:', customId);
    
    // Test Supabase connection with a simple query first
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Supabase connection test error:', testError);
      return NextResponse.json({ error: testError.message }, { status: 500 });
    }
    
    console.log('Supabase connection test successful');
    
    // Insert the campaign data using the service role client
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...restData,
        business_id: userId,
        custom_id: customId
      })
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.log('Campaign created with data:', data);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Campaign creation error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 