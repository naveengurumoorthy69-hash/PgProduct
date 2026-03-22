import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import logoUrl from '../logo.png';

export function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    // If the user lands on the login page but has a recovery hash (e.g. from a fallback redirect)
    // redirect them to the update password page so they can complete the flow.
    if (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token')) {
      navigate('/update-password' + window.location.hash);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email) {
          setError('Please enter your email address.');
          setLoading(false);
          return;
        }
        const { error } = await supabase!.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setSuccessMessage('Password reset link sent! Please check your email inbox.');
        setIsForgotPassword(false);
      } else if (email && (isSignUp ? name : true)) {
        await login(name, email, password, isSignUp);
        
        // If sign up, check if we need to show a verification message
        if (isSignUp && supabase) {
          // In Supabase, if email confirmation is enabled, the session won't be created immediately.
          // We can check if the user is actually logged in by checking the session.
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setSuccessMessage('Account created successfully! Please check your email to verify your account before logging in.');
            setIsSignUp(false);
            setPassword('');
            return;
          }
        }
        
        navigate('/select-pg');
      } else {
        setError('Please fill in all required fields.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Side - Branding/Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop"
            alt="Modern building interior"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-end p-16 text-white w-full">
          <div className="mb-8">
            <div className="bg-indigo-600/90 backdrop-blur-sm p-4 rounded-2xl inline-block mb-6 shadow-2xl border border-white/10">
              <Building className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4 leading-tight">
              Manage your PG <br />with confidence.
            </h1>
            <p className="text-lg text-slate-300 max-w-md leading-relaxed">
              The complete operating system for your paying guest business. Track tenants, collect rent, and monitor expenses in one place.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span>Trusted by 1000+ PG Owners</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Secure & Reliable</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden w-full h-48 relative mb-8 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop"
              alt="Modern building interior"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-sm border border-white/10">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">PG Manager</h1>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
              {isForgotPassword ? 'Reset password' : isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500">
              {isForgotPassword
                ? "Enter your email and we'll send you a reset link."
                : isSignUp
                ? 'Enter your details to get started.'
                : 'Please enter your details to sign in.'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-start animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700 flex items-start animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {!isForgotPassword && (!supabase || isSignUp) && (
              <div className="space-y-1">
                <Input
                  label="Full Name"
                  id="name"
                  name="name"
                  type="text"
                  required={!supabase || isSignUp}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
            )}

            <div className="space-y-1">
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            {!isForgotPassword && supabase && (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
                size="lg"
                disabled={loading}
              >
                {loading
                  ? 'Please wait...'
                  : isForgotPassword
                  ? 'Send Reset Link'
                  : supabase
                  ? isSignUp
                    ? 'Create Account'
                    : 'Sign In'
                  : 'Sign in to Dashboard'}
              </Button>
            </div>

            {supabase && (
              <div className="mt-8 text-center text-sm text-slate-600">
                {isForgotPassword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center w-full gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!supabase && (
              <div className="mt-6 text-center text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p>Running in local mock mode. Add Supabase env vars to enable real authentication.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
