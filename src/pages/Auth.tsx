import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Form schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupStep1Schema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signupStep2Schema = z.object({
  investment_plan: z.string().min(1, 'Please select an investment plan'),
  start_date: z.string().min(1, 'Please select a start date'),
  referral_code: z.string().optional(),
});

const signupStep3Schema = z.object({
  experience_level: z.string().min(1, 'Please select your experience level'),
  how_heard_about: z.string().min(1, 'Please tell us how you heard about us'),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupStep1Data = z.infer<typeof signupStep1Schema>;
type SignupStep2Data = z.infer<typeof signupStep2Schema>;
type SignupStep3Data = z.infer<typeof signupStep3Schema>;

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');
  const [signupStep, setSignupStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [signupData, setSignupData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Signup forms
  const signupStep1Form = useForm<SignupStep1Data>({
    resolver: zodResolver(signupStep1Schema),
  });

  const signupStep2Form = useForm<SignupStep2Data>({
    resolver: zodResolver(signupStep2Schema),
  });

  const signupStep3Form = useForm<SignupStep3Data>({
    resolver: zodResolver(signupStep3Schema),
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupStep1 = (data: SignupStep1Data) => {
    setSignupData({ ...signupData, ...data });
    setSignupStep(2);
  };

  const handleSignupStep2 = (data: SignupStep2Data) => {
    setSignupData({ ...signupData, ...data });
    setSignupStep(3);
  };

  const handleSignupStep3 = async (data: SignupStep3Data) => {
    setIsLoading(true);
    try {
      const finalData = { ...signupData, ...data };
      const { error } = await signUp(finalData.email, finalData.password, {
        full_name: finalData.full_name,
        phone: finalData.phone,
        experience_level: finalData.experience_level,
        how_heard_about: finalData.how_heard_about,
        investment_plan: finalData.investment_plan,
        referral_code: finalData.referral_code,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Registration Successful!",
          description: "Please check your email to verify your account, then proceed to deposit funds.",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">NovAlgo Investments</h1>
          </div>
          <p className="text-muted-foreground">Secure your financial future with smart investments</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} className="w-full">
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      {...loginForm.register('email')}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...loginForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full button-gradient" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4">
                {/* Step 1: Basic Information */}
                {signupStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Step 1: Basic Information</h3>
                      <div className="flex justify-center mt-2">
                        <div className="flex space-x-2">
                          <div className="w-8 h-2 bg-primary rounded-full"></div>
                          <div className="w-8 h-2 bg-muted rounded-full"></div>
                          <div className="w-8 h-2 bg-muted rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={signupStep1Form.handleSubmit(handleSignupStep1)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          placeholder="Enter your full name"
                          {...signupStep1Form.register('full_name')}
                        />
                        {signupStep1Form.formState.errors.full_name && (
                          <p className="text-sm text-destructive">{signupStep1Form.formState.errors.full_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="Enter your phone number"
                          {...signupStep1Form.register('phone')}
                        />
                        {signupStep1Form.formState.errors.phone && (
                          <p className="text-sm text-destructive">{signupStep1Form.formState.errors.phone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup_email">Email</Label>
                        <Input
                          id="signup_email"
                          type="email"
                          placeholder="Enter your email"
                          {...signupStep1Form.register('email')}
                        />
                        {signupStep1Form.formState.errors.email && (
                          <p className="text-sm text-destructive">{signupStep1Form.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup_password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup_password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            {...signupStep1Form.register('password')}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {signupStep1Form.formState.errors.password && (
                          <p className="text-sm text-destructive">{signupStep1Form.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          {...signupStep1Form.register('confirmPassword')}
                        />
                        {signupStep1Form.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive">{signupStep1Form.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <Button type="submit" className="w-full button-gradient">
                        Next Step <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* Step 2: Investment Preferences */}
                {signupStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Step 2: Investment Preferences</h3>
                      <div className="flex justify-center mt-2">
                        <div className="flex space-x-2">
                          <div className="w-8 h-2 bg-primary rounded-full"></div>
                          <div className="w-8 h-2 bg-primary rounded-full"></div>
                          <div className="w-8 h-2 bg-muted rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={signupStep2Form.handleSubmit(handleSignupStep2)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="investment_plan">Preferred Investment Plan</Label>
                        <Select onValueChange={(value) => signupStep2Form.setValue('investment_plan', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your investment plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lite">Lite Package (KSH 10,000+)</SelectItem>
                            <SelectItem value="pro">Pro Package (KSH 30,000+)</SelectItem>
                            <SelectItem value="elite">Elite Package (KSH 50,000+)</SelectItem>
                          </SelectContent>
                        </Select>
                        {signupStep2Form.formState.errors.investment_plan && (
                          <p className="text-sm text-destructive">{signupStep2Form.formState.errors.investment_plan.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="start_date">Preferred Start Date</Label>
                        <Input
                          id="start_date"
                          type="date"
                          {...signupStep2Form.register('start_date')}
                        />
                        {signupStep2Form.formState.errors.start_date && (
                          <p className="text-sm text-destructive">{signupStep2Form.formState.errors.start_date.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="referral_code">Referral Code (Optional)</Label>
                        <Input
                          id="referral_code"
                          placeholder="Enter referral code if you have one"
                          {...signupStep2Form.register('referral_code')}
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSignupStep(1)}
                          className="flex-1"
                        >
                          <ArrowLeft className="mr-2 w-4 h-4" /> Back
                        </Button>
                        <Button type="submit" className="flex-1 button-gradient">
                          Next Step <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Step 3: Verification */}
                {signupStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Step 3: Verification</h3>
                      <div className="flex justify-center mt-2">
                        <div className="flex space-x-2">
                          <div className="w-8 h-2 bg-primary rounded-full"></div>
                          <div className="w-8 h-2 bg-primary rounded-full"></div>
                          <div className="w-8 h-2 bg-primary rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={signupStep3Form.handleSubmit(handleSignupStep3)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="experience_level">Investment Experience Level</Label>
                        <Select onValueChange={(value) => signupStep3Form.setValue('experience_level', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        {signupStep3Form.formState.errors.experience_level && (
                          <p className="text-sm text-destructive">{signupStep3Form.formState.errors.experience_level.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="how_heard_about">How did you hear about us?</Label>
                        <Select onValueChange={(value) => signupStep3Form.setValue('how_heard_about', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="friend_referral">Friend Referral</SelectItem>
                            <SelectItem value="online_search">Online Search</SelectItem>
                            <SelectItem value="advertisement">Advertisement</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {signupStep3Form.formState.errors.how_heard_about && (
                          <p className="text-sm text-destructive">{signupStep3Form.formState.errors.how_heard_about.message}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="terms_accepted"
                          checked={signupStep3Form.watch('terms_accepted')}
                          onCheckedChange={(checked) => signupStep3Form.setValue('terms_accepted', checked as boolean)}
                        />
                        <Label htmlFor="terms_accepted" className="text-sm">
                          I accept the{' '}
                          <a href="#" className="text-primary hover:underline">
                            Terms & Conditions
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-primary hover:underline">
                            Privacy Policy
                          </a>
                        </Label>
                      </div>
                      {signupStep3Form.formState.errors.terms_accepted && (
                        <p className="text-sm text-destructive">{signupStep3Form.formState.errors.terms_accepted.message}</p>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSignupStep(2)}
                          className="flex-1"
                        >
                          <ArrowLeft className="mr-2 w-4 h-4" /> Back
                        </Button>
                        <Button type="submit" className="flex-1 button-gradient" disabled={isLoading}>
                          {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;