import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

const UnauthorizedPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Unauthorized Access | Legal AI SaaS</title>
        <meta name="description" content="Access denied - insufficient permissions" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 rounded-full">
                <ShieldX className="h-12 w-12 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            
            <p className="text-gray-600 mb-8">
              You don't have permission to access this page. This area is restricted to administrators only.
            </p>
            
            <div className="space-y-4">
              <Link 
                href="/" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <Home className="h-5 w-5 mr-2" />
                Go to Home
              </Link>
              
              <button 
                onClick={() => window.history.back()} 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Go Back
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </>
  );
};

export default UnauthorizedPage;