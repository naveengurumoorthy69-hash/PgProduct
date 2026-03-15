import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (email && (isSignUp ? name : true)) {
        await login(name, email, password, isSignUp);
        
        // If sign up, check if we need to show a verification message
        if (isSignUp && supabase) {
          // In Supabase, if email confirmation is enabled, the session won't be created immediately.
          // We can check if the user is actually logged in by checking the session.
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setError('Account created! Please check your email to verify your account before logging in.');
            setIsSignUp(false);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {!logoError ? (
            <img 
              src={logoUrl} 
              alt="PG Manager Logo" 
              className="w-16 h-16 object-contain rounded-xl shadow-sm" 
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg">
              <Building className="w-10 h-10 text-white" />
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Welcome to PG Manager
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to manage your Paying Guest business
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {(!supabase || isSignUp) && (
              <div>
                <Input
                  label="Full Name"
                  id="name"
                  name="name"
                  type="text"
                  required={!supabase || isSignUp}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-12"
                />
              </div>
            )}

            <div>
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="h-12"
              />
            </div>

            {supabase && (
              <div>
                <Input
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12"
                />
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full h-12 text-base font-medium" size="lg" disabled={loading}>
                {loading ? 'Please wait...' : (supabase ? (isSignUp ? 'Create Account' : 'Sign In') : 'Sign in to Dashboard')}
              </Button>
            </div>
            
            {supabase ? (
              <div className="mt-6 text-center text-sm text-slate-600">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button 
                  type="button" 
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            ) : (
              <div className="mt-6 text-center text-xs text-slate-500">
                <p>Running in local mock mode. Add Supabase env vars to enable real authentication.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
