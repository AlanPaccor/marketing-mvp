'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to landing page
        router.push('/');
      } else if (!user.emailVerified) {
        // Email not verified
        router.push('/auth/verify-email');
      } else {
        // Redirect based on user type
        if (user.userType === 'business') {
          router.push('/business/dashboard');
        } else {
          router.push('/influencer/dashboard');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-indigo-900 mb-6">
            Connect Brands with <span className="text-indigo-600">Perfect Influencers</span>
          </h1>
          <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto">
            The smartest way to find, connect, and collaborate with influencers across all platforms.
            Secure, transparent, and effective.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="px-8 py-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started
            </Link>
            <Link href="/how-it-works" className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-600 hover:bg-indigo-50 transition-colors">
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-indigo-900 mb-12">How Our Platform Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-indigo-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold text-indigo-900 mb-3">Token-Based System</h3>
              <p className="text-gray-700">
                Businesses purchase tokens to contact influencers, ensuring quality outreach and preventing spam.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-indigo-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold text-indigo-900 mb-3">Boosted Profiles</h3>
              <p className="text-gray-700">
                Influencers can boost their visibility in our featured carousel to attract more sponsorship opportunities.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-indigo-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold text-indigo-900 mb-3">Secure Escrow Payments</h3>
              <p className="text-gray-700">
                All payments are held securely in escrow until sponsorship completion, protecting both parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Businesses Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-indigo-900 mb-6">For Businesses</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">✓</div>
                  <p className="ml-3 text-gray-700">Find the perfect influencers based on niche, audience size, and platform</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">✓</div>
                  <p className="ml-3 text-gray-700">Automated outreach to influencers not yet on our platform</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">✓</div>
                  <p className="ml-3 text-gray-700">Secure payment system with dispute resolution</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">✓</div>
                  <p className="ml-3 text-gray-700">Track campaign performance and ROI</p>
                </li>
              </ul>
              <Link href="/business-signup" className="inline-block mt-8 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Join as a Business
              </Link>
            </div>
            <div className="md:w-1/2 bg-white p-6 rounded-xl shadow-lg">
              {/* Placeholder for business dashboard preview */}
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Business Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Influencers Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-indigo-900 mb-6">For Influencers</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">✓</div>
                  <p className="ml-3 text-gray-700">Showcase your profile and audience demographics to attract relevant brands</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">✓</div>
                  <p className="ml-3 text-gray-700">Boost your visibility with our featured carousel</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">✓</div>
                  <p className="ml-3 text-gray-700">Receive and negotiate sponsorship offers securely</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-indigo-600">✓</div>
                  <p className="ml-3 text-gray-700">Get paid promptly through our escrow system</p>
                </li>
              </ul>
              <Link href="/influencer-signup" className="inline-block mt-8 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Join as an Influencer
              </Link>
            </div>
            <div className="md:w-1/2 bg-white p-6 rounded-xl shadow-lg">
              {/* Placeholder for influencer profile preview */}
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Influencer Profile Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-indigo-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-indigo-900 mb-12">What Our Users Say</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-gray-700 mb-4">
                "This platform has completely transformed how we find influencers for our campaigns. The token system ensures we only connect with relevant creators, and the escrow payment gives us peace of mind."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-200 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-indigo-900">Sarah Johnson</p>
                  <p className="text-sm text-gray-500">Marketing Director, TechBrand</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-gray-700 mb-4">
                "As a content creator, I've tried many platforms, but this one stands out. The boosted profile feature helped me land three major sponsorships in my first month!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-200 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-indigo-900">Alex Rivera</p>
                  <p className="text-sm text-gray-500">Gaming Influencer, 500K followers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-indigo-900 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Sponsorship Strategy?</h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto">
            Join thousands of businesses and influencers already using our platform to create successful partnerships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="px-8 py-4 bg-white text-indigo-900 font-medium rounded-lg hover:bg-indigo-50 transition-colors">
              Get Started Now
            </Link>
            <Link href="/auth/login" className="px-8 py-4 bg-transparent text-white font-medium rounded-lg border border-white hover:bg-indigo-800 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-indigo-950 text-indigo-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Influencer Sponsorship</h3>
            <p className="text-sm">
              Connecting brands with the perfect content creators for authentic partnerships.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="hover:text-white">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-indigo-800 text-sm text-center">
          <p>© {new Date().getFullYear()} Influencer Sponsorship. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
