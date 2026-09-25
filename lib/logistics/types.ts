export type DeliveryMode = 'send' | 'pick';

export type Address = {
  address: string;
  digitalAddress?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
};

export type DeliveryRequest = {
  mode: DeliveryMode;
  pickup: Address;
  destination: Address;
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

export type TrackingPoint = {
  latitude: number;
  longitude: number;
  recordedAt: string;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
};

export type TrackingSnapshot = {
  status: string;
  point: TrackingPoint | null;
  source: 'provider' | 'device' | 'none';
};

export interface LogisticsProvider {
  id: string;
  name: string;
  getQuote(request: DeliveryRequest): Promise<DeliveryQuote[]>;
  createDelivery(request: DeliveryRequest, quote: DeliveryQuote): Promise<{ providerDeliveryId: string }>;
  getStatus(providerDeliveryId: string): Promise<string>;
  trackDelivery(providerDeliveryId: string): Promise<TrackingSnapshot>;
  cancelDelivery(providerDeliveryId: string): Promise<void>;
}
