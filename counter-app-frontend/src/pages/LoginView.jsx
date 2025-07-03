import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import properties from '../properties/properties';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(properties.api.baseURL+'/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('userId', data.userId);
      setIsLoading(false);
      window.location.href = '/dashboard'; // or use React Router navigation
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 backdrop-blur-sm border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {/* Google SVG */}
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
  <path
    fill="#4285F4"
    d="M21.35 11.1H12v2.9h5.35c-.25 1.35-.96 2.5-2.05 3.28v2.7h3.3c1.92-1.77 3.03-4.38 3.03-7.4 0-.68-.07-1.35-.2-2z"
  />
  <path
    fill="#34A853"
    d="M12 22c2.7 0 4.96-.9 6.6-2.42l-3.3-2.7c-.92.6-2.1.94-3.3.94-2.54 0-4.7-1.7-5.46-4h-3.3v2.52A9.99 9.99 0 0012 22z"
  />
  <path
    fill="#FBBC05"
    d="M6.54 13.82A5.99 5.99 0 016 12c0-.63.1-1.25.28-1.82V7.66h-3.3A9.997 9.997 0 002 12c0 1.64.4 3.18 1.1 4.34l3.44-2.52z"
  />
  <path
    fill="#EA4335"
    d="M12 6c1.48 0 2.8.5 3.83 1.48l2.85-2.84C16.95 2.6 14.7 2 12 2 7.56 2 3.83 4.98 2.1 8.66l3.44 2.52C7.3 8.7 9.46 6 12 6z"
  />
</svg>

                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {/* Facebook SVG */}
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8v-6.93H7.9v-2.87H10V9.91c0-2.05 1.2-3.18 3.05-3.18.88 0 1.8.15 1.8.15v1.98h-1.02c-1 0-1.3.62-1.3 1.26v1.52h2.22l-.35 2.87h-1.87v6.93c4.56-.93 8-4.96 8-9.8z" />
</svg>

                Facebook
              </button>
            </div>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-100">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                Sign up for free
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
