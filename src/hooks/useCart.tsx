import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  sweet_id: string;
  quantity: number;
  sweets: {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
    image_url: string | null;
  };
}

interface DeliveryAddress {
  address: string;
  city: string;
  phone: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  isLoading: boolean;
  addToCart: (sweetId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (deliveryAddress: DeliveryAddress) => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        sweet_id,
        quantity,
        sweets (
          id,
          name,
          category,
          price,
          quantity,
          image_url
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cart:', error);
    } else {
      setItems((data as unknown as CartItem[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (sweetId: string, quantity = 1) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Please sign in',
        description: 'You need to sign in to add items to cart.',
      });
      return;
    }

    try {
      // Check if item already in cart
      const existingItem = items.find((item) => item.sweet_id === sweetId);

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        await updateQuantity(existingItem.id, newQuantity);
      } else {
        // Add new item
        const { error } = await supabase.from('cart_items').insert({
          user_id: user.id,
          sweet_id: sweetId,
          quantity,
        });

        if (error) throw error;

        toast({
          title: 'Added to cart',
          description: 'Item has been added to your cart.',
        });

        await fetchCart();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity } : item
        )
      );
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== cartItemId));

      toast({
        title: 'Removed from cart',
        description: 'Item has been removed from your cart.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
    }
  };

  const checkout = async (deliveryAddress: DeliveryAddress): Promise<boolean> => {
    if (!user || items.length === 0) return false;

    try {
      // Validate stock for all items
      for (const item of items) {
        if (item.quantity > item.sweets.quantity) {
          toast({
            variant: 'destructive',
            title: 'Insufficient stock',
            description: `Only ${item.sweets.quantity} units of ${item.sweets.name} available.`,
          });
          return false;
        }
      }

      // Create purchases and update stock for each item
      for (const item of items) {
        // Create purchase record
        const { error: purchaseError } = await supabase.from('purchases').insert({
          sweet_id: item.sweet_id,
          user_id: user.id,
          quantity: item.quantity,
          total_price: Number(item.sweets.price) * item.quantity,
          delivery_address: deliveryAddress.address,
          delivery_city: deliveryAddress.city,
          delivery_phone: deliveryAddress.phone,
        });

        if (purchaseError) throw purchaseError;

        // Update sweet quantity
        const { error: updateError } = await supabase
          .from('sweets')
          .update({ quantity: item.sweets.quantity - item.quantity })
          .eq('id', item.sweet_id);

        if (updateError) throw updateError;
      }

      // Clear cart after successful checkout
      await clearCart();

      toast({
        title: 'Order placed!',
        description: `Successfully ordered ${items.length} item(s) for $${totalPrice.toFixed(2)}. Pay on delivery.`,
      });

      return true;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Checkout failed',
        description: error.message,
      });
      return false;
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.sweets.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalPrice,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        checkout,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
