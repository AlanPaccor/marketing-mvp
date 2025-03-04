'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchUserProfile, updateUserProfile, createUserProfile } from '@/app/services/profileService';
import { uploadProfileImage, getProfileImageURL } from '@/app/firebase/storage';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import SocialMediaConnect from '@/app/components/SocialMediaConnect';

// Update the interface to include profile_image_url
interface InfluencerProfile {
  id: string;
  user_id: string;
  full_name: string;
  platform: string;
  followers: number;
  niche: string;
  bio: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
  verified_platforms?: string[];
  youtube_connected?: boolean;
  instagram_connected?: boolean;
  tiktok_connected?: boolean;
  twitter_connected?: boolean;
  twitch_connected?: boolean;
}

export default function InfluencerProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    platform: '',
    followers: '',
    niche: '',
    bio: '',
    profile_image_url: '',
  });
  
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        // If no user is authenticated, don't try to fetch the profile
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data, error } = await fetchUserProfile('influencer_profiles');
      
      if (error) {
        setError(error.message);
      } else {
        setProfile(data);
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            platform: data.platform || '',
            followers: data.followers?.toString() || '',
            niche: data.niche || '',
            bio: data.bio || '',
            profile_image_url: data.profile_image_url || '',
          });
          
          // Set profile image
          if (data.profile_image_url) {
            setProfileImage(data.profile_image_url);
          } else if (data.user_id) {
            try {
              const imageUrl = await getProfileImageURL(data.user_id);
              if (imageUrl) {
                setProfileImage(imageUrl);
              }
            } catch (err) {
              console.error('Error loading profile image:', err);
            }
          }
        }
      }
      setLoading(false);
    }
    
    loadProfile();
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Convert followers to number
      const profileData = {
        ...formData,
        followers: parseInt(formData.followers) || 0
      };
      
      let result;
      
      if (profile) {
        // Update existing profile
        result = await updateUserProfile('influencer_profiles', profileData);
      } else {
        // Create new profile
        result = await createUserProfile('influencer_profiles', profileData);
      }
      
      if (result.error) {
        throw new Error(result.error.message || 'Error saving profile');
      }
      
      // Update the profile state with the new data
      setProfile(result.data);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'An error occurred while saving your profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          // This is just a preview, not the actual uploaded image URL
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageUpload = async () => {
    // Clear any previous errors
    setError(null);
    
    if (!imageFile) {
      setError('Please select an image to upload');
      return;
    }
    
    if (!user || !user.id) {
      setError('You must be logged in to upload an image');
      console.error('User not authenticated or missing ID:', user);
      return;
    }
    
    try {
      setImageLoading(true);
      console.log('Uploading image for user:', user.id);
      const downloadURL = await uploadProfileImage(user.id, imageFile);
      
      // Update the profile with the image URL
      await updateUserProfile('influencer_profiles', {
        profile_image_url: downloadURL
      });
      
      // Update the local state
      setProfileImage(downloadURL);
      setFormData(prev => ({
        ...prev,
        profile_image_url: downloadURL
      }));
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setImageFile(null);
      
      // Show success message
      alert('Profile image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };
  
  const handleSocialConnectSuccess = (platform: string, data: any) => {
    // Update the profile state with the new data
    setProfile(prev => {
      if (!prev) return null;
      
      const verifiedPlatforms = prev.verified_platforms || [];
      if (!verifiedPlatforms.includes(platform)) {
        verifiedPlatforms.push(platform);
      }
      
      return {
        ...prev,
        [`${platform}_connected`]: true,
        [`${platform}_data`]: data,
        followers: data.followers > (prev.followers || 0) ? data.followers : prev.followers,
        verified_platforms: verifiedPlatforms
      };
    });
    
    // Show a success message
    alert(`Successfully connected ${platform}!`);
  };
  
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Required</h2>
        <p className="mb-4">You need to be logged in to view this page.</p>
        <Link href="/auth/login" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Go to Login
        </Link>
      </div>
    );
  }
  
  if (error && !profile && !isEditing) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Profile</h2>
        <p className="mb-4">{error}</p>
        <button 
          onClick={() => setIsEditing(true)} 
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Create Profile
        </button>
      </div>
    );
  }
  
  // If no profile exists yet, show the create form
  if (!profile && !error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Influencer Profile</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
              <div className="flex items-center">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 mr-4">
                  {profileImage ? (
                    <Image 
                      src={profileImage} 
                      alt="Profile" 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {imageFile && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={imageLoading}
                      className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {imageLoading ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">Primary Platform</label>
                <input
                  type="text"
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  placeholder="Instagram, TikTok, YouTube, etc."
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">Content Niche</label>
                <input
                  type="text"
                  id="niche"
                  name="niche"
                  value={formData.niche}
                  onChange={handleInputChange}
                  placeholder="Fashion, Beauty, Tech, etc."
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleInputChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Saving...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/influencer/dashboard" 
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        
        {!isEditing && profile ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-12 relative">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                  {profileImage ? (
                    <Image 
                      src={profileImage} 
                      alt={profile.full_name} 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                      <svg className="h-16 w-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-20 px-6 pb-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                <div className="flex items-center justify-center mt-1 space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {profile.platform}
                  </span>
                  {profile.verified_platforms && profile.verified_platforms.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">{profile.followers?.toLocaleString() || 0} followers</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{profile.niche}</p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Bio</h2>
                <p className="text-gray-700 whitespace-pre-line">{profile.bio || 'No bio provided.'}</p>
              </div>
              
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            </div>
            
            <div className="mt-8">
              <SocialMediaConnect 
                onSuccess={handleSocialConnectSuccess}
                connectedAccounts={{
                  youtube: profile.youtube_connected,
                  instagram: profile.instagram_connected,
                  tiktok: profile.tiktok_connected,
                  twitter: profile.twitter_connected,
                  twitch: profile.twitch_connected
                }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Your Profile</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                <div className="flex items-center">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 mr-4">
                    {profileImage ? (
                      <Image 
                        src={profileImage} 
                        alt="Profile" 
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="h-12 w-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {imageFile && (
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={imageLoading}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {imageLoading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">Primary Platform</label>
                  <input
                    type="text"
                    id="platform"
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    placeholder="Instagram, TikTok, YouTube, etc."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">Content Niche</label>
                  <input
                    type="text"
                    id="niche"
                    name="niche"
                    value={formData.niche}
                    onChange={handleInputChange}
                    placeholder="Fashion, Beauty, Tech, etc."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <svg className="inline-block h-4 w-4 mr-1 -mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Follower counts are automatically updated when you connect your social media accounts.
                </p>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 