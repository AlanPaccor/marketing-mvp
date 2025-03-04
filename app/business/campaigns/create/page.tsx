'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { supabase } from '@/app/supabase/client';

// Define campaign form data interface
interface CampaignFormData {
  title: string;
  description: string;
  objectives: string[];
  budget: number;
  startDate: string;
  endDate: string;
  targetAudience: {
    ageRange: string;
    gender: string[];
    interests: string[];
    location: string;
  };
  requirements: string;
  contentGuidelines: string;
  platformPreferences: string[];
}

export default function CreateCampaign() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    objectives: [],
    budget: 0,
    startDate: '',
    endDate: '',
    targetAudience: {
      ageRange: '18-24',
      gender: [],
      interests: [],
      location: '',
    },
    requirements: '',
    contentGuidelines: '',
    platformPreferences: [],
  });

  // Available options for form selections
  const objectiveOptions = [
    'Brand Awareness',
    'Product Launch',
    'Increase Sales',
    'Community Building',
    'Content Creation',
    'Event Promotion'
  ];

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

  const genderOptions = ['Male', 'Female', 'Non-binary', 'All'];
  
  const interestOptions = [
    'Fashion',
    'Beauty',
    'Fitness',
    'Health',
    'Food',
    'Travel',
    'Technology',
    'Gaming',
    'Lifestyle',
    'Business',
    'Education',
    'Entertainment',
    'Sports'
  ];

  const ageRangeOptions = [
    '13-17',
    '18-24',
    '25-34',
    '35-44',
    '45-54',
    '55-64',
    '65+'
  ];

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof CampaignFormData] as any,
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle checkbox/multi-select changes
  const handleMultiSelectChange = (name: string, value: string) => {
    if (name.includes('.')) {
      // Handle nested arrays (like targetAudience.gender)
      const [parent, child] = name.split('.');
      const currentValues = [...(formData[parent as keyof CampaignFormData] as any)[child]];
      
      if (currentValues.includes(value)) {
        // Remove if already selected
        const updatedValues = currentValues.filter(item => item !== value);
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent as keyof CampaignFormData] as any,
            [child]: updatedValues
          }
        });
      } else {
        // Add if not selected
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent as keyof CampaignFormData] as any,
            [child]: [...currentValues, value]
          }
        });
      }
    } else {
      // Handle top-level arrays (like objectives)
      const currentValues = [...formData[name as keyof CampaignFormData] as string[]];
      
      if (currentValues.includes(value)) {
        // Remove if already selected
        const updatedValues = currentValues.filter(item => item !== value);
        setFormData({
          ...formData,
          [name]: updatedValues
        });
      } else {
        // Add if not selected
        setFormData({
          ...formData,
          [name]: [...currentValues, value]
        });
      }
    }
  };

  // Navigate to next step
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Validate current step before proceeding
  const validateCurrentStep = () => {
    setError(null);
    
    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          setError('Campaign title is required');
          return false;
        }
        if (!formData.description.trim()) {
          setError('Campaign description is required');
          return false;
        }
        if (formData.objectives.length === 0) {
          setError('Please select at least one campaign objective');
          return false;
        }
        break;
        
      case 2:
        if (!formData.budget || formData.budget <= 0) {
          setError('Please enter a valid budget amount');
          return false;
        }
        if (!formData.startDate) {
          setError('Start date is required');
          return false;
        }
        if (!formData.endDate) {
          setError('End date is required');
          return false;
        }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
          setError('End date must be after start date');
          return false;
        }
        break;
        
      case 3:
        if (formData.targetAudience.gender.length === 0) {
          setError('Please select at least one gender preference');
          return false;
        }
        if (formData.targetAudience.interests.length === 0) {
          setError('Please select at least one interest');
          return false;
        }
        if (!formData.targetAudience.location.trim()) {
          setError('Target location is required');
          return false;
        }
        break;
        
      case 4:
        if (!formData.requirements.trim()) {
          setError('Influencer requirements are required');
          return false;
        }
        if (formData.platformPreferences.length === 0) {
          setError('Please select at least one platform');
          return false;
        }
        break;
    }
    
    return true;
  };

  // Submit the campaign
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create a campaign');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Format the data for database insertion
      const campaignData = {
        business_id: user.id,
        title: formData.title,
        description: formData.description,
        objectives: formData.objectives,
        budget: formData.budget,
        start_date: formData.startDate,
        end_date: formData.endDate,
        target_audience: formData.targetAudience,
        requirements: formData.requirements,
        content_guidelines: formData.contentGuidelines,
        platform_preferences: formData.platformPreferences,
        status: 'draft',
        created_at: new Date().toISOString(),
      };
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSuccess('Campaign created successfully!');
      
      // Redirect to campaign details page after a short delay
      setTimeout(() => {
        router.push(`/business/campaigns/${data[0].id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setError(err.message || 'Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If loading or not authenticated, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not a business user, show error
  if (user && user.userType !== 'business') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white shadow-md rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="mb-4">Only business accounts can create campaigns.</p>
          <Link 
            href="/influencer/dashboard" 
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go to Influencer Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
            <p className="mt-1 text-sm text-gray-500">
              Complete the form below to create a new influencer marketing campaign
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep === step 
                        ? 'bg-indigo-600 text-white' 
                        : currentStep > step 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  <span className="text-xs mt-1 text-gray-500">
                    {step === 1 && 'Basics'}
                    {step === 2 && 'Budget & Timeline'}
                    {step === 3 && 'Target Audience'}
                    {step === 4 && 'Requirements'}
                    {step === 5 && 'Review'}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 h-1 rounded-full">
              <div 
                className="bg-indigo-600 h-1 rounded-full" 
                style={{ width: `${(currentStep - 1) * 25}%` }}
              ></div>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mx-4 my-4 bg-red-50 border-l-4 border-red-400 p-4">
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
          
          {/* Success Message */}
          {success && (
            <div className="mx-4 my-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Campaign Information */}
            {currentStep === 1 && (
              <div className="px-4 py-5 sm:p-6 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Campaign Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Summer Product Launch"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Campaign Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Describe your campaign goals and what you're looking to achieve..."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Objectives <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {objectiveOptions.map((objective) => (
                      <div key={objective} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`objective-${objective}`}
                          checked={formData.objectives.includes(objective)}
                          onChange={() => handleMultiSelectChange('objectives', objective)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`objective-${objective}`} className="ml-2 block text-sm text-gray-700">
                          {objective}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Budget and Timeline */}
            {currentStep === 2 && (
              <div className="px-4 py-5 sm:p-6 space-y-6">
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                    Campaign Budget (USD) <span className="text-red-500">*</span>
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
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="0.00"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      id="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Target Audience */}
            {currentStep === 3 && (
              <div className="px-4 py-5 sm:p-6 space-y-6">
                <div>
                  <label htmlFor="targetAudience.ageRange" className="block text-sm font-medium text-gray-700">
                    Target Age Range <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="targetAudience.ageRange"
                    id="targetAudience.ageRange"
                    value={formData.targetAudience.ageRange}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {ageRangeOptions.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {genderOptions.map((gender) => (
                      <div key={gender} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`gender-${gender}`}
                          checked={formData.targetAudience.gender.includes(gender)}
                          onChange={() => handleMultiSelectChange('targetAudience.gender', gender)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`gender-${gender}`} className="ml-2 block text-sm text-gray-700">
                          {gender}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Interests <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {interestOptions.map((interest) => (
                      <div key={interest} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`interest-${interest}`}
                          checked={formData.targetAudience.interests.includes(interest)}
                          onChange={() => handleMultiSelectChange('targetAudience.interests', interest)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`interest-${interest}`} className="ml-2 block text-sm text-gray-700">
                          {interest}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="targetAudience.location" className="block text-sm font-medium text-gray-700">
                    Target Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="targetAudience.location"
                    id="targetAudience.location"
                    value={formData.targetAudience.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., United States, Global, New York City"
                  />
                </div>
              </div>
            )}
            
            {/* Step 4: Requirements and Platforms */}
            {currentStep === 4 && (
              <div className="px-4 py-5 sm:p-6 space-y-6">
                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                    Influencer Requirements <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="requirements"
                    id="requirements"
                    rows={3}
                    value={formData.requirements}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Minimum follower count, engagement rate, previous experience..."
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="contentGuidelines" className="block text-sm font-medium text-gray-700">
                    Content Guidelines
                  </label>
                  <textarea
                    name="contentGuidelines"
                    id="contentGuidelines"
                    rows={3}
                    value={formData.contentGuidelines}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Describe the type of content you're looking for, any specific messaging, hashtags, etc."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Platforms <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {platformOptions.map((platform) => (
                      <div key={platform} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`platform-${platform}`}
                          checked={formData.platformPreferences.includes(platform)}
                          onChange={() => handleMultiSelectChange('platformPreferences', platform)}
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
            )}
            
            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="px-4 py-5 sm:p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Review Your Campaign</h3>
                
                <div className="border-t border-gray-200 pt-4">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Campaign Title</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.title}</dd>
                    </div>
                    
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.description}</dd>
                    </div>
                    
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Objectives</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {formData.objectives.join(', ')}
                      </dd>
                    </div>

                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Budget</dt>
                      <dd className="text-sm text-gray-900 col-span-2">${formData.budget.toLocaleString()}</dd>
                    </div>

                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Timeline</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {new Date(formData.startDate).toLocaleDateString()} to {new Date(formData.endDate).toLocaleDateString()}
                      </dd>
                    </div>

                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Target Age</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.targetAudience.ageRange}</dd>
                    </div>

                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Target Gender</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.targetAudience.gender.join(', ')}</dd>
                    </div>

                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Target Interests</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.targetAudience.interests.join(', ')}</dd>
                    </div>

                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Target Location</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.targetAudience.location}</dd>
                    </div>

                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Requirements</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.requirements}</dd>
                    </div>

                    {formData.contentGuidelines && (
                      <div className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Content Guidelines</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formData.contentGuidelines}</dd>
                      </div>
                    )}

                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Platforms</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{formData.platformPreferences.join(', ')}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
            
            {/* Form Navigation Buttons */}
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Previous
                </button>
              )}
              
              <div>
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Campaign'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}