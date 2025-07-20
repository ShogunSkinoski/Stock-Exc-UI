'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order, Security } from '@/types/trading';
import { tradingService } from '@/lib/trading-service';
import { faker } from '@faker-js/faker';


interface OrderPlacementProps {
  clientId: string;
  security: Security;
  onOrderPlaced?: () => void;
}

export default function OrderPlacement({clientId, security, onOrderPlaced }: OrderPlacementProps) {
  const [activeTab, setActiveTab] = useState('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(security.currentPrice);
  const [randomOrderCount, setrandomOrderCount] = useState(0);
  const [singleOrder, setSingleOrder] = useState<Partial<Order>>({
    clientId: clientId,
    symbol: security.symbol,
    side: 'Buy',
    orderType: 'Limit',
    quantity: 1,
    price: security.currentPrice,
    timestamp: new Date().toISOString(),
    action: 'NEW'
  });

  useEffect(()=>{
    setSingleOrder({
      clientId: clientId,
      symbol: security.symbol,
      side: 'Buy',
      orderType: 'Limit',
      quantity: 1,
      price: security.currentPrice,
      timestamp: new Date().toISOString(),
      action: 'NEW'
    })
    setBulkOrders([{
      clientId: clientId,
      symbol: security.symbol,
      side: 'Buy',
      orderType: 'Limit',
      quantity: 1,
      price: security.currentPrice,
      timestamp: new Date().toISOString(),
      action: 'NEW'
    }])
  },[security, clientId])

  const [bulkOrders, setBulkOrders] = useState<Partial<Order>[]>([
    {
      clientId: clientId,
      symbol: security.symbol,
      side: 'Buy',
      orderType: 'Limit',
      quantity: 1,
      price: security.currentPrice,
      timestamp: new Date().toISOString(),
      action: 'NEW'
    }
  ]);
  const handleCurrentPrice = useCallback((data: { symbol: string; price: number; timestamp: string }) => {
    if (data.symbol === security.symbol) {
      setCurrentPrice(data.price);
    }
  }, [security.symbol]);
  const handleSingleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderToPlace: Order = {
        ...singleOrder,
        timestamp: new Date().toISOString(),
      } as Order;

      const result = await tradingService.placeOrder([orderToPlace]);
      
      if (result.success) {
        alert(`${singleOrder.side} order placed successfully!`);
        onOrderPlaced?.();
        
        setSingleOrder({
          ...singleOrder,
          quantity: 1,
          price: security.currentPrice,
          timestamp: new Date().toISOString()
        });
      } else {
        alert(`Failed to place order: ${result.message}`);
      }
    } catch (error) {
      alert('Error placing order');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBulkOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validOrders = bulkOrders
        .filter(order => order.quantity && order.quantity > 0 && order.price && order.price > 0)
        .map(order => ({
          ...order,
          timestamp: new Date().toISOString()
        })) as Order[];

      if (validOrders.length === 0) {
        alert('No valid orders to place');
        return;
      }

      const result = await tradingService.placeBulkOrders(validOrders);
      
      if (result.success) {
        alert(`All ${validOrders.length} orders placed successfully!`);
      } else {
        alert(`${result.message}`);
      }
      
      onOrderPlaced?.();
      
      setBulkOrders([{
        clientId: clientId,
        symbol: security.symbol,
        side: 'Buy',
        orderType: 'Limit',
        quantity: 1,
        price: security.currentPrice,
        timestamp: new Date().toISOString(),
        action: 'NEW'
      }]);
    } catch (error) {
      alert('Error placing bulk orders');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateMockData = () => {
    for(var orderCountIndex = 0; orderCountIndex < randomOrderCount; orderCountIndex++){
      var fakeOrder : Order = {
        clientId: bulkOrders[0].clientId!,
        symbol: security.symbol,
        orderType: bulkOrders[0].orderType!,
        side: bulkOrders[0].side!,
        quantity: faker.number.int({min:1, max:150}),
        price: faker.number.float({min: currentPrice - currentPrice*Math.random()*(0.1), max: currentPrice + currentPrice*Math.random()*0.1}),
        timestamp: new Date().toISOString(),
        action: 'NEW'
      };
      addBulkOrder(fakeOrder);
    }
  }

  const addBulkOrder = (order : Order) => {
    if(order.orderType === "Market"){
      setBulkOrders([...bulkOrders, {
        clientId: bulkOrders[0].clientId,
        symbol: security.symbol,
        side: bulkOrders[0].side,
        orderType: bulkOrders[0].orderType,
        quantity: order.quantity,
        price: security.currentPrice,
        timestamp: new Date().toISOString(),
        action: 'NEW'
      }]);
    }else {
      bulkOrders.push({
        clientId: bulkOrders[0].clientId,
        symbol: security.symbol,
        side: bulkOrders[0].side,
        orderType: bulkOrders[0].orderType,
        quantity: order.quantity,
        price: order.price,
        timestamp: new Date().toISOString(),
        action: 'NEW'
      });
      setBulkOrders(bulkOrders);
    }
    
  };

  const updateBulkOrder = (field: keyof Order, value: any) => {
    const updated = [...bulkOrders];
    updated[0] = { ...updated[0], [field]: value };
    setBulkOrders(updated);
  };

  const getTotalValue = (orders: Partial<Order>[]) => {
    return orders.reduce((total, order) => {
      const price = order.orderType === 'Market' ? currentPrice : (order.price || 0);
      return total + (price * (order.quantity || 0));
    }, 0);
  };
   useEffect(() => {
      const initializeConnection = async () => {
        try {
          if (!tradingService.isConnected) {
            await tradingService.connectToHub();
          }
          tradingService.onCurrentPrice(handleCurrentPrice);

         
        } catch (error) {
          console.error('Error initializing connection:', error);
        }
      };
  
      initializeConnection();
  
      return () => {
        tradingService.leaveMarketGroup(security.symbol);
      };
    }, [security.symbol,  handleCurrentPrice]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Orders - {security.symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Order</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <form onSubmit={handleSingleOrderSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Side</label>
                  <Select 
                    value={singleOrder.side} 
                    onValueChange={(value) => setSingleOrder({...singleOrder, side: value as 'Buy' | 'Sell'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buy">Buy</SelectItem>
                      <SelectItem value="Sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={singleOrder.orderType} 
                    onValueChange={(value) => setSingleOrder({...singleOrder, orderType: value as 'Market' | 'Limit'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Market">Market</SelectItem>
                      <SelectItem value="Limit">Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  value={singleOrder.quantity}
                  onChange={(e) => setSingleOrder({...singleOrder, quantity: parseInt(e.target.value)})}
                  min="1"
                  required
                />
              </div>

              {singleOrder.orderType === 'Limit' && (
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    value={singleOrder.price}
                    onChange={(e) => setSingleOrder({...singleOrder, price: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              )}

              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Price:</span>
                  <span className="font-medium">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Value:</span>
                  <span className="font-medium">
                    ${getTotalValue([singleOrder]).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full ${singleOrder.side === 'Buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isSubmitting ? 'Placing Order...' : `${singleOrder.side} ${singleOrder.quantity} shares`}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="bulk">
            <form onSubmit={handleBulkOrderSubmit} className="space-y-4">
              <div className="space-y-3">

                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Order</Badge>
                      
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Select 
                        value={bulkOrders[0].side} 
                        onValueChange={(value) => updateBulkOrder('side', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Buy">Buy</SelectItem>
                          <SelectItem value="Sell">Sell</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select 
                        value={bulkOrders[0].orderType} 
                        onValueChange={(value) => updateBulkOrder('orderType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Market">Market</SelectItem>
                          <SelectItem value="Limit">Limit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        placeholder="Random Data Count"
                        value={randomOrderCount}
                        onChange={(e) => setrandomOrderCount(parseInt(e.target.value))}
                        min="1"
                      />

                     <Button 
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateMockData()}
                      >
                        Generate Mock Trades
                    </Button>
                    </div>
                  </div>

              </div>

             

              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Orders:</span>
                  <span className="font-medium">{bulkOrders.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Value:</span>
                  <span className="font-medium">
                    ${getTotalValue(bulkOrders).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Placing Orders...' : `Place ${bulkOrders.length} Orders`}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 