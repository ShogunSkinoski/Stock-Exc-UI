'use client';

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Security, TradeMessage } from '@/types/trading';
import { tradingService } from '@/lib/trading-service';
import { format } from 'date-fns';

interface PriceChartProps {
  security: Security;
  handleMarketUpdate: any;
}

interface PricePoint {
  timestamp: string;
  price: number;
  volume?: number;
}

export default function PriceChart({ security, handleMarketUpdate }: PriceChartProps) {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState(security.currentPrice);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const handlePriceUpdate = useCallback((update: { symbol: string; price: number; timestamp: string }) => {
    if (update.symbol === security.symbol) {
      setCurrentPrice(update.price);
      
      setPriceData(prev => {
        const newPoint: PricePoint = {
          timestamp: update.timestamp,
          price: update.price,
          volume: 0
        };
        
        const updated = [...prev, newPoint];
        return updated.slice(-100);
      });
    }
  }, [security.symbol]);



  const handleCurrentPrice = useCallback((data: { symbol: string; price: number; timestamp: string }) => {
    if (data.symbol === security.symbol) {
      setCurrentPrice(data.price);
    }
  }, [security.symbol]);

  const handlePriceHistory = useCallback((data: { symbol: string; history: any[] }) => {
    if (data.symbol === security.symbol) {
      const historyPoints: PricePoint[] = data.history.map(item => ({
        timestamp: item.timestamp,
        price: item.price,
        volume: item.volume
      }));
      setPriceData(historyPoints);
      setLoading(false);
    }
  }, [security.symbol]);

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        if (!tradingService.isConnected) {
          await tradingService.connectToHub();
        }

        tradingService.onPriceUpdate(handlePriceUpdate);
        tradingService.onMarketUpdate(handleMarketUpdate);
        tradingService.onCurrentPrice(handleCurrentPrice);
        tradingService.onPriceHistory(handlePriceHistory);

        await tradingService.joinMarketGroup(security.symbol);
        await tradingService.requestCurrentPrice(security.symbol);
        
        const fromDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const toDate = new Date();
        await tradingService.requestPriceHistory(
          security.symbol,
          fromDate.toISOString(),
          toDate.toISOString()
        );

        setConnected(true);
      } catch (error) {
        console.error('Error initializing connection:', error);
        setLoading(false);
      }
    };

    initializeConnection();

    return () => {
      console.log(security.symbol)
      tradingService.leaveMarketGroup(security.symbol);
    };
  }, [security.symbol, handlePriceUpdate, handleMarketUpdate, handleCurrentPrice, handlePriceHistory]);

  useEffect(() => {
    if (priceData.length === 0 && !loading) {
      setPriceData([{
        timestamp: new Date().toISOString(),
        price: currentPrice,
        volume: 0
      }]);
    }
  }, [currentPrice, priceData.length, loading]);

  const priceChange = currentPrice - security.previousPrice;
  const priceChangePercent = (priceChange / security.previousPrice) * 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Chart - {security.symbol}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Price Chart - {security.symbol}</span>
            <div className={`flex items-center space-x-1 ${connected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`} />
              <span className="text-xs">{connected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
            <div className={`text-sm ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm:ss')}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={priceChange >= 0 ? '#16a34a' : '#dc2626'}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 