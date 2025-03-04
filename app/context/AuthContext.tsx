'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { app } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabase/client';

interface UserData {
  id: string;
  email: string | null;
  userType: string | null;
  emailVerified: boolean;
  firebaseUser: User | null;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Try to get user type from Supabase
          let userType = null;
          
          try {
            // First try to get the user from Supabase
            const { data, error } = await supabase
              .from('Users')
              .select('userType')
              .eq('firebase_uid', firebaseUser.uid)
              .single();
            
            if (!error && data) {
              userType = data.userType;
            } else if (error && error.code === 'PGRST116') {
              // No user found in Supabase, try to get from Firebase
              userType = firebaseUser.displayName?.split(':')[0] || null;
              
              // If we have a userType from Firebase, store it in Supabase
              if (userType) {
                try {
                  const { error: insertError } = await supabase
                    .from('Users')
                    .insert([
                      { 
                        firebase_uid: firebaseUser.uid, 
                        email: firebaseUser.email, 
                        userType: userType,
                        created_at: new Date().toISOString()
                      }
                    ]);
                  
                  if (insertError) {
                    // If it's a duplicate key error, it means another process already inserted the user
                    // This is not a problem, we can just ignore it
                    if (insertError.code !== '23505') {
                      console.error('Error storing user data in Supabase:', insertError);
                    }
                  }
                } catch (insertErr) {
                  console.error('Exception storing user data in Supabase:', insertErr);
                }
              }
            }
          } catch (supabaseError) {
            console.error('Error fetching user data from Supabase:', supabaseError);
          }
          
          // If we still couldn't get the user type, try to get it from Firebase
          if (!userType) {
            userType = firebaseUser.displayName?.split(':')[0] || null;
            
            // If we still don't have a userType but the user is verified,
            // redirect to complete profile
            if (!userType && firebaseUser.emailVerified) {
              sessionStorage.setItem('googleAuthUser', JSON.stringify({
                uid: firebaseUser.uid,
                email: firebaseUser.email
              }));
              router.push('/auth/complete-profile');
              return;
            }
          }
          
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            userType: userType,
            emailVerified: firebaseUser.emailVerified,
            firebaseUser,
          });
          
          // If user is not on an auth page, check verification status
          const path = window.location.pathname;
          const isAuthPage = path.startsWith('/auth/');
          
          if (!isAuthPage) {
            // If email is not verified, redirect to verification page
            if (!firebaseUser.emailVerified) {
              router.push('/auth/verify-email');
              return;
            }
            
            // If no user type, redirect to complete profile
            if (!userType) {
              sessionStorage.setItem('googleAuthUser', JSON.stringify({
                uid: firebaseUser.uid,
                email: firebaseUser.email
              }));
              router.push('/auth/complete-profile');
              return;
            }
          }
        } catch (error) {
          console.error('Error processing user data:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            userType: null,
            emailVerified: firebaseUser.emailVerified,
            firebaseUser,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add proper error handling for Supabase queries
const fetchUserType = async (firebaseUid: string) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('userType')
      .eq('firebase_uid', firebaseUid)
      .single();
    
    if (error) {
      console.error('Error fetching user type:', error);
      return null;
    }
    
    return data?.userType;
  } catch (err) {
    console.error('Exception fetching user type:', err);
    return null;
  }
};

// Update the createUser function to handle conflicts
const createUser = async (firebaseUid: string, email: string, userType: string) => {
  try {
    // First check if the user already exists
    const { data: existingUser } = await supabase
      .from('Users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single();
    
    if (existingUser) {
      console.log('User already exists in Supabase');
      return existingUser;
    }
    
    // If not, create the user
    const { data, error } = await supabase
      .from('Users')
      .insert([
        { 
          firebase_uid: firebaseUid,
          email: email,
          userType: userType
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user in Supabase:', error);
      // If it's a conflict error, try to fetch the user again
      if (error.code === '23505') { // Unique violation
        const { data: existingUser } = await supabase
          .from('Users')
          .select('*')
          .eq('firebase_uid', firebaseUid)
          .single();
        
        return existingUser;
      }
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Exception creating user:', err);
    throw err;
  }
}; 