export type DeliveryRequest = {
  pickup: string;
  destination: string;
  item: string;
};

export type DeliveryQuote = {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  amount: number | null;
  currency: string;
  etaMinutes: number | null;
  status: 'available' | 'unavailable' | 'error';
};

export interface LogisticsProvider {
  id: string;
  name: string;
  getQuote(request: DeliveryRequest): Promise<DeliveryQuote[]>;
  createDelivery(request: DeliveryRequest, quote: DeliveryQuote): Promise<{ providerDeliveryId: string }>;
  getStatus(providerDeliveryId: string): Promise<string>;
  cancelDelivery(providerDeliveryId: string): Promise<void>;
}
