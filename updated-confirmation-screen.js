// Replace the confirmation screen with this code
// Updated to handle Stripe payment differently

const PAYMENT_URLS = {
  VENMO: 'https://venmo.com/u/Bobby-Martin-64',
  CASHAPP: 'https://cash.app/$LiveCity',
  PAYPAL: 'https://paypal.me/bmartin4659'
};

// Component for the confirmation screen
return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center',
    position: 'relative',
    width: '100%',
    background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
    color: 'white'
  }}>
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      maxWidth: '90%',
      width: '600px'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <span role="img" aria-label="celebration" style={{ fontSize: '64px' }}>🎉</span>
      </div>
      <h1 style={{ 
        color: '#3b82f6', 
        marginBottom: '1.5rem', 
        fontSize: '2.5rem', 
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
      }}>
        Booking Submitted!
      </h1>
      <p style={{ 
        fontSize: '1.25rem', 
        lineHeight: '1.6',
        marginBottom: '2rem',
        color: '#333',
        fontWeight: '500'
      }}>
        Thank you! Your DJ booking request has been submitted successfully. You will receive a confirmation email shortly.
        We look forward to celebrating with you!
      </p>

      {/* Payment Method Information */}
      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#333',
          fontWeight: 'bold'
        }}>
          Payment Method: {formData.paymentMethod}
        </p>
        <p style={{ 
          marginTop: '0.5rem', 
          fontSize: '1rem', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          Click the button below to complete your deposit or full payment and secure your event date.
        </p>
      </div>

      {/* Main Button - Different for Stripe vs Other Payment Methods */}
      {formData.paymentMethod === 'Stripe' ? (
        <button
          onClick={() => {
            // For Stripe, we'll trigger the Stripe checkout component
            // This needs to be implemented in the main app component
            if (typeof window !== 'undefined') {
              // This will trigger the parent component to show Stripe
              window.dispatchEvent(new CustomEvent('showStripeCheckout'));
            }
          }}
          style={{
            backgroundColor: '#6772E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px 32px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginTop: '0.5rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(103, 114, 229, 0.39)',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Process Payment with Credit Card</span>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Secure checkout using Stripe</span>
          </div>
        </button>
      ) : (
        <button
          onClick={() => {
            // Use direct navigation based on payment method
            if (formData.paymentMethod === 'Venmo') {
              window.location.href = 'https://venmo.com/u/Bobby-Martin-64';
            } else if (formData.paymentMethod === 'CashApp') {
              window.location.href = 'https://cash.app/$LiveCity';
            } else if (formData.paymentMethod === 'PayPal') {
              window.location.href = 'https://paypal.me/bmartin4659';
            } else if (formData.paymentMethod === 'Stripe') {
              // For Stripe, try to find and click the hidden Stripe button in the parent page
              const stripeButton = document.querySelector('[data-stripe-button="true"]');
              if (stripeButton) {
                stripeButton.click();
              } else {
                // Fallback: try to dispatch a custom event to show Stripe
                try {
                  window.parent.document.dispatchEvent(new CustomEvent('showStripe'));
                } catch (e) {
                  // Last resort: redirect to a specific URL or alert
                  alert('Please use the Stripe payment option in the previous screen');
                  history.back();
                }
              }
            }
          }}
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px 32px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginTop: '2rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(0, 118, 255, 0.39)'
          }}
        >
          Secure Your Event Date
        </button>
      )}
    </div>
  </div>
); 