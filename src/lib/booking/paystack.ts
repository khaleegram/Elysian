
'use client';
declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PaystackParams {
    email: string;
    amount: number;
}

export function initializePaystack({ email, amount }: PaystackParams): Promise<string> {
    
    return new Promise((resolve, reject) => {
        if (!amount || amount <= 0) {
            reject(new Error("Payment amount must be greater than zero."));
            return;
        }
        
        const paystackHandler = window.PaystackPop.setup({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
            email: email,
            amount: amount * 100, // Paystack amount is in kobo
            ref: '' + Date.now(),
            onClose: function () {
                reject(new Error("Payment popup closed by user."));
            },
            callback: function (response: { reference: string }) {
                // Payment was successful, resolve the promise with the reference
                resolve(response.reference);
            },
        });
        paystackHandler.openIframe();
    });
}
