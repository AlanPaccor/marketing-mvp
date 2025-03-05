'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabase/client';
import Link from 'next/link';

interface FormData {
  title: string;
  description: string;
  custom_id: string;
  status: string;
  objectives: string[];
  budget: number | '';
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
  isPublic: boolean;
}

interface Campaign {
  id: number;
  title: string;
  description: string;
  custom_id?: string;
  status: string;
  objectives: string[];
  budget: number;
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
  created_by: string;
  business_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

interface EditCampaignFormProps {
  campaign: Campaign;
  customId?: string;
}

export default function EditCampaignForm({ campaign, customId }: EditCampaignFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    title: campaign.title || '',
    description: campaign.description || '',
    custom_id: campaign.custom_id || '',
    status: campaign.status || 'draft',
    objectives: campaign.objectives || [],
    budget: campaign.budget || 0,
    start_date: campaign.start_date || '',
    end_date: campaign.end_date || '',
    target_audience: campaign.target_audience || {
      ageRange: '',
      gender: [],
      interests: [],
      location: ''
    },
    requirements: campaign.requirements || '',
    content_guidelines: campaign.content_guidelines || '',
    platform_preferences: campaign.platform_preferences || [],
    isPublic: campaign.is_public || true,
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
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
          is_public: formData.isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id)
        .select();
        
      if (error) {
        throw new Error(error.message);
      }

      console.log('Update successful:', data);

      // Redirect back to the campaign page
      if (formData.custom_id) {
        router.push(`/business/campaigns/c/${formData.custom_id}`);
      } else {
        router.push(`/business/campaigns/${campaign.id}`);
      }
    } catch (err: any) {
      console.error('Error updating campaign:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== campaign.title) {
      return; // Don't proceed if confirmation text doesn't match
    }
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Redirect to campaigns list after successful deletion
      router.push('/business/campaigns');
      
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      setError(err.message || 'An unknown error occurred while deleting the campaign');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmation('');
    // Focus the input field when the modal opens
    setTimeout(() => {
      if (deleteInputRef.current) {
        deleteInputRef.current.focus();
      }
    }, 100);
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
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
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Campaign Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="custom_id" className="block text-sm font-medium text-gray-700">
                  Custom ID (for sharing)
                </label>
                <input
                  type="text"
                  name="custom_id"
                  id="custom_id"
                  value={formData.custom_id}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. summer-campaign-2023"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Create a custom URL for sharing this campaign
                </p>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
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
                    value={formData.budget}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

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

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Describe your campaign"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">
                Campaign Objectives
              </label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {objectiveOptions.map(objective => (
                  <div key={objective} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`objective-${objective}`}
                      checked={formData.objectives?.includes(objective)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayChange('objectives', [
                            ...(formData.objectives || []),
                            objective
                          ]);
                        } else {
                          handleArrayChange(
                            'objectives',
                            formData.objectives?.filter(o => o !== objective) || []
                          );
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
          </div>

          {/* Target Audience */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Target Audience</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700">
                  Age Range
                </label>
                <input
                  type="text"
                  id="ageRange"
                  value={formData.target_audience.ageRange}
                  onChange={(e) => handleTargetAudienceChange('ageRange', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. 18-24, 25-34"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
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

          {/* Public/Private Toggle */}
          <div className="flex items-start mt-4">
            <div className="flex items-center h-5">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                checked={formData.isPublic}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="isPublic" className="font-medium text-gray-700">Public Campaign</label>
              <p className="text-gray-500">Make this campaign visible to all influencers who can apply directly. If unchecked, the campaign will be private and invitation-only.</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between space-x-3">
            <Link
              href="/business/dashboard"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={openDeleteModal}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Campaign
              </button>
              <Link
                href={formData.custom_id 
                  ? `/business/campaigns/c/${formData.custom_id}` 
                  : `/business/campaigns/${campaign.id}`}
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
        </div>
      </form>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={closeDeleteModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Delete Campaign
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this campaign? This action cannot be undone.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      To confirm, please type the campaign name: <span className="font-bold">{campaign.title}</span>
                    </p>
                    <input
                      type="text"
                      ref={deleteInputRef}
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="mt-3 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Type campaign name to confirm"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  disabled={deleteConfirmation !== campaign.title || isDeleting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm ${
                    (deleteConfirmation !== campaign.title || isDeleting) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={handleDelete}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Campaign'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 