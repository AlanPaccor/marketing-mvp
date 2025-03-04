import { supabase } from '@/app/supabase/client';
import { getAuth } from 'firebase/auth';
import { app } from '@/app/firebase/config';

// Helper function to get the current Firebase user
async function getCurrentFirebaseUser() {
  const auth = getAuth(app);
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    throw new Error('Not authenticated with Firebase');
  }
  
  return firebaseUser;
}

export async function fetchUserProfile(tableName: string) {
  try {
    const firebaseUser = await getCurrentFirebaseUser();
    
    // Query Supabase using the Firebase UID
    const { data, error: profileError } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', firebaseUser.uid)
      .single();
      
    if (profileError) {
      // If the profile doesn't exist yet or table doesn't exist, return null without an error
      if (profileError.code === 'PGRST116' || profileError.code === '42P01') {
        console.log(`Table ${tableName} might not exist or no profile found`);
        return { data: null, error: null };
      }
      throw profileError;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching profile from ${tableName}:`, error);
    return { data: null, error };
  }
}

export async function updateUserProfile(tableName: string, updatedData: any) {
  try {
    const firebaseUser = await getCurrentFirebaseUser();
    
    // Update the profile in the specified table
    const { data, error } = await supabase
      .from(tableName)
      .update(updatedData)
      .eq('user_id', firebaseUser.uid)
      .select()
      .single();
      
    if (error) {
      // Handle RLS errors
      if (error.code === '42501') {
        console.error(`RLS policy error when updating ${tableName}. Check your Supabase policies.`);
      }
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error updating profile in ${tableName}:`, error);
    return { data: null, error };
  }
}

export async function createUserProfile(tableName: string, profileData: any) {
  try {
    const firebaseUser = await getCurrentFirebaseUser();
    
    // First check if a profile already exists
    const { data: existingProfile } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', firebaseUser.uid)
      .single();
      
    if (existingProfile) {
      // Profile already exists, update it instead
      return updateUserProfile(tableName, profileData);
    }
    
    // Create a new profile in the specified table
    const { data, error } = await supabase
      .from(tableName)
      .insert([{ ...profileData, user_id: firebaseUser.uid }])
      .select()
      .single();
      
    if (error) {
      // Handle RLS errors
      if (error.code === '42501') {
        console.error(`RLS policy error when creating ${tableName}. Check your Supabase policies.`);
      }
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error creating profile in ${tableName}:`, error);
    return { data: null, error };
  }
} 