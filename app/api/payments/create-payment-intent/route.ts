import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import { firebaseAdmin } from '@/app/firebase/admin-config';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

// Token package configurations
const TOKEN_PACKAGES = {
  small: {
    tokens: 1000,
    price: 9900, // $99.00 in cents
    name: 'Small Package'
  },
  medium: {
    tokens: 2500,
    price: 19900, // $199.00 in cents
    name: 'Medium Package'
  },
  large: {
    tokens: 5000,
    price: 34900, // $349.00 in cents
    name: 'Large Package'
  }
} as const;

type PackageId = keyof typeof TOKEN_PACKAGES;

// Authentication middleware
async function authenticateUser(request: NextRequest): Promise<string | null> {
  try {
    console.log('=== Authentication Process ===');
    
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return null;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted, length:', token.length);
    
    // Check if Firebase Admin is configured
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('FIREBASE_PROJECT_ID is not configured');
      return null;
    }
    
    console.log('Verifying Firebase ID token...');
    
    // Verify the Firebase ID token
    const decodedToken = await getAuth(firebaseAdmin).verifyIdToken(token);
    console.log('Token verified, decoded token:', { uid: decodedToken.uid, email: decodedToken.email });
    
    if (!decodedToken.uid) {
      console.log('No UID in decoded token');
      return null;
    }
    
    console.log('Authentication successful for user:', decodedToken.uid);
    return decodedToken.uid;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('=== Payment Intent API Called ===');
  
  try {
    console.log('Starting payment intent creation...');
    
    // Authenticate the user
    console.log('Authenticating user...');
    const userId = await authenticateUser(request);

    if (!userId) {
      console.log('Authentication failed - no user ID');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', userId);
    
    // Parse the request body
    console.log('Parsing request body...');
    const body = await request.json();
    const { packageId } = body;
    console.log('Request body:', body);
    console.log('Package ID:', packageId);
    
    // Validate the package ID
    if (!packageId || !TOKEN_PACKAGES[packageId as PackageId]) {
      console.log('Invalid package ID:', packageId);
      return NextResponse.json(
        { error: 'Invalid package ID. Must be one of: small, medium, large' },
        { status: 400 }
      );
    }

    const packageConfig = TOKEN_PACKAGES[packageId as PackageId];
    console.log('Package config:', packageConfig);
    
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    console.log('Creating Stripe Checkout Session...');

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packageConfig.name} - ${packageConfig.tokens.toLocaleString()} Tokens`,
              description: `Purchase ${packageConfig.tokens.toLocaleString()} tokens for your marketing campaigns`,
            },
            unit_amount: packageConfig.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/store?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/store?canceled=true`,
      metadata: {
        userId: userId,
        packageId: packageId,
        tokenCount: packageConfig.tokens.toString(),
        packageName: packageConfig.name
      },
    });

    console.log('Checkout Session created successfully:', session.id);
    
    const response = {
      sessionId: session.id,
      url: session.url,
      amount: packageConfig.price,
      tokens: packageConfig.tokens,
      packageName: packageConfig.name
    };

    console.log('Returning response:', response);
    
    // Return the session ID for frontend redirection
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Payment Intent creation error:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Your card was declined.' },
        { status: 400 }
      );
    } else if (error.type === 'StripeRateLimitError') {
      return NextResponse.json(
        { error: 'Too many requests made to the API too quickly.' },
        { status: 429 }
      );
    } else if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid parameters were supplied to Stripe\'s API.' },
        { status: 400 }
      );
    } else if (error.type === 'StripeAPIError') {
      return NextResponse.json(
        { error: 'An error occurred internally with Stripe\'s API.' },
        { status: 500 }
      );
    } else if (error.type === 'StripeConnectionError') {
      return NextResponse.json(
        { error: 'Some kind of error occurred during the HTTPS communication.' },
        { status: 500 }
      );
    } else if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { error: 'You probably used an incorrect API key.' },
        { status: 500 }
      );
    } else {
      // Generic error handling
      return NextResponse.json(
        { error: 'An unexpected error occurred while processing your payment.' },
        { status: 500 }
      );
    }
  }
} 