import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { firebaseAdmin } from '@/app/firebase/admin-config';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  console.log('🪙 Token balance API called');
  
  try {
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No valid auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('🎫 Token extracted, length:', token.length);

    // Verify Firebase token
    console.log('🔍 Verifying Firebase token...');
    const decodedToken = await getAuth(firebaseAdmin).verifyIdToken(token);
    console.log('✅ Token verified for user:', decodedToken.uid);

    // Get user's token balance from Users table
    console.log('🔍 Fetching user token balance from database...');
    const { data: user, error } = await supabaseAdmin
      .from('Users')
      .select('id, firebase_uid, token_balance')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    console.log('👤 User data retrieved:', {
      user,
      error
    });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tokenBalance = user.token_balance || 0;
    console.log('💰 Token balance found:', tokenBalance);

    return NextResponse.json({
      token_balance: tokenBalance,
      user_id: user.id,
      firebase_uid: user.firebase_uid
    });

  } catch (error) {
    console.error('❌ Error in token balance API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 