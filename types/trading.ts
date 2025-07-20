export interface Security {
  id: number;
  symbol: string;
  companyName: string;
  currentPrice: number;
  previousPrice: number;
  volume: number;
  lastUpdated: string;
  isActive: boolean;
}

export interface Order {
  id?: number;
  clientId: string;
  symbol: string;
  orderType: 'Market' | 'Limit';
  side: 'Buy' | 'Sell';
  quantity: number;
  price: number;
  timestamp: string;
  action: string;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface MarketUpdate {
  symbol: string;
  currentPrice: number;
  trades: TradeMessage[];
  lastUpdated: string;
}

export interface TradeMessage {
  tradeId: number;
  symbol: string;
  buyOrderId: number;
  sellOrderId: number;
  buyerClientId: string;
  sellerClientId: string;
  quantity: number;
  price: number;
  executedAt: string;
} 