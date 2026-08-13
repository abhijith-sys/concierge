/**
 * Reserved adapter boundary for payment gateways (Stripe, Razorpay, etc.).
 */
export interface PaymentGateway {
  createIntent(amount: number, currency: string, metadata?: Record<string, string>): Promise<{ id: string }>;
}

export const PaymentsGateway: PaymentGateway = {
  async createIntent() {
    throw new Error("Payments integration is not configured");
  },
};
