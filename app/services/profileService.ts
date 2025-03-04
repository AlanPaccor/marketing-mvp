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

export const updateUserProfile = async (table: string, data: any) => {
  try {
    // Make sure we have a user
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { error: { message: 'User not authenticated' } };
    }
    
    // Check if the profile_image_url field exists in the table
    const { data: tableInfo, error: schemaError } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('Error checking table schema:', schemaError);
      return { error: schemaError };
    }
    
    // Create a copy of the data object
    const updateData = { ...data };
    
    // If the table doesn't have profile_image_url column, remove it from the update data
    if (tableInfo && tableInfo.length > 0) {
      const sampleRow = tableInfo[0];
      if (!('profile_image_url' in sampleRow) && 'profile_image_url' in updateData) {
        console.warn(`The ${table} table doesn't have a profile_image_url column. Skipping this field.`);
        delete updateData.profile_image_url;
      }
    }
    
    // Update the profile
    const { data: updatedData, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('user_id', currentUser.uid)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating ${table}:`, error);
      return { error };
    }
    
    return { data: updatedData };
  } catch (err) {
    console.error(`Exception updating ${table}:`, err);
    return { error: { message: err.message } };
  }
};

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