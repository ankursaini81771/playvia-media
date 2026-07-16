import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

interface RazorpayResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  error?: string;
}

export const useRazorpay = () => {
  const { user, updateProfile } = useAuth();
  const [processing, setProcessing] = useState(false);

  const startPremiumPayment = async (): Promise<RazorpayResponse> => {
    if (!user) {
      return { success: false, error: 'User must be signed in to purchase Premium' };
    }

    setProcessing(true);

    return new Promise((resolve) => {
      // In a real application, you would:
      // 1. Call your backend to create a Razorpay Order: e.g. axios.post('/create-order')
      // 2. Import Razorpay Checkout: import RazorpayCheckout from 'react-native-razorpay';
      // 3. Invoke Checkout: RazorpayCheckout.open(options).then(data => ...).catch(err => ...)
      
      // We simulate this asynchronous process here to test the flow end-to-end:
      setTimeout(async () => {
        try {
          const mockOrderId = `order_${Math.random().toString(36).substr(2, 9)}`;
          const mockPaymentId = `pay_${Math.random().toString(36).substr(2, 9)}`;

          // Update the user's status in Supabase
          const { error } = await updateProfile({ is_premium: true });

          if (error) throw error;

          // Record payment transaction in DB for auditing
          // Note: In a production app, this would be updated via a Webhook from Razorpay
          await supabase.from('ad_payments').insert({
            amount: 299.00, // Premium monthly price e.g. Rs 299
            payment_status: 'success',
            razorpay_order_id: mockOrderId,
          });

          setProcessing(false);
          resolve({
            success: true,
            orderId: mockOrderId,
            paymentId: mockPaymentId,
          });
        } catch (err: any) {
          setProcessing(false);
          resolve({
            success: false,
            error: err.message || 'Payment transaction failed',
          });
        }
      }, 2000);
    });
  };

  const startAdCampaignPayment = async (amount: number, adId: string): Promise<RazorpayResponse> => {
    if (!user) {
      return { success: false, error: 'User must be signed in to make a payment' };
    }

    setProcessing(true);

    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const mockOrderId = `order_${Math.random().toString(36).substr(2, 9)}`;
          const mockPaymentId = `pay_${Math.random().toString(36).substr(2, 9)}`;

          // Update ad status in Supabase to active and record payment
          const { error: updateError } = await supabase
            .from('ads')
            .update({ status: 'active' })
            .eq('id', adId);

          if (updateError) throw updateError;

          const { error: paymentError } = await supabase.from('ad_payments').insert({
            ad_id: adId,
            amount: amount,
            payment_status: 'success',
            razorpay_order_id: mockOrderId,
          });

          if (paymentError) throw paymentError;

          setProcessing(false);
          resolve({
            success: true,
            orderId: mockOrderId,
            paymentId: mockPaymentId,
          });
        } catch (err: any) {
          setProcessing(false);
          resolve({
            success: false,
            error: err.message || 'Payment transaction failed',
          });
        }
      }, 2000);
    });
  };

  return {
    processing,
    startPremiumPayment,
    startAdCampaignPayment,
  };
};
