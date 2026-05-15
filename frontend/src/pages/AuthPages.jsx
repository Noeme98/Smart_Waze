import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { apiClient } from "../services/apiClient";
import { getApiBaseUrl } from "../config/apiBaseUrl";
import logoTwo from "../assets/2.png";

// ============================================
// API Configuration
// ============================================
const API_BASE_URL = getApiBaseUrl();

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().toLowerCase().startsWith("<html")) {
      throw new Error(
        "The app received a web page instead of API data. Set VITE_API_URL to http://localhost:8000/api (with /api) and make sure the Django backend is running on port 8000."
      );
    }
    throw new Error("Invalid response from server.");
  }
}

// ============================================
// Auth Context
// ============================================
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// ============================================
// API Service Functions
// ============================================
const authAPI = {
  loginCitizen: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/citizen/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || data.detail || "Login failed");
    }
    return data;
  },

  loginAuthority: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/authority/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || data.detail || "Login failed");
    }
    return data;
  },

  loginAdmin: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/admin/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || data.detail || "Login failed");
    }
    return data;
  },

  registerCitizen: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/citizens/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || data.detail || "Registration failed");
    }
    return data;
  },

  refreshToken: async (refreshToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || data.detail || "Token refresh failed");
    }
    return data;
  },

  logout: async (refreshToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      // Don't throw error if logout fails - we'll clear tokens anyway
      // Silently handle any status code (200, 401, 404, etc.)
      if (response.ok) {
        return await readJsonResponse(response);
      }
      // Suppress error - logout succeeded locally
      return { success: true, local_only: true };
    } catch (error) {
      // Logout should always succeed on frontend even if backend fails
      // Don't log error - this is expected behavior
      return { success: true, local_only: true };
    }
  },
};

// ============================================
// Auth Provider Component
// ============================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem("refresh_token");
    const storedUser = localStorage.getItem("user");
    
    if (storedRefreshToken && storedUser) {
      setUser(JSON.parse(storedUser));
      refreshAccessToken(storedRefreshToken);
    } else {
      setLoading(false);
    }
  }, []);

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await authAPI.refreshToken(refreshToken);
      if (response.success) {
        setAccessToken(response.data.access);
        // Sync with API client
        apiClient.setTokens(response.data.access, refreshToken);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, userType = "citizen") => {
    try {
      const response =
        userType === "citizen"
          ? await authAPI.loginCitizen(email, password)
          : userType === "authority"
            ? await authAPI.loginAuthority(email, password)
            : await authAPI.loginAdmin(email, password);

      if (response.success) {
        const { user, tokens } = response.data;

        const enrichedUser = {
          ...user,
          type: userType,
        };

        setUser(enrichedUser);
        setAccessToken(tokens.access);

        localStorage.setItem("user", JSON.stringify(enrichedUser));
        apiClient.setTokens(tokens.access, tokens.refresh);

        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.registerCitizen({
        name: userData.fullName,
        email: userData.email,
        password: userData.password,
        confirm_password: userData.confirmPassword,
      });

      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");

    // Always clear local state first (security priority)
    setUser(null);
    setAccessToken(null);

    // Clear tokens from API client (this also clears localStorage)
    apiClient.clearTokens();

    // Try to notify backend (fire and forget - don't wait for response)
    if (refreshToken) {
      authAPI.logout(refreshToken).catch(() => {
        // Silently ignore - logout succeeded locally
      });
    }
  };

  const value = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// Toast Notification Component
// ============================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50`}>
      <Icon size={20} />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/80 hover:text-white text-xl">
        ×
      </button>
    </div>
  );
};

// ============================================
// Main Auth Pages Component (with redirect on login)
// ============================================
const AuthPages = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    userType: "citizen",
  });

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (searchParams.get("admin") === "1") {
      navigate("/auth/admin", { replace: true });
    }
  }, [searchParams, navigate]);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const validateLoginForm = () => {
    const newErrors = {};
    
    if (!loginData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!loginData.password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors = {};
    
    if (!signupData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!signupData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!signupData.password) {
      newErrors.password = "Password is required";
    } else if (signupData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async () => {
    if (!validateLoginForm()) return;
    
    setLoading(true);
    setErrors({});
    
    const result = await login(
      loginData.email,
      loginData.password,
      loginData.userType
    );
    
    setLoading(false);
    
    if (result.success) {
      showToast("Login successful! Redirecting...", "success");
      // The redirect will be handled automatically by the AuthRoute in App.jsx
    } else {
      showToast(result.error || "Login failed. Please try again.", "error");
    }
  };

  const handleSignupSubmit = async () => {
    if (!validateSignupForm()) return;
    
    setLoading(true);
    setErrors({});
    
    const result = await register(signupData);
    
    setLoading(false);
    
    if (result.success) {
      showToast("Registration successful! Please login.", "success");
      setIsLogin(true);
      setSignupData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } else {
      showToast(result.error || "Registration failed. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B163C] via-[#2D2570] to-[#0A0E27] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="relative w-full max-w-5xl flex bg-[#1E1C3A]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2E2470] to-[#1B163C] p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <img
              src={logoTwo}
              alt="Safewayz"
              className="h-20 w-auto mb-4"
            />

            <div className="space-y-4 text-gray-300">
              <p className="text-sm leading-relaxed">
                SAFEWAYZ is an infrastructure and hazard report management system designed to help 
                local governments and citizens monitor, report, and respond to urban issues efficiently.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            {[
              "Real-time report tracking",
              "Direct communication with authorities",
              "Traffic Simulation",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">
                  ✓
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 lg:p-12 relative z-10">
          <div className="flex flex-col lg:hidden mb-8 items-center">
            <img
              src={logoTwo}
              alt="Safewayz"
              className="h-16 w-auto"
            />
          </div>

          <div className="flex gap-2 bg-[#0F0C1F] p-1 rounded-xl mb-8">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrors({});
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                isLogin
                  ? "bg-gradient-to-r from-[#2E2470] to-[#4338ca] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrors({});
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? "bg-gradient-to-r from-[#2E2470] to-[#4338ca] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {isLogin ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back!</h2>
                <p className="text-gray-400 text-sm">Login to access your account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Login As
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginData({ ...loginData, userType: "citizen" })}
                    className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg font-medium transition-all ${
                      loginData.userType === "citizen"
                        ? "bg-purple-600 text-white"
                        : "bg-[#0F0C1F] text-gray-400 hover:text-white"
                    }`}
                  >
                    Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginData({ ...loginData, userType: "authority" })}
                    className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg font-medium transition-all ${
                      loginData.userType === "authority"
                        ? "bg-purple-600 text-white"
                        : "bg-[#0F0C1F] text-gray-400 hover:text-white"
                    }`}
                  >
                    Authority
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleLoginSubmit()}
                    placeholder="Enter your email"
                    className={`w-full bg-[#0F0C1F] text-white pl-10 pr-4 py-3 rounded-lg border ${
                      errors.email ? "border-red-500" : "border-gray-700"
                    } focus:border-purple-500 focus:outline-none transition-all`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleLoginSubmit()}
                    placeholder="Enter your password"
                    className={`w-full bg-[#0F0C1F] text-white pl-10 pr-12 py-3 rounded-lg border ${
                      errors.password ? "border-red-500" : "border-gray-700"
                    } focus:border-purple-500 focus:outline-none transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-[#0F0C1F]" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot password?
                </button>
              </div>

              <button
                onClick={handleLoginSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#2E2470] to-[#4338ca] hover:from-[#3730a3] hover:to-[#4f46e5] text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login to Account"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-gray-400 text-sm">Join us to report and track issues</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    placeholder="Juan Dela Cruz"
                    className={`w-full bg-[#0F0C1F] text-white pl-10 pr-4 py-3 rounded-lg border ${
                      errors.fullName ? "border-red-500" : "border-gray-700"
                    } focus:border-purple-500 focus:outline-none transition-all`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="juan@example.com"
                    className={`w-full bg-[#0F0C1F] text-white pl-10 pr-4 py-3 rounded-lg border ${
                      errors.email ? "border-red-500" : "border-gray-700"
                    } focus:border-purple-500 focus:outline-none transition-all`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      placeholder="********"
                      className={`w-full bg-[#0F0C1F] text-white pl-10 pr-12 py-3 rounded-lg border ${
                        errors.password ? "border-red-500" : "border-gray-700"
                      } focus:border-purple-500 focus:outline-none transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={signupData.confirmPassword}
                      onChange={(e) =>
                        setSignupData({ ...signupData, confirmPassword: e.target.value })
                      }
                      placeholder="********"
                      className={`w-full bg-[#0F0C1F] text-white pl-10 pr-12 py-3 rounded-lg border ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-700"
                      } focus:border-purple-500 focus:outline-none transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSignupSubmit}
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-[#2E2470] to-[#4338ca] hover:from-[#3730a3] hover:to-[#4f46e5] text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPages;
