import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Candy, ShoppingCart, Minus, Plus, Trash2, ArrowLeft, Banknote, MapPin, Phone } from 'lucide-react';

const Cart = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { items, itemCount, totalPrice, isLoading, updateQuantity, removeFromCart, checkout, refreshCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const isAddressValid = address.trim().length > 0 && city.trim().length > 0 && phone.trim().length > 0;

  const handleCheckout = async () => {
    if (!isAddressValid) return;
    
    setIsCheckingOut(true);
    const success = await checkout({ address, city, phone });
    setIsCheckingOut(false);
    
    if (success) {
      navigate('/purchases');
    } else {
      // Refresh cart to get updated stock info
      await refreshCart();
    }
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

  return (
    <div className="min-h-screen warm-gradient">
      <Header />

      <main className="container py-8 space-y-8">
        <div className="space-y-1">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            Your Cart
          </h1>
        </div>

        {items.length === 0 ? (
          <Card className="shadow-card border-0">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">Your cart is empty</h3>
              <p className="text-muted-foreground">
                Add some delicious sweets to get started!
              </p>
              <Link to="/">
                <Button variant="candy">Browse Sweets</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const isOverStock = item.quantity > item.sweets.quantity;
                
                return (
                  <Card key={item.id} className="shadow-card border-0 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0">
                          {item.sweets.image_url ? (
                            <img
                              src={item.sweets.image_url}
                              alt={item.sweets.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Candy className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-display font-semibold truncate">{item.sweets.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.sweets.category}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.sweets.quantity}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({item.sweets.quantity} available)
                              </span>
                            </div>

                            <p className="font-bold text-lg">
                              ${(Number(item.sweets.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          {isOverStock && (
                            <p className="mt-2 text-sm text-destructive">
                              Only {item.sweets.quantity} available. Please reduce quantity.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary & Address */}
            <div className="lg:col-span-1 space-y-4">
              {/* Delivery Address */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter your street address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Enter your city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="shadow-card border-0 sticky top-24">
                <CardHeader>
                  <CardTitle className="font-display">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({itemCount})</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-candy-mint">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <div className="w-full flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                    <Banknote className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                    </div>
                  </div>
                  <Button
                    variant="candy"
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || !isAddressValid || items.some(i => i.quantity > i.sweets.quantity)}
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    {isCheckingOut ? 'Processing...' : 'Place Order (COD)'}
                  </Button>
                  {!isAddressValid && items.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Please fill in all delivery details
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
