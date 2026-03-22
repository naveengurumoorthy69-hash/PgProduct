import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

export function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate('/login');
      return;
    }

    // Check if we have a session or if we're processing a recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      const hash = window.location.hash;
      if (!session && !hash.includes('type=recovery') && !hash.includes('access_token')) {
        // If no session and no recovery hash, redirect to login
        navigate('/login');
      } else {
        setCheckingSession(false);
        // If there's an error in the hash, display it
        if (hash.includes('error_description=')) {
          const errorDesc = new URLSearchParams(hash.substring(1)).get('error_description');
          if (errorDesc) setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        }
      }
    });

    // Listen for the recovery event specifically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const { error } = await supabase!.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccessMessage('Password updated successfully! Redirecting to login...');
      
      // Sign out the user so they have to log in with their new password
      await supabase!.auth.signOut();
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating password');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans bg-slate-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg">
            <Building className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Update Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Please enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-start">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 flex items-start">
                <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            <div className="space-y-1">
              <Input
                label="New Password"
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                minLength={6}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
