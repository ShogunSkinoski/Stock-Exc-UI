import { Order, PriceUpdate, MarketUpdate, TradeMessage, Security } from '@/types/trading';
import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from '@microsoft/signalr';

const API_BASE_URL = 'http://localhost:5068'; 

export class TradingService {
  private hubConnection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async connectToHub(): Promise<void> {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/marketDataHub`, {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    try {
      await this.hubConnection.start();
      console.log('Connected to MarketDataHub');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Error connecting to hub:', error);
      this.attemptReconnect();
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectToHub();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  async joinMarketGroup(symbol: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('JoinMarketGroup', symbol);
      console.log(`Joined market group for ${symbol}`);
    }
  }

  async leaveMarketGroup(symbol: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('LeaveMarketGroup', symbol);
      console.log(`Left market group for ${symbol}`);
    }
  }

  async requestCurrentPrice(symbol: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('RequestCurrentPrice', symbol);
    }
  }

  async requestPriceHistory(symbol: string, fromDate: string, toDate: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('GetPriceHistory', symbol, fromDate, toDate);
    }
  }

  onPriceUpdate(callback: (update: PriceUpdate) => void): void {
    this.hubConnection?.on('PriceUpdate', callback);
  }

  onMarketUpdate(callback: (update: MarketUpdate) => void): void {
    this.hubConnection?.on('MarketUpdate', callback);
  }

  onCurrentPrice(callback: (data: { symbol: string; price: number; timestamp: string }) => void): void {
    this.hubConnection?.on('CurrentPrice', callback);
  }

  onPriceHistory(callback: (data: { symbol: string; history: any[] }) => void): void {
    this.hubConnection?.on('PriceHistory', callback);
  }

  onTradeMessage(callback: (trade: TradeMessage) => void): void {
    this.hubConnection?.on('TradeMessage', callback);
  }

  async placeOrder(order: Order[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, message: 'Order placed successfully' };
      } else {
        const error = await response.text();
        return { success: false, message: error || 'Failed to place order' };
      }
    } catch (error) {
      console.error('Error placing order:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async placeBulkOrders(orders: Order[]): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.placeOrder(orders);
      
      const success = result.success
      
      return {
        success,
        message: `$${orders.length} orders placed successfully`
      };
    } catch (error) {
      console.error('Error placing bulk orders:', error);
      return { success: false, message: 'Failed to place bulk orders' };
    }
  }

  async getSecurities(): Promise<Security[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/securities`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch securities');
      }
    } catch (error) {
      console.error('Error fetching securities:', error);
      // Return mock data as fallback
      return [
        {
          id: 1,
          symbol: 'GOOGL',
          companyName: 'Alphabet Inc',
          currentPrice: 2800,
          previousPrice: 2795,
          volume: 1000000,
          lastUpdated: new Date().toISOString(),
          isActive: true
        },
        {
          id: 2,
          symbol: 'TSLA',
          companyName: 'Tesla Inc.',
          currentPrice: 800.00,
          previousPrice: 790.00,
          volume: 0,
          lastUpdated: new Date().toISOString(),
          isActive: true
        }
      ];
    }
  }

  disconnect(): void {
    this.hubConnection?.stop();
    this.hubConnection = null;
  }

  get isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }
}

export const tradingService = new TradingService(); 