-- Add address fields to purchases table
ALTER TABLE public.purchases 
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_city TEXT,
ADD COLUMN delivery_phone TEXT;