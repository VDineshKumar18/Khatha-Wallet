import { useState } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import "./LoginModal.css";
import { sendOtp, verifyOtp, signupRetailer, sendCustomerOtp, verifyCustomerOtp } from "./api/authApi";
import logoIcon from "./assets/logo-icon.png";

function LoginModal({ onClose, onSuccess, onCustomerSuccess, initialMode = "retailer" }) {
  const [mode, setMode] = useState(initialMode); // 'retailer' | 'customer'

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= SEND OTP =================
  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError("");

      if (mode === "retailer") {
        await sendOtp(email);
      } else {
        const res = await sendCustomerOtp(email);
        // OTP auto-fill removed for production/user testing
      }

      setOtpSent(true);
      setShowSignup(false);
    } catch (err) {
      if (mode === "retailer") {
        setOtpSent(false);
        setShowSignup(true);
        setError(err?.message || "Email not registered. Please sign up.");
      } else {
        // ✅ CUSTOMER: If not found, show registration fields immediately
        if (err.status === 404 || err.message?.includes("not registered") || err.message?.includes("Email not registered")) {
          setOtpSent(false);
          setShowSignup(true);
          setMode("customer_register");
          setError("New Customer? Enter details to join.");
        } else {
          setError(err?.message || "Login failed");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ================= LOGIN =================
  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      if (mode === "retailer") {
        const res = await verifyOtp(email, otp);
        const data = res?.data || res;

        const retailerId =
          data?.retailerId || data?.id || data?.data?.retailerId;

        if (!retailerId) {
          throw new Error("Invalid OTP");
        }

        const retailerName = data.name || data.retailerName || "";

        sessionStorage.setItem("loggedIn", "true");
        sessionStorage.setItem("retailerId", retailerId);
        sessionStorage.setItem("retailerEmail", data.email || email);
        if (retailerName) {
          sessionStorage.setItem("retailerName", retailerName);
        }

        onSuccess(); // Retailer Success
      } else {
        // Customer Login
        const response = await verifyCustomerOtp(email, otp);

        // ✅ CHECK IF NEW USER
        if (response.isNewUser) {
          setOtpSent(false); // Hide OTP field
          setShowSignup(true); // Reuse signup state for "Join Shop" flow
          setMode("customer_register"); // Special internal mode
          return;
        }

        onCustomerSuccess(response); // Customer Success (pass accounts list)
      }

    } catch (err) {
      setError(err?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ================= SIGN UP (Retailer) / REGISTER (Customer) =================
  const handleSignup = async () => {
    try {
      setLoading(true);
      setError("");

      // RETAILER SIGNUP
      if (mode === "retailer") {
        await signupRetailer({ email, name, phone });
        toast.success("Signup successful. Please login.");
        setShowSignup(false);
        setOtpSent(false);
        return;
      }

      // CUSTOMER REGISTRATION (Handled by ShopSelection in parent usually, but here we might need a step)
      // Actually, for simplicity, let's pass a special flag to parent to show ShopSelection
      if (mode === "customer_register") {
        // Verify name/phone entered
        if (!name || !phone) {
          throw new Error("Name and Phone are required");
        }

        // We need to SELECT SHOP. 
        // Instead of doing it here, let's pass the "Pre-Auth" data to the parent 
        // and let the parent show the ShopSelection screen.
        onCustomerSuccess({ isNewUser: true, email, name, phone });
      }

    } catch (err) {
      setError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="login-page-container">
      {/* 🌑 OVERLAY BACKGROUND */}
      <div className="login-modal-overlay" onClick={onClose}></div>

      {/* 📦 MODAL CARD */}
      <div className="login-modal-card animate-scale">
        {/* 🔴 CLOSE BUTTON (Absolute Top Right of Card) */}
        <button className="page-close-btn" onClick={onClose}>✕</button>

        {/* 🎨 LEFT PANEL (Branding) */}
        <div className="login-left-panel">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon-box">🔷</div>
              <h2>Khatha Wallet</h2>
            </div>

            <h1 className="hero-title">
              The Digital Supermarket<br />for Your Town.
            </h1>

            <div className="login-features-list">
              <div className="login-feature-item">
                <span className="login-feature-icon">🛍️</span>
                <div>
                  <strong>Click & Collect</strong>
                  <p>Families order from home, pick up when ready.</p>
                </div>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-icon">🏪</span>
                <div>
                  <strong>Your Shop Online</strong>
                  <p>Show your catalog to the whole town instantly.</p>
                </div>
              </div>
              <div className="login-feature-item">
                <span className="login-feature-icon">📒</span>
                <div>
                  <strong>Digital Khatha</strong>
                  <p>Manage customer credits & billing in one place.</p>
                </div>
              </div>
            </div>

            {/* Background decoration (optional) */}
            <div className="bg-decoration"></div>
          </div>
        </div>

        {/* 📝 RIGHT PANEL (Login Form) */}
        <div className="login-right-panel">
          <div className="login-form-wrapper">

            <div className="form-header">
              <h2>Login</h2>
              <p>Welcome back! Please enter your details to continue.</p>
            </div>

            {/* TOGGLE SWITCH */}
            <div className="role-toggle">
              <button
                className={mode === 'retailer' ? 'active' : ''}
                onClick={() => { setMode("retailer"); setOtpSent(false); setError(""); }}
              >
                Retailer
              </button>
              <button
                className={mode === 'customer' || mode === 'customer_register' ? 'active' : ''}
                onClick={() => { setMode("customer"); setOtpSent(false); setError(""); }}
              >
                Customer
              </button>
            </div>

            {/* FORM INPUTS */}
            <div className="input-group">
              <label>Email Address or Phone</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent || loading}
                />
              </div>
            </div>

            {otpSent && (
              <div className="input-group animate-slide-down">
                <label>OTP Code</label>
                <div className="otp-container">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      className="otp-box"
                      type="text"
                      maxLength={1}
                      value={otp[index] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isNaN(val)) return;

                        const newOtp = otp.split('');
                        while (newOtp.length < 6) newOtp.push(''); // Ensure length
                        newOtp[index] = val;
                        const finalOtp = newOtp.join('').slice(0, 6);
                        setOtp(finalOtp);

                        // Auto focus next
                        if (val && index < 5) {
                          document.getElementById(`otp-input-${index + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[index] && index > 0) {
                          document.getElementById(`otp-input-${index - 1}`)?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").slice(0, 6);
                        if (pasted && /^\d+$/.test(pasted)) {
                          setOtp(pasted);
                        }
                      }}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SIGNUP FIELDS */}
            {showSignup && (mode === "retailer" || mode === "customer_register") && (
              <div className="signup-fields animate-slide-down">
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {error && <p className="error-msg">{error}</p>}

            {/* ACTION BUTTONS */}
            <div className="action-buttons">
              {!otpSent && !showSignup && (
                <button className="primary-btn" onClick={handleSendOtp} disabled={loading || !email}>
                  {loading ? "Sending..." : "Send OTP"} →
                </button>
              )}

              {otpSent && (
                <button className="primary-btn" onClick={handleLogin} disabled={loading || otp.length < 6}>
                  {loading ? "Verifying..." : "Login"}
                </button>
              )}

              {showSignup && (
                <button
                  className="primary-btn"
                  onClick={handleSignup}
                  disabled={loading || !name || !phone}
                >
                  {mode === 'customer_register' ? 'Verify & Join' : 'Sign Up'}
                </button>
              )}
            </div>

            {/* SOCIAL LOGIN */}
            <div className="divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <div className="social-buttons">
              <button
                className="google-btn"
                onClick={() => {
                  setLoading(true);
                  // SIMULATED GOOGLE AUTH
                  setTimeout(() => {
                    setLoading(false);
                    if (!email) {
                      toast.info("Simulating Google Login... (Select an account)");
                      setEmail("demo.retailer@gmail.com");
                      handleSendOtp();
                    } else {
                      toast.success(`Welcome back! Logged in with ${email}`);
                      handleSendOtp();
                    }
                  }, 1500);
                }}
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="google-icon-img" />
                <span>Continue with Google</span>
              </button>
            </div>

            <p className="footer-link">
              Don't have an account? <span className="link-text" onClick={() => setShowSignup(true)}>Start free trial</span>
            </p>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default LoginModal;
