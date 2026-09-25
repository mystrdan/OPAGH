import type { DeliveryQuote, DeliveryRequest, LogisticsProvider } from './types';

export const mockProvider: LogisticsProvider = {
  id: 'mock',
  name: 'Provider adapter (development)',
  async getQuote(_request: DeliveryRequest): Promise<DeliveryQuote[]> {
    return [
      {
        id: 'mock-standard',
        providerId: 'mock',
        providerName: 'Development provider',
        serviceName: 'Standard delivery',
        amount: null,
        currency: 'GHS',
        etaMinutes: null,
        status: 'available',
      },
    ];
  },
  async createDelivery(_request, quote) {
    return { providerDeliveryId: quote.id };
  },
  async getStatus(_providerDeliveryId) {
    return 'pending';
  },
  async cancelDelivery(_providerDeliveryId) {},
};
