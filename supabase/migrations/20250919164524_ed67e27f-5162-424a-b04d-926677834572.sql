-- Fix security warnings by setting search_path for functions

-- Update handle_new_user function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_wallet_balance function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;