'use client';

import { FormProvider } from '../contexts/FormContext';

export default function ClientFormProvider({ children }) {
  return (
    <FormProvider>
      {children}
    </FormProvider>
  );
} 