import { getAuth } from 'firebase/auth';
import { app } from '@/app/firebase/config';

// Token package configurations (matching the backend)
export const TOKEN_PACKAGES = {
  small: {
    tokens: 1000,
    price: 99.00,
    name: 'Small Package'
  },
  medium: {
    tokens: 2500,
    price: 199.00,
    name: 'Medium Package'
  },
  large: {
    tokens: 5000,
    price: 349.00,
    name: 'Large Package'
  }
} as const;

export type PackageId = keyof typeof TOKEN_PACKAGES;

export interface PaymentIntentResponse {
  sessionId: string;
  url: string;
  amount: number;
  tokens: number;
  packageName: string;
}

export interface PaymentError {
  error: string;
}

/**
 * Creates a payment intent for a token package
 * @param packageId - The package ID (small, medium, large)
 * @returns Promise with payment intent data or error
 */
export async function createPaymentIntent(packageId: PackageId): Promise<PaymentIntentResponse | PaymentError> {
  try {
    console.log('Creating payment intent for package:', packageId);
    
    const auth = getAuth(app);
    const user = auth.currentUser;
    
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('User authenticated, getting ID token...');
    
    // Get the Firebase ID token
    const idToken = await user.getIdToken();
    console.log('ID token obtained, making API request...');
    
    const requestBody = { packageId };
    console.log('Request body:', requestBody);
    
    const response = await fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('API response status:', response.status);
    console.log('API response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('API request failed with status:', response.status);
      
      // Try to get error details
      const responseText = await response.text();
      console.error('Response text:', responseText);
      
      let errorMessage = 'Failed to create payment intent';
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response as JSON:', parseError);
        // If it's HTML, it's likely a 500 error page
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          errorMessage = `Server error (${response.status}). Check server logs for details.`;
        } else {
          errorMessage = `Server error: ${responseText}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const responseText = await response.text();
    console.log('Success response text:', responseText);
    
    try {
      const result = JSON.parse(responseText);
      console.log('Parsed response:', result);
      return result;
    } catch (parseError) {
      console.error('Failed to parse success response as JSON:', parseError);
      throw new Error('Invalid response format from server');
    }
    
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Formats price in USD
 * @param amount - Amount in cents
 * @returns Formatted price string
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount / 100);
}

/**
 * Formats token count with commas
 * @param tokens - Number of tokens
 * @returns Formatted token string
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
} 