import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Candy, ShoppingBag, ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

interface Purchase {
  id: string;
  quantity: number;
  total_price: number;
  purchased_at: string;
  status: OrderStatus;
  estimated_delivery: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_phone: string | null;
  sweets: {
    name: string;
    category: string;
    image_url: string | null;
  } | null;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: Package },
  preparing: { label: 'Preparing', color: 'bg-purple-500', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-orange-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: Clock },
};

const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];

const Purchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchPurchases();
    }
  }, [user, authLoading, navigate]);

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id,
        quantity,
        total_price,
        purchased_at,
        status,
        estimated_delivery,
        delivery_address,
        delivery_city,
        delivery_phone,
        sweets (
          name,
          category,
          image_url
        )
      `)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
    } else {
      setPurchases((data as unknown as Purchase[]) || []);
    }
    setIsLoading(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center warm-gradient">
        <div className="w-16 h-16 rounded-full candy-gradient flex items-center justify-center shadow-glow animate-bounce-soft">
          <Candy className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.total_price), 0);
  const activeOrders = purchases.filter(p => p.status !== 'delivered' && p.status !== 'cancelled');

  const getStatusIndex = (status: OrderStatus) => {
    return statusOrder.indexOf(status);
  };

  return (
    <div className="min-h-screen warm-gradient">
      <Header />

      <main className="container py-8 space-y-8">
        <div className="space-y-1">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
          <h1 className="font-display text-3xl font-bold">My Orders</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-card border-0 candy-gradient">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold text-primary-foreground">{purchases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 gold-gradient">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Candy className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm">Total Spent</p>
                  <p className="text-3xl font-bold text-primary-foreground">${totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 bg-gradient-to-br from-blue-500 to-blue-600">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm">Active Orders</p>
                  <p className="text-3xl font-bold text-primary-foreground">{activeOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders with Tracking */}
        {activeOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Active Orders
            </h2>
            <div className="grid gap-4">
              {activeOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon;
                const currentIndex = getStatusIndex(order.status);
                
                return (
                  <Card key={order.id} className="shadow-card border-0 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Product Info */}
                        <div className="flex gap-4 flex-1">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                            {order.sweets?.image_url ? (
                              <img
                                src={order.sweets.image_url}
                                alt={order.sweets.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Candy className="w-8 h-8 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-semibold truncate">
                              {order.sweets?.name || 'Deleted item'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Qty: {order.quantity} • ${Number(order.total_price).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Ordered: {format(new Date(order.purchased_at), 'MMM d, yyyy h:mm a')}
                            </p>
                            
                            {/* Delivery Info */}
                            {order.delivery_address && (
                              <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                <span>{order.delivery_address}, {order.delivery_city}</span>
                              </div>
                            )}
                            {order.delivery_phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{order.delivery_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Tracker */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-4">
                            <Badge className={`${statusConfig[order.status].color} text-white border-0`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[order.status].label}
                            </Badge>
                            {order.estimated_delivery && (
                              <span className="text-xs text-muted-foreground">
                                Est. delivery: {format(new Date(order.estimated_delivery), 'MMM d')}
                              </span>
                            )}
                          </div>
                          
                          {/* Progress Steps */}
                          <div className="flex items-center gap-1">
                            {statusOrder.slice(0, -1).map((status, index) => {
                              const isCompleted = index <= currentIndex;
                              const isCurrent = index === currentIndex;
                              
                              return (
                                <div key={status} className="flex items-center flex-1">
                                  <div 
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                                      isCompleted 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-muted text-muted-foreground'
                                    } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                  >
                                    {index + 1}
                                  </div>
                                  {index < statusOrder.length - 2 && (
                                    <div 
                                      className={`flex-1 h-1 mx-1 rounded ${
                                        index < currentIndex ? 'bg-primary' : 'bg-muted'
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                            <span>Pending</span>
                            <span>Confirmed</span>
                            <span>Preparing</span>
                            <span>Shipped</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Orders */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">No orders yet</h3>
                <p className="text-muted-foreground">
                  Start shopping to see your order history here!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase) => {
                  const StatusIcon = statusConfig[purchase.status].icon;
                  
                  return (
                    <div 
                      key={purchase.id} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                        {purchase.sweets?.image_url ? (
                          <img
                            src={purchase.sweets.image_url}
                            alt={purchase.sweets.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Candy className="w-5 h-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{purchase.sweets?.name || 'Deleted item'}</p>
                        <p className="text-sm text-muted-foreground">
                          {purchase.quantity} × ${(Number(purchase.total_price) / purchase.quantity).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="font-semibold">${Number(purchase.total_price).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(purchase.purchased_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      
                      <Badge className={`${statusConfig[purchase.status].color} text-white border-0 shrink-0`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[purchase.status].label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Purchases;