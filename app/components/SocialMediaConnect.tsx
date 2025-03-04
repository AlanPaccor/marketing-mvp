'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { updateUserProfile } from '@/app/services/profileService';
import Image from 'next/image';

interface SocialMediaConnectProps {
  onSuccess: (platform: string, data: any) => void;
  connectedAccounts: {
    youtube?: boolean;
    instagram?: boolean;
    tiktok?: boolean;
    twitter?: boolean;
    twitch?: boolean;
  };
}

export default function SocialMediaConnect({ onSuccess, connectedAccounts }: SocialMediaConnectProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  
  const connectYouTube = async () => {
    setLoading('youtube');
    try {
      // In a real implementation, you would:
      // 1. Redirect to Google OAuth
      // 2. Handle the callback with a code
      // 3. Exchange the code for tokens
      // 4. Use the tokens to fetch the user's YouTube data
      
      // For demo purposes, we'll simulate a successful connection
      const mockYouTubeData = {
        channel_id: 'UC_demo_youtube_123',
        channel_name: 'Demo YouTube Channel',
        subscribers: 25000,
        verified: true
      };
      
      // Update the user's profile with the YouTube data
      if (user) {
        await updateUserProfile('influencer_profiles', {
          youtube_connected: true,
          youtube_data: mockYouTubeData,
          followers: mockYouTubeData.subscribers, // Update follower count with YouTube subscribers
          verified_platforms: ['youtube']
        });
        
        onSuccess('youtube', mockYouTubeData);
      }
    } catch (error) {
      console.error('Error connecting YouTube:', error);
    } finally {
      setLoading(null);
    }
  };
  
  const connectInstagram = async () => {
    setLoading('instagram');
    try {
      // Similar to YouTube, but with Instagram API
      const mockInstagramData = {
        instagram_id: 'demo_instagram_123',
        username: 'demo_influencer',
        followers: 45000,
        verified: true
      };
      
      if (user) {
        await updateUserProfile('influencer_profiles', {
          instagram_connected: true,
          instagram_data: mockInstagramData,
          followers: mockInstagramData.followers,
          verified_platforms: ['instagram']
        });
        
        onSuccess('instagram', mockInstagramData);
      }
    } catch (error) {
      console.error('Error connecting Instagram:', error);
    } finally {
      setLoading(null);
    }
  };
  
  const connectTikTok = async () => {
    setLoading('tiktok');
    try {
      // TikTok OAuth implementation
      const mockTikTokData = {
        tiktok_id: 'demo_tiktok_123',
        username: '@demo_tiktok',
        followers: 75000,
        verified: true
      };
      
      if (user) {
        await updateUserProfile('influencer_profiles', {
          tiktok_connected: true,
          tiktok_data: mockTikTokData,
          followers: mockTikTokData.followers,
          verified_platforms: ['tiktok']
        });
        
        onSuccess('tiktok', mockTikTokData);
      }
    } catch (error) {
      console.error('Error connecting TikTok:', error);
    } finally {
      setLoading(null);
    }
  };
  
  const connectTwitter = async () => {
    setLoading('twitter');
    try {
      // Twitter/X OAuth implementation
      const mockTwitterData = {
        twitter_id: 'demo_twitter_123',
        username: '@demo_twitter',
        followers: 15000,
        verified: true
      };
      
      if (user) {
        await updateUserProfile('influencer_profiles', {
          twitter_connected: true,
          twitter_data: mockTwitterData,
          followers: mockTwitterData.followers,
          verified_platforms: ['twitter']
        });
        
        onSuccess('twitter', mockTwitterData);
      }
    } catch (error) {
      console.error('Error connecting Twitter:', error);
    } finally {
      setLoading(null);
    }
  };
  
  const connectTwitch = async () => {
    setLoading('twitch');
    try {
      // Twitch OAuth implementation
      const mockTwitchData = {
        twitch_id: 'demo_twitch_123',
        username: 'demo_twitch',
        followers: 8000,
        verified: true
      };
      
      if (user) {
        await updateUserProfile('influencer_profiles', {
          twitch_connected: true,
          twitch_data: mockTwitchData,
          followers: mockTwitchData.followers,
          verified_platforms: ['twitch']
        });
        
        onSuccess('twitch', mockTwitchData);
      }
    } catch (error) {
      console.error('Error connecting Twitch:', error);
    } finally {
      setLoading(null);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Connect Your Social Media Accounts</h3>
      <p className="text-sm text-gray-500 mb-6">
        Connect your social media accounts to verify your influencer status and automatically update your follower count.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={connectYouTube}
          disabled={loading === 'youtube' || connectedAccounts.youtube}
          className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${
            connectedAccounts.youtube 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          {loading === 'youtube' ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
              </svg>
              {connectedAccounts.youtube ? 'YouTube Connected' : 'Connect YouTube'}
              {connectedAccounts.youtube && (
                <svg className="ml-2 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          )}
        </button>
        
        <button
          onClick={connectInstagram}
          disabled={loading === 'instagram' || connectedAccounts.instagram}
          className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${
            connectedAccounts.instagram 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          {loading === 'instagram' ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              {connectedAccounts.instagram ? 'Instagram Connected' : 'Connect Instagram'}
              {connectedAccounts.instagram && (
                <svg className="ml-2 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          )}
        </button>
        
        <button
          onClick={connectTikTok}
          disabled={loading === 'tiktok' || connectedAccounts.tiktok}
          className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${
            connectedAccounts.tiktok 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          {loading === 'tiktok' ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
              {connectedAccounts.tiktok ? 'TikTok Connected' : 'Connect TikTok'}
              {connectedAccounts.tiktok && (
                <svg className="ml-2 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          )}
        </button>
        
        <button
          onClick={connectTwitter}
          disabled={loading === 'twitter' || connectedAccounts.twitter}
          className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${
            connectedAccounts.twitter 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          {loading === 'twitter' ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              {connectedAccounts.twitter ? 'Twitter Connected' : 'Connect Twitter'}
              {connectedAccounts.twitter && (
                <svg className="ml-2 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          )}
        </button>
        
        <button
          onClick={connectTwitch}
          disabled={loading === 'twitch' || connectedAccounts.twitch}
          className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${
            connectedAccounts.twitch 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          {loading === 'twitch' ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.269-6.269v-14.686h-21.314zm19.164 13.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045h-4.836v-15.045h17.194v11.463zm-3.582-7.343v6.262h-2.149v-6.262h2.149zm-5.731 0v6.262h-2.149v-6.262h2.149z" fillRule="evenodd" clipRule="evenodd" />
              </svg>
              {connectedAccounts.twitch ? 'Twitch Connected' : 'Connect Twitch'}
              {connectedAccounts.twitch && (
                <svg className="ml-2 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </span>
          )}
        </button>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Connecting your accounts will:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Verify your influencer status</li>
          <li>Automatically update your follower count</li>
          <li>Make your profile more visible to brands</li>
          <li>Help you receive more relevant campaign offers</li>
        </ul>
      </div>
    </div>
  );
} 