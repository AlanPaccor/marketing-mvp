import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { firebaseAdmin } from '@/app/firebase/admin-config';
import { supabaseAdmin } from '@/app/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decodedToken = await getAuth(firebaseAdmin).verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log(`Fetching transactions for user: ${userId}, limit: ${limit}, offset: ${offset}`);
    
    // Get user's transaction history
    const { data: transactions, error } = await supabaseAdmin
      .from('token_transactions')
      .select('*')
      .eq('firebase_uid', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
    
    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('token_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('firebase_uid', userId);
    
    if (countError) {
      console.error('Error fetching transaction count:', countError);
    }
    
    console.log(`Found ${transactions.length} transactions for user ${userId}`);
    
    return NextResponse.json({
      transactions: transactions || [],
      total: count || 0,
      limit,
      offset
    });
    
  } catch (error: any) {
    console.error('Error in transactions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 