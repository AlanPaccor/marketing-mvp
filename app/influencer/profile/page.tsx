'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

interface ProfileData {
  id?: string;
  user_id?: string;
  full_name: string;
  platform: string;
  followers: number;
  niche: string;
  bio: string;
  profile_image_url: string;
  location: string;
  engagement_rate: number;
  avg_likes: number;
  audience_demographics: string;
  verified_platforms: string[];
  youtube_connected: boolean;
  youtube_data?: any;
  instagram_connected: boolean;
  instagram_data?: any;
  tiktok_connected: boolean;
  tiktok_data?: any;
  twitter_connected: boolean;
  twitter_data?: any;
  twitch_connected: boolean;
  twitch_data?: any;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Platform options
  const platformOptions = [
    'Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'Pinterest', 'Twitch'
  ];

  // Niche options
  const nicheOptions = [
    'Technology', 'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 
    'Gaming', 'Music', 'Art', 'Sports', 'Lifestyle', 'Business',
    'Education', 'Entertainment', 'Health', 'Parenting', 'Pets', 'Photography'
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('influencer_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          setError(error.message);
        } else {
          if (data) {
            setProfile(data);
          } else {
            // Initialize with empty profile
            setProfile({
              full_name: '',
              platform: '',
              followers: 0,
              niche: '',
              bio: '',
              profile_image_url: '',
              location: '',
              engagement_rate: 0,
              avg_likes: 0,
              audience_demographics: '',
              verified_platforms: [],
              youtube_connected: false,
              instagram_connected: false,
              tiktok_connected: false,
              twitter_connected: false,
              twitch_connected: false
            });
            // Start in editing mode for new profiles
            setIsEditing(true);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchProfile();
    }
  }, [user, loading]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value);
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: numValue
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Upload image if changed
      let imageUrl = profile.profile_image_url;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('influencer-assets')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError.message}`);
        }
        
        const { data: urlData } = supabase.storage
          .from('influencer-assets')
          .getPublicUrl(filePath);
          
        imageUrl = urlData.publicUrl;
      }
      
      // Save profile data
      const profileData = {
        ...profile,
        user_id: user.id,
        profile_image_url: imageUrl,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (profile.id) {
        // Update existing profile
        result = await supabase
          .from('influencer_profiles')
          .update(profileData)
          .eq('id', profile.id)
          .select();
      } else {
        // Insert new profile
        result = await supabase
          .from('influencer_profiles')
          .insert({
            ...profileData,
            created_at: new Date().toISOString()
          })
          .select();
      }
      
      if (result.error) {
        throw new Error(result.error.message || 'Error saving profile');
      }
      
      // Update the profile state with the new data
      setProfile(result.data[0]);
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
      
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/influencer/dashboard"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isEditing 
                  ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Influencer Profile</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Your public profile information that will be visible to brands.
              </p>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Profile Image */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                <div className="mt-2 flex items-center">
                  <div className="relative h-40 w-40 rounded-full overflow-hidden bg-gray-100">
                    {(profile?.profile_image_url || imagePreview) ? (
                      <Image
                        src={imagePreview || profile?.profile_image_url || ''}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>
                  {isEditing && (
                    <div className="ml-5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Change Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div className="sm:col-span-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={profile?.full_name || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile?.full_name || 'Not specified'}</p>
                )}
              </div>

              {/* Location */}
              <div className="sm:col-span-3">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={profile?.location || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="City, State/Country"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile?.location || 'Not specified'}</p>
                )}
              </div>

              {/* Primary Platform */}
              <div className="sm:col-span-3">
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700">
                  Primary Platform
                </label>
                {isEditing ? (
                  <select
                    id="platform"
                    name="platform"
                    value={profile?.platform || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a platform</option>
                    {platformOptions.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile?.platform || 'Not specified'}</p>
                )}
              </div>

              {/* Followers */}
              <div className="sm:col-span-3">
                <label htmlFor="followers" className="block text-sm font-medium text-gray-700">
                  Followers
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="followers"
                    id="followers"
                    value={profile?.followers || ''}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="0"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.followers ? profile.followers.toLocaleString() : 'Not specified'}
                  </p>
                )}
              </div>

              {/* Niche */}
              <div className="sm:col-span-3">
                <label htmlFor="niche" className="block text-sm font-medium text-gray-700">
                  Niche/Category
                </label>
                {isEditing ? (
                  <select
                    id="niche"
                    name="niche"
                    value={profile?.niche || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a niche</option>
                    {nicheOptions.map(niche => (
                      <option key={niche} value={niche}>{niche}</option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile?.niche || 'Not specified'}</p>
                )}
              </div>

              {/* Engagement Rate */}
              <div className="sm:col-span-3">
                <label htmlFor="engagement_rate" className="block text-sm font-medium text-gray-700">
                  Engagement Rate (%)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="engagement_rate"
                    id="engagement_rate"
                    value={profile?.engagement_rate || ''}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.engagement_rate ? `${profile.engagement_rate}%` : 'Not specified'}
                  </p>
                )}
              </div>

              {/* Average Likes */}
              <div className="sm:col-span-3">
                <label htmlFor="avg_likes" className="block text-sm font-medium text-gray-700">
                  Average Likes per Post
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="avg_likes"
                    id="avg_likes"
                    value={profile?.avg_likes || ''}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="0"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.avg_likes ? profile.avg_likes.toLocaleString() : 'Not specified'}
                  </p>
                )}
              </div>

              {/* Audience Demographics */}
              <div className="sm:col-span-6">
                <label htmlFor="audience_demographics" className="block text-sm font-medium text-gray-700">
                  Audience Demographics
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="audience_demographics"
                    id="audience_demographics"
                    value={profile?.audience_demographics || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g. Mixed 16-34 (75%)"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile?.audience_demographics || 'Not specified'}</p>
                )}
              </div>

              {/* Bio */}
              <div className="sm:col-span-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={profile?.bio || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Tell brands about yourself..."
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{profile?.bio || 'No bio provided'}</p>
                )}
              </div>

              {/* Platform Connections Section */}
              <div className="sm:col-span-6 border-t border-gray-200 pt-5">
                <h3 className="text-lg font-medium text-gray-900">Platform Connections</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Connect your social media accounts to verify your following and engagement metrics.
                </p>
                
                <div className="mt-4 space-y-4">
                  {['Instagram', 'YouTube', 'TikTok', 'Twitter', 'Twitch'].map(platform => {
                    const platformKey = platform.toLowerCase() as 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'twitch';
                    const isConnected = profile?.[`${platformKey}_connected`];
                    
                    return (
                      <div key={platform} className="flex items-center justify-between py-3 border-b border-gray-200">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isConnected ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {/* Platform icon would go here */}
                            <span className={isConnected ? 'text-green-600' : 'text-gray-400'}>
                              {platform.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{platform}</p>
                            <p className="text-xs text-gray-500">
                              {isConnected ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            type="button"
                            className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md ${
                              isConnected 
                                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                                : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            {isConnected ? 'Disconnect' : 'Connect'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 