'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/supabase/client';
import Link from 'next/link';

interface FormData {
  title: string;
  description: string;
  custom_id: string;
  status: string;
  objectives: string[];
  budget: number | string;
  start_date: string;
  end_date: string;
  target_audience: {
    ageRange: string;
    gender: string[];
    interests: string[];
    location: string;
  };
  requirements: string;
  content_guidelines: string;
  platform_preferences: string[];
}

export default function EditCampaignPage() {
  const { id } = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    custom_id: '',
    status: 'draft',
    objectives: [],
    budget: 0,
    start_date: '',
    end_date: '',
    target_audience: {
      ageRange: '',
      gender: [],
      interests: [],
      location: ''
    },
    requirements: '',
    content_guidelines: '',
    platform_preferences: []
  });

  // Available options for form selects
  const objectiveOptions = [
    'Brand Awareness', 
    'Content Creation', 
    'Product Launch', 
    'Engagement', 
    'Sales', 
    'Lead Generation'
  ];
  
  const genderOptions = ['All', 'Male', 'Female', 'Non-binary'];
  
  const interestOptions = [
    'Technology', 'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel', 
    'Gaming', 'Music', 'Art', 'Sports', 'Lifestyle', 'Business'
  ];
  
  const platformOptions = [
    'Instagram', 'TikTok', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'Pinterest'
  ];

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .maybeSingle();
          
        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error('Campaign not found');
        }

        console.log('Fetched campaign data:', data);
        setCampaign(data);
        
        // Initialize form with campaign data, handling potential missing fields
        setFormData({
          title: data.title || '',
          description: data.description || '',
          custom_id: data.custom_id || '',
          status: data.status || 'draft',
          objectives: data.objectives || [],
          budget: data.budget || 0,
          start_date: data.start_date || '',
          end_date: data.end_date || '',
          target_audience: data.target_audience || {
            ageRange: '',
            gender: [],
            interests: [],
            location: ''
          },
          requirements: data.requirements || '',
          content_guidelines: data.content_guidelines || '',
          platform_preferences: data.platform_preferences || []
        });
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleArrayChange = (name: string, value: any[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTargetAudienceChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      target_audience: {
        ...prev.target_audience,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      console.log('Submitting form data:', formData);
      
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          title: formData.title,
          description: formData.description,
          custom_id: formData.custom_id,
          status: formData.status,
          objectives: formData.objectives,
          budget: formData.budget,
          start_date: formData.start_date,
          end_date: formData.end_date,
          target_audience: formData.target_audience,
          requirements: formData.requirements,
          content_guidelines: formData.content_guidelines,
          platform_preferences: formData.platform_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
        
      if (error) {
        throw new Error(error.message);
      }

      console.log('Update successful:', data);

      // Redirect back to the campaign page
      if (formData.custom_id) {
        router.push(`/business/campaigns/c/${formData.custom_id}`);
      } else {
        router.push(`/business/campaigns/${id}`);
      }
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
          <Link href="/business/campaigns" className="text-indigo-600 hover:text-indigo-900">
            ← Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="custom_id" className="block text-sm font-medium text-gray-700">
                      Custom ID
                    </label>
                    <input
                      type="text"
                      name="custom_id"
                      id="custom_id"
                      value={formData.custom_id}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Optional. A custom identifier for this campaign.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h2>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Objectives
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {objectiveOptions.map(objective => (
                      <div key={objective} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`objective-${objective}`}
                          checked={formData.objectives.includes(objective)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleArrayChange('objectives', [...formData.objectives, objective]);
                            } else {
                              handleArrayChange('objectives', formData.objectives.filter(o => o !== objective));
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`objective-${objective}`} className="ml-2 text-sm text-gray-700">
                          {objective}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                      Budget
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        name="budget"
                        id="budget"
                        min="0"
                        step="0.01"
                        value={formData.budget}
                        onChange={handleNumberChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      id="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      id="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Target Audience</h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="target_audience_age" className="block text-sm font-medium text-gray-700">
                      Age Range
                    </label>
                    <select
                      id="target_audience_age"
                      value={formData.target_audience.ageRange}
                      onChange={(e) => handleTargetAudienceChange('ageRange', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select age range</option>
                      <option value="13-17">13-17</option>
                      <option value="18-24">18-24</option>
                      <option value="25-34">25-34</option>
                      <option value="35-44">35-44</option>
                      <option value="45-54">45-54</option>
                      <option value="55+">55+</option>
                      <option value="All">All ages</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="target_audience_location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      id="target_audience_location"
                      value={formData.target_audience.location}
                      onChange={(e) => handleTargetAudienceChange('location', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g. United States, Global, New York"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {genderOptions.map(gender => (
                      <div key={gender} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`gender-${gender}`}
                          checked={formData.target_audience.gender?.includes(gender)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleTargetAudienceChange('gender', [
                                ...(formData.target_audience.gender || []),
                                gender
                              ]);
                            } else {
                              handleTargetAudienceChange(
                                'gender',
                                formData.target_audience.gender?.filter(g => g !== gender) || []
                              );
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`gender-${gender}`} className="ml-2 text-sm text-gray-700">
                          {gender}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Interests
                  </label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {interestOptions.map(interest => (
                      <div key={interest} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`interest-${interest}`}
                          checked={formData.target_audience.interests?.includes(interest)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleTargetAudienceChange('interests', [
                                ...(formData.target_audience.interests || []),
                                interest
                              ]);
                            } else {
                              handleTargetAudienceChange(
                                'interests',
                                formData.target_audience.interests?.filter(i => i !== interest) || []
                              );
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`interest-${interest}`} className="ml-2 text-sm text-gray-700">
                          {interest}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Requirements */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Content Requirements</h2>
                
                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                    Requirements
                  </label>
                  <textarea
                    name="requirements"
                    id="requirements"
                    rows={3}
                    value={formData.requirements}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Specific requirements for influencers"
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="content_guidelines" className="block text-sm font-medium text-gray-700">
                    Content Guidelines
                  </label>
                  <textarea
                    name="content_guidelines"
                    id="content_guidelines"
                    rows={3}
                    value={formData.content_guidelines}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Guidelines for content creation"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Platform Preferences
                  </label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {platformOptions.map(platform => (
                      <div key={platform} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`platform-${platform}`}
                          checked={formData.platform_preferences?.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleArrayChange('platform_preferences', [
                                ...(formData.platform_preferences || []),
                                platform
                              ]);
                            } else {
                              handleArrayChange(
                                'platform_preferences',
                                formData.platform_preferences?.filter(p => p !== platform) || []
                              );
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`platform-${platform}`} className="ml-2 text-sm text-gray-700">
                          {platform}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <Link
                  href={formData.custom_id 
                    ? `/business/campaigns/c/${formData.custom_id}` 
                    : `/business/campaigns/${id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 