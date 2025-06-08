# DJ Contract App Refactoring Guide

This guide provides step-by-step instructions for refactoring the main page.js file to use the modularized components.

## Refactoring Steps

### Step 1: Update Imports

Replace the current imports at the top of page.js:

```jsx
// BEFORE
import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
// ...many more imports
// const SERVICES = { ... }
// const PAYMENT_URLS = { ... }

// AFTER
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

// Components
import StripeCheckout from '../components/StripeCheckout';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import LoadingDots from '../components/LoadingDots';
import SignatureField from '../components/SignatureField';
import CustomDatePicker from './components/CustomDatePicker';

// Icon imports (reduced)
import { 
  FaCheckCircle, FaShieldAlt, FaReceipt, FaUser, FaEnvelope, 
  FaPhone, FaCalendarAlt, FaUsers, FaBuilding, FaMapMarkerAlt,
  // ...other icons as needed
} from 'react-icons/fa';
import { BsStripe } from 'react-icons/bs';
import { SiVenmo, SiCashapp } from 'react-icons/si';

// Utils
import { handleNavigationClick } from '../lib/eventHandlers';
import { SERVICES, PAYMENT_URLS, calculateTotal, calculateDepositAmount, getCashAppInfo } from './utils/pricingUtils';
import { useFormValidation, validateEmail, validatePhone, validateAddress } from './utils/useFormValidation';
import EmailService from './utils/EmailService';

// Form components
import FieldGroup from './components/form/FieldGroup';
import PaymentOption from './components/form/PaymentOption';
import { PaymentConfirmation, PaymentConfirmationBanner } from './components/form/PaymentConfirmation';

// Modals
import GenreSelectionModal from './components/modals/GenreModal';
import PlaylistHelpModal from './components/modals/PlaylistHelpModal';
import { InfoModal, PaymentModal } from './components/modals/Modal';
```

### Step 2: Replace Form Initialization

Replace the form state management:

```jsx
// BEFORE
const [formData, setFormData] = useState({
  // ...many form fields
});
const [errors, setErrors] = useState({});

// AFTER
const validateFormData = (data) => {
  const errors = {};
  
  if (!data.clientName) errors.clientName = 'Name is required';
  if (!validateEmail(data.email)) errors.email = 'Valid email is required';
  if (!validatePhone(data.contactPhone)) errors.contactPhone = 'Valid phone number is required';
  // ...other validations
  
  return errors;
};

const initialFormState = {
  clientName: '',
  email: '',
  contactPhone: '',
  eventDate: null,
  eventLocation: '',
  eventType: '',
  eventStartTime: '',
  eventEndTime: '',
  includeLighting: false,
  includePhotography: false,
  includeVideoVisuals: false,
  specialRequests: '',
  signature: '',
  selectedGenres: [],
  streamingService: '',
  playlistLink: '',
  songRequests: '',
  paymentMethod: 'Stripe'
};

const {
  formData,
  errors,
  isSubmitting,
  setIsSubmitting,
  handleChange,
  handleCustomChange,
  validateForm,
  setFormData,
  setErrors
} = useFormValidation(initialFormState, validateFormData);
```

### Step 3: Replace Form Fields

Replace form field JSX:

```jsx
{/* BEFORE */}
<div className="mb-4">
  <label className="block mb-2 text-sm font-medium text-gray-700">
    Your Name <span className="text-red-500">*</span>
  </label>
  <div className="relative">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      <FaUser className="text-gray-500" />
    </div>
    <input
      type="text"
      name="clientName"
      className={`pl-10 w-full p-2.5 text-gray-900 border ${
        errors.clientName ? 'border-red-500' : 'border-gray-300'
      } rounded-lg focus:ring-blue-500 focus:border-blue-500`}
      placeholder="John Doe"
      value={formData.clientName}
      onChange={handleChange}
      required
    />
  </div>
  {errors.clientName && (
    <p className="mt-2 text-sm text-red-600">{errors.clientName}</p>
  )}
</div>

{/* AFTER */}
<FieldGroup
  label="Your Name"
  name="clientName"
  value={formData.clientName}
  onChange={handleChange}
  error={errors.clientName}
  placeholder="John Doe"
  required
  icon={<FaUser />}
/>
```

### Step 4: Replace Modals

Replace modal components:

```jsx
{/* BEFORE */}
{showGenreModal && (
  <GenreSelectionModal onClose={() => setShowGenreModal(false)} />
)}

{/* AFTER */}
{showGenreModal && (
  <GenreSelectionModal 
    selectedGenres={formData.selectedGenres} 
    onClose={() => setShowGenreModal(false)}
    onSave={(genres) => handleCustomChange('selectedGenres', genres)}
  />
)}
```

### Step 5: Update Calculation Functions

Replace calculation functions:

```jsx
// BEFORE
const calculateTotal = () => {
  // ... calculation logic
};

// AFTER
// No need for these functions, use imported ones
const total = calculateTotal(formData);
const depositAmount = calculateDepositAmount(total);
```

### Step 6: Update Email Sending

Replace email sending logic:

```jsx
// BEFORE
const sendConfirmationEmail = async (templateParams) => {
  // ... email sending logic
};

// AFTER
// Use EmailService
const emailParams = EmailService.formatBookingForEmail(formData, bookingId, {
  total,
  depositAmount,
  remainingBalance: total - depositAmount
});

const emailSent = await EmailService.sendConfirmationEmail(emailParams);
```

### Step 7: Test the Application

After making these changes:

1. Run the development server: `npm run dev`
2. Test the form submission flow
3. Test all modal interactions
4. Verify pricing calculations

## Additional Optimizations

1. **Memoization**: Add React.memo to performance-critical components
2. **Lazy Loading**: Consider lazy loading large components
3. **Persistent Form State**: Consider using localStorage for form state persistence
4. **Form Progress Tracking**: Implement a progress tracker component as suggested

## Resources

- [React Hook Form](https://react-hook-form.com/) - Consider for future form management
- [Next.js Documentation](https://nextjs.org/docs) - For more Next.js optimizations 