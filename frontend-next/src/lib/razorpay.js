export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

const isTestKey = (keyId) => typeof keyId === 'string' && keyId.startsWith('rzp_test_');

/**
 * When order_id is set, Razorpay reads amount from the order — do not pass amount again.
 * In test mode, UPI QR often fails unless you use success@razorpay; card is more reliable.
 */
export async function openRazorpayCheckout({
  keyId,
  orderId,
  amount,
  currency = 'INR',
  name = 'ApplyUniNow',
  description,
  prefill = {},
  onSuccess,
  onDismiss,
}) {
  await loadRazorpayScript();

  const testMode = isTestKey(keyId);
  const options = {
    key: keyId,
    currency,
    name,
    description,
    order_id: orderId,
    prefill: {
      ...prefill,
      // Avoid invalid UPI prefill from malformed emails/usernames
      contact: prefill.contact || undefined,
    },
    theme: { color: '#171717' },
    handler: (response) => {
      onSuccess?.(response);
      resolveCheckout(response);
    },
    modal: {
      ondismiss: () => {
        onDismiss?.();
        rejectCheckout(new Error('Payment cancelled'));
      },
    },
  };

  // Test keys: prefer card/netbanking — UPI QR frequently shows "invalid UPI id" in test mode.
  if (testMode) {
    options.method = {
      card: true,
      netbanking: true,
      upi: false,
      wallet: false,
    };
  } else if (!orderId) {
    options.amount = amount;
  }

  let resolveCheckout;
  let rejectCheckout;

  return new Promise((resolve, reject) => {
    resolveCheckout = resolve;
    rejectCheckout = reject;
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      const msg =
        response?.error?.description ||
        response?.error?.reason ||
        'Payment failed';
      reject(new Error(msg));
    });
    rzp.open();
  });
}

export { isTestKey };
