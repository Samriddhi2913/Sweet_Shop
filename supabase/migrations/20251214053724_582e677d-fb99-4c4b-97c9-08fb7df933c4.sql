-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');

-- Add status column to purchases
ALTER TABLE public.purchases 
ADD COLUMN status public.order_status NOT NULL DEFAULT 'pending';

-- Add estimated delivery date
ALTER TABLE public.purchases 
ADD COLUMN estimated_delivery DATE;