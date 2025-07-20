'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketUpdate, Order, Security, TradeMessage } from '@/types/trading';
import { tradingService } from '@/lib/trading-service';
import PriceChart from '@/components/stocks/trading/PriceChart';
import OrderPlacement from '@/components/stocks/trading/OrderPlacement';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

const columns : ColumnDef<TradeMessage>[] = [
  {
    accessorKey: "tradeId",
    header: "Trade ID"
  },
  {
    accessorKey: "symbol",
    header: "Symbol"
  },
  {
    accessorKey: "buyerClientId",
    header: "Buyer Client ID"
  },
  {
    accessorKey: "sellerClientId",
    header: "Seller Client ID"
  },
  {
    accessorKey: "price",
    header: "Price"
  },
  {
    accessorKey: "quantity",
    header: "Quantity"
  }
]

export default function Home() {
 const [securities, setSecurities] = useState<Security[]>([]);
  const [selectedSecurity, setSelectedSecurity] = useState<Security>({
          id: 1,
          symbol: 'GOOGL',
          companyName: 'Alphabet Inc',
          currentPrice: 2800,
          previousPrice: 2795,
          volume: 1000000,
          lastUpdated: new Date().toISOString(),
          isActive: true
        });

  const [selectedClient, setSelectedClient] = useState<string>("BI ZRT")
  const clients: string[] = ["BI ZRT", "BI VKF", "BI FTH"];

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [tradeHistory, settradeHistory] = useState<TradeMessage[]>([])
  const [newTrades, setNewTrades] = useState<TradeMessage[]>([])
  useEffect(() => {
    initializePage();
    
    return () => {
      tradingService.disconnect();
    };
  }, []);

  const initializePage = async () => {
    try {
      const securitiesData = await tradingService.getSecurities();
      setSecurities(securitiesData);
      
      if (securitiesData.length > 0) {
        setSelectedSecurity(securitiesData[0]);
      }

      await tradingService.connectToHub();
      setConnected(true);
    } catch (error) {
      console.error('Error initializing page:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(()=>{},[selectedClient])
  
  useEffect(()=>{
    if(tradeHistory === undefined) settradeHistory(newTrades)
    settradeHistory([...tradeHistory, ...newTrades])
  }, [newTrades])
  const handleMarketUpdate = useCallback((update: { symbol: string; currentPrice: number; trades: TradeMessage[]; lastUpdated: string }) => {
      if (update.symbol === selectedSecurity.symbol) {
        setNewTrades(update.trades)
      }
    }, [selectedSecurity.symbol]);

  const handleSecurityChange = (symbol: string) => {
    const security = securities.find(s => s.symbol === symbol);
    if (security) {
      setSelectedSecurity(security);
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(cl => cl === clientId);
    if(client){
      setSelectedClient(client);
    }
  }

  const handleOrderPlaced = () => {
    console.log('Order placed successfully');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading trading interface...</div>
        </div>
      </div>
    );
  }

  if (!selectedSecurity) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">No securities available</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trading Interface</h1>
        <div className="flex items-center space-x-4">
          <div className='flex items-center flex-row space-x-4'>
            <p>Accounts:</p>
              <Select value={selectedClient} onValueChange={handleClientChange}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clients.map((clientId) => (
                  <SelectItem key={clientId} value={clientId}>
                    {clientId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center flex-row space-x-4'>
          <p>Securities:</p>
          <Select value={selectedSecurity.symbol} onValueChange={handleSecurityChange}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {securities.map((security) => (
                <SelectItem key={security.symbol} value={security.symbol}>
                  {security.symbol} - {security.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <div className={`flex items-center space-x-2 ${connected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`} />
            <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <PriceChart security={selectedSecurity} handleMarketUpdate={handleMarketUpdate} />
        </div>

        <div className="lg:col-span-1">
          <OrderPlacement 
            clientId={selectedClient}
            security={selectedSecurity} 
            onOrderPlaced={handleOrderPlaced}
          />
        </div>
      </div>
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Trade Log</span>
                  </CardTitle>
              </CardHeader>
              <CardContent className='h-90'>
                          <DataTable columns={columns} data={tradeHistory} scrollAreaClassName="w-full h-96"   key={"datatable-bor"}></DataTable>
              </CardContent>
            </Card>
    </div>
  );
}
