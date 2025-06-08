'use client';

import ClientLayout from './components/ClientLayout';
import dynamic from 'next/dynamic';

// Dynamically import the form component with no SSR
const DJContractForm = dynamic(() => import('./components/DJContractForm'), {
  ssr: false,
  loading: () => <div>Loading form...</div>
});

export default function HomePage() {
  return (
    <ClientLayout>
      <DJContractForm />
    </ClientLayout>
  );
}

