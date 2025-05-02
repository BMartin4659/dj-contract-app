# DJ Contract App Modularization Guide

## File Structure Overview

This document outlines the modularization approach for the DJ Contract App, breaking down the large page.js file into smaller, more maintainable components.

### Created Directories

- `app/components/form` - Form field components 
- `app/components/modals` - Modal components
- `app/utils` - Utility functions and hooks

### Key Files and Their Purpose

#### Utils
- `app/utils/pricingUtils.js` - Constants and pricing calculation functions
- `app/utils/useFormValidation.js` - Custom form validation hook
- `app/utils/EmailService.js` - Email service for sending confirmation emails

#### Form Components
- `app/components/form/FieldGroup.js` - Reusable form field component
- `app/components/form/PaymentOption.js` - Payment method selection component
- `app/components/form/PaymentConfirmation.js` - Payment confirmation banners

#### Modals
- `app/components/modals/GenreModal.js` - Music genre selection modal
- `app/components/modals/PlaylistHelpModal.js` - Instructions for sharing playlists
- `app/components/modals/Modal.js` - Reusable modal component with InfoModal and PaymentModal exports

## Usage Example 

To use the modularized components, update imports in the main page.js file:

```jsx
// Import utilities
import { SERVICES, PAYMENT_URLS, calculateTotal, calculateDepositAmount } from './utils/pricingUtils';
import { useFormValidation } from './utils/useFormValidation';
import EmailService from './utils/EmailService';

// Import form components
import FieldGroup from './components/form/FieldGroup';
import PaymentOption from './components/form/PaymentOption';
import { PaymentConfirmation, PaymentConfirmationBanner } from './components/form/PaymentConfirmation';

// Import modals
import GenreSelectionModal from './components/modals/GenreModal';
import PlaylistHelpModal from './components/modals/PlaylistHelpModal';
import { InfoModal, PaymentModal } from './components/modals/Modal';
```

## Implementation Steps

1. Replace inline components with imports
2. Initialize the form using `useFormValidation` hook
3. Replace form fields with `FieldGroup` components
4. Replace modals with modal components
5. Update payment logic to use the utilities

## Performance Benefits

- Improved performance by using memoized components
- Reduced bundle size through code splitting
- Cleaner code that's easier to maintain
- Better separation of concerns