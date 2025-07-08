'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { getTokenBalance } from '@/app/utils/tokens';
import Link from 'next/link';
import { supabase } from '@/app/supabase/client';

export default function TokenBalance() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTokens = async () => {
      const balance = await getTokenBalance(user.id);
      setTokens(balance);
      setLoading(false);
    };

    fetchTokens();

    // Set up real-time subscription for token updates
    const subscription = supabase
      .channel('token_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'token_transactions',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refresh token balance when transactions occur
        fetchTokens();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center text-sm text-gray-600">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </div>
    );
  }

  return (
    <Link href="/store" className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
      <svg className="mr-1.5 h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {tokens} Tokens
    </Link>
  );
} 