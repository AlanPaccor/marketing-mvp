import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/app/supabase/server';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const { userId, packageId, tokenCount } = session.metadata || {};
    
    if (!userId || !packageId || !tokenCount) {
      console.error('Missing required metadata in checkout session:', session.id);
      return;
    }

    console.log(`Processing successful checkout for user ${userId}, package ${packageId}, tokens ${tokenCount}`);

    // Get current token balance from Users table
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('Users')
      .select('token_balance')
      .eq('firebase_uid', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current token balance:', fetchError);
      return;
    }

    const currentTokens = currentUser?.token_balance || 0;
    const newTokenBalance = currentTokens + parseInt(tokenCount);
    
    console.log(`Firebase UID: ${userId}`);
    console.log(`Current tokens: ${currentTokens}, Adding: ${tokenCount}, New balance: ${newTokenBalance}`);
      
    // Update the user's token balance in the Users table
    const { error: updateError } = await supabaseAdmin
      .from('Users')
      .update({
        token_balance: newTokenBalance,
        updated_at: new Date().toISOString()
      })
      .eq('firebase_uid', userId);

    if (updateError) {
      console.error('Error updating user token balance:', updateError);
      console.error('Update error details:', updateError);
    } else {
      console.log(`Successfully updated user ${userId} token balance to ${newTokenBalance}`);
    }

    // Record the transaction in token_transactions table
    const { error: transactionError } = await supabaseAdmin
      .from('token_transactions')
      .insert({
        firebase_uid: userId,
        tokens_spent: -parseInt(tokenCount), // Negative because we're adding tokens
        status: 'completed',
        type: 'purchase',
        payment_intent_id: session.payment_intent as string,
        package_id: packageId
      });

    if (transactionError) {
      console.error('Error recording token transaction:', transactionError);
    }

    console.log(`Successfully processed checkout session for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { userId, packageId, tokenCount } = paymentIntent.metadata;
    
    if (!userId || !packageId || !tokenCount) {
      console.error('Missing required metadata in payment intent:', paymentIntent.id);
      return;
    }

    console.log(`Processing successful payment for user ${userId}, package ${packageId}, tokens ${tokenCount}`);

    // Get current token balance from Users table
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('Users')
      .select('token_balance')
      .eq('firebase_uid', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current token balance:', fetchError);
      return;
    }

    const currentTokens = currentUser?.token_balance || 0;
    const newTokenBalance = currentTokens + parseInt(tokenCount);

    // Update the user's token balance in the Users table
    const { error: updateError } = await supabaseAdmin
      .from('Users')
      .update({
        token_balance: newTokenBalance,
        updated_at: new Date().toISOString()
      })
      .eq('firebase_uid', userId);

    if (updateError) {
      console.error('Error updating user token balance:', updateError);
    }

    // Record the transaction in token_transactions table
    const { error: transactionError } = await supabaseAdmin
      .from('token_transactions')
      .insert({
        firebase_uid: userId,
        tokens_spent: -parseInt(tokenCount), // Negative because we're adding tokens
        status: 'completed',
        type: 'purchase',
        payment_intent_id: paymentIntent.id,
        package_id: packageId
      });

    if (transactionError) {
      console.error('Error recording token transaction:', transactionError);
    }

    console.log(`Successfully processed payment for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { userId, packageId } = paymentIntent.metadata;
    
    console.log(`Payment failed for user ${userId}, package ${packageId}`);
    
    // Record the failed transaction
    const { error: transactionError } = await supabaseAdmin
      .from('token_transactions')
      .insert({
        firebase_uid: userId,
        tokens_spent: 0,
        status: 'failed',
        type: 'purchase',
        payment_intent_id: paymentIntent.id,
        package_id: packageId
      });

    if (transactionError) {
      console.error('Error recording failed transaction:', transactionError);
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
} 