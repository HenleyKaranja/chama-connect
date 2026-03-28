
-- Add rejection_reason to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add rejection_reason to loans
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add name and type columns to wallets for multiple wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Main Wallet';
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'savings';

-- Allow users to create their own wallets
CREATE POLICY "Users can create own wallets" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to update own wallet
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
