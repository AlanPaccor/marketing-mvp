'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { supabase } from '@/app/supabase/client';

export default function CampaignSettings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState({
    defaultBudgetRange: 'all',
    defaultPlatforms: [] as string[],
    notificationPreferences: {
      newApplications: true,
      applicationUpdates: true,
      campaignPerformance: true,
      influencerMessages: true,
      paymentNotifications: true
    },
    privacySettings: {
      showCompanyInfo: true,
      allowInfluencerContact: true,
      publicProfile: true
    }
  });

  // Platform options
  const platformOptions = [
    'Instagram',
    'TikTok',
    'YouTube',
    'Twitter',
    'Facebook',
    'LinkedIn',
    'Pinterest',
    'Twitch'
  ];

  // Budget range options
  const budgetRangeOptions = [
    { value: 'all', label: 'All Budgets' },
    { value: 'micro', label: 'Micro ($0-$500)' },
    { value: 'small', label: 'Small ($500-$2,000)' },
    { value: 'medium', label: 'Medium ($2,000-$10,000)' },
    { value: 'large', label: 'Large ($10,000+)' }
  ];

  useEffect(() => {
    if (!loading) {
      // If not logged in, redirect to login
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      // If not a business account, redirect to appropriate dashboard
      if (user.userType !== 'business') {
        router.push('/influencer/dashboard');
        return;
      }
      
      // Load settings
      loadSettings();
    }
  }, [user, loading, router]);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, you would fetch settings from the database
      // For now, we'll just simulate a delay and use default settings
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, you would fetch actual settings:
      // const { data, error } = await supabase
      //   .from('business_settings')
      //   .select('*')
      //   .eq('business_id', user?.id)
      //   .single();
      
      // if (error) throw error;
      // if (data) setSettings(data);
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real app, you would save settings to the database
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real implementation, you would update actual settings:
      // const { error } = await supabase
      //   .from('business_settings')
      //   .upsert({
      //     business_id: user?.id,
      //     ...settings
      //   });
      
      // if (error) throw error;
      
      setSuccess('Settings saved successfully!');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
      setIsLoading(false);
    }
  };

  const handleToggleNotification = (key: string) => {
    setSettings({
      ...settings,
      notificationPreferences: {
        ...settings.notificationPreferences,
        [key]: !settings.notificationPreferences[key as keyof typeof settings.notificationPreferences]
      }
    });
  };

  const handleTogglePrivacy = (key: string) => {
    setSettings({
      ...settings,
      privacySettings: {
        ...settings.privacySettings,
        [key]: !settings.privacySettings[key as keyof typeof settings.privacySettings]
      }
    });
  };

  const handlePlatformToggle = (platform: string) => {
    if (settings.defaultPlatforms.includes(platform)) {
      setSettings({
        ...settings,
        defaultPlatforms: settings.defaultPlatforms.filter(p => p !== platform)
      });
    } else {
      setSettings({
        ...settings,
        defaultPlatforms: [...settings.defaultPlatforms, platform]
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/business/dashboard">
                  <span className="text-xl font-bold text-indigo-600">InfluencerHub</span>
                </Link>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link 
                  href="/business/campaigns" 
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  All Campaigns
                </Link>
                <Link 
                  href="/business/influencers/discover" 
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Discover Influencers
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Campaign Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your campaign preferences and notification settings
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/business/campaigns"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Default Campaign Preferences
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                These settings will be applied as defaults when creating new campaigns
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div>
                <label htmlFor="defaultBudgetRange" className="block text-sm font-medium text-gray-700">
                  Default Budget Range
                </label>
                <select
                  id="defaultBudgetRange"
                  name="defaultBudgetRange"
                  value={settings.defaultBudgetRange}
                  onChange={(e) => setSettings({...settings, defaultBudgetRange: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {budgetRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Platforms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {platformOptions.map((platform) => (
                    <div key={platform} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`platform-${platform}`}
                        checked={settings.defaultPlatforms.includes(platform)}
                        onChange={() => handlePlatformToggle(platform)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`platform-${platform}`} className="ml-2 block text-sm text-gray-700">
                        {platform}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:px-6 border-t border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Notification Preferences
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Control which notifications you receive about your campaigns
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6 space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="newApplications"
                    name="newApplications"
                    type="checkbox"
                    checked={settings.notificationPreferences.newApplications}
                    onChange={() => handleToggleNotification('newApplications')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="newApplications" className="font-medium text-gray-700">New applications</label>
                  <p className="text-gray-500">Receive notifications when influencers apply to your campaigns</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="applicationUpdates"
                    name="applicationUpdates"
                    type="checkbox"
                    checked={settings.notificationPreferences.applicationUpdates}
                    onChange={() => handleToggleNotification('applicationUpdates')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="applicationUpdates" className="font-medium text-gray-700">Application updates</label>
                  <p className="text-gray-500">Receive notifications about changes to existing applications</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="campaignPerformance"
                    name="campaignPerformance"
                    type="checkbox"
                    checked={settings.notificationPreferences.campaignPerformance}
                    onChange={() => handleToggleNotification('campaignPerformance')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="campaignPerformance" className="font-medium text-gray-700">Campaign performance</label>
                  <p className="text-gray-500">Receive weekly performance reports for your active campaigns</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="influencerMessages"
                    name="influencerMessages"
                    type="checkbox"
                    checked={settings.notificationPreferences.influencerMessages}
                    onChange={() => handleToggleNotification('influencerMessages')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="influencerMessages" className="font-medium text-gray-700">Influencer messages</label>
                  <p className="text-gray-500">Receive notifications when influencers send you messages</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="paymentNotifications"
                    name="paymentNotifications"
                    type="checkbox"
                    checked={settings.notificationPreferences.paymentNotifications}
                    onChange={() => handleToggleNotification('paymentNotifications')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="paymentNotifications" className="font-medium text-gray-700">Payment notifications</label>
                  <p className="text-gray-500">Receive notifications about payments and invoices</p>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:px-6 border-t border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Privacy Settings
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Control what information is visible to influencers
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6 space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="showCompanyInfo"
                    name="showCompanyInfo"
                    type="checkbox"
                    checked={settings.privacySettings.showCompanyInfo}
                    onChange={() => handleTogglePrivacy('showCompanyInfo')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="showCompanyInfo" className="font-medium text-gray-700">Show company information</label>
                  <p className="text-gray-500">Display your company name and logo on campaign listings</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allowInfluencerContact"
                    name="allowInfluencerContact"
                    type="checkbox"
                    checked={settings.privacySettings.allowInfluencerContact}
                    onChange={() => handleTogglePrivacy('allowInfluencerContact')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="allowInfluencerContact" className="font-medium text-gray-700">Allow influencer contact</label>
                  <p className="text-gray-500">Allow influencers to contact you directly outside of campaign applications</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="publicProfile"
                    name="publicProfile"
                    type="checkbox"
                    checked={settings.privacySettings.publicProfile}
                    onChange={() => handleTogglePrivacy('publicProfile')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="publicProfile" className="font-medium text-gray-700">Public profile</label>
                  <p className="text-gray-500">Make your business profile visible to all influencers on the platform</p>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isLoading}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 