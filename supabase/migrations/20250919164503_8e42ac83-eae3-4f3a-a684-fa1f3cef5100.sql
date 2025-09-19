-- Create database schema for NovAlgo Investments platform

-- Create enum types
CREATE TYPE public.deposit_status AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.investment_status AS ENUM ('active', 'pending', 'completed', 'cancelled');
CREATE TYPE public.package_type AS ENUM ('lite', 'pro', 'elite');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'investment', 'profit', 'referral_commission');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(user_id),
  experience_level TEXT,
  how_heard_about TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallets table for balance tracking
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  main_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  referral_bonus_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  total_invested DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  total_profits DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investment packages table
CREATE TABLE public.investment_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  package_type package_type NOT NULL UNIQUE,
  minimum_amount DECIMAL(15,2) NOT NULL,
  multiplier DECIMAL(5,2) DEFAULT 3.00 NOT NULL,
  duration_days INTEGER DEFAULT 365 NOT NULL,
  description TEXT,
  features TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default investment packages
INSERT INTO public.investment_packages (name, package_type, minimum_amount, description, features) VALUES
('Lite Package', 'lite', 10000.00, 'Perfect for beginners starting their investment journey', ARRAY['3x Returns', 'Basic Support', 'Monthly Reports']),
('Pro Package', 'pro', 30000.00, 'Advanced investment package for serious investors', ARRAY['3x Returns', 'Priority Support', 'Weekly Reports', 'Advanced Analytics']),
('Elite Package', 'elite', 50000.00, 'Premium investment package for high-net-worth individuals', ARRAY['3x Returns', 'Dedicated Support', 'Daily Reports', 'Premium Analytics', 'Exclusive Opportunities']);

-- Create deposits table
CREATE TABLE public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  transaction_reference TEXT NOT NULL,
  status deposit_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  phone_number TEXT NOT NULL,
  status withdrawal_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.investment_packages(id),
  amount DECIMAL(15,2) NOT NULL,
  expected_return DECIMAL(15,2) NOT NULL,
  status investment_status DEFAULT 'active' NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  profit_distributed DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table for comprehensive history
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID, -- References deposit, withdrawal, investment, etc.
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_amount DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  total_deposits DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for deposits
CREATE POLICY "Users can view their own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for withdrawals
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for investments
CREATE POLICY "Users can view their own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for referrals
CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Create RLS policies for investment packages (public read)
CREATE POLICY "Anyone can view investment packages" ON public.investment_packages FOR SELECT USING (true);

-- Create functions for automatic profile and wallet creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate unique referral code
  DECLARE
    ref_code TEXT;
  BEGIN
    ref_code := 'NA' || UPPER(SUBSTRING(MD5(NEW.id::text), 1, 6));
    
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, phone, email, referral_code)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email,
      ref_code
    );
    
    -- Create wallet
    INSERT INTO public.wallets (user_id) VALUES (NEW.id);
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update wallet balance based on transaction type
    IF NEW.type = 'deposit' THEN
      UPDATE public.wallets 
      SET main_balance = main_balance + NEW.amount,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'withdrawal' THEN
      UPDATE public.wallets 
      SET main_balance = main_balance - NEW.amount,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'investment' THEN
      UPDATE public.wallets 
      SET main_balance = main_balance - NEW.amount,
          total_invested = total_invested + NEW.amount,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'profit' THEN
      UPDATE public.wallets 
      SET main_balance = main_balance + NEW.amount,
          total_profits = total_profits + NEW.amount,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'referral_commission' THEN
      UPDATE public.wallets 
      SET referral_bonus_balance = referral_bonus_balance + NEW.amount,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for wallet balance updates
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();