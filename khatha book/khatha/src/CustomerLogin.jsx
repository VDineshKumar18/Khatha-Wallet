import { useState } from "react";
import axiosClient from "./api/axiosClient";
import "./LoginModal.css"; // Reuse existing styles

function CustomerLogin({ onLoginSuccess, onBack }) {
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!phone || phone.length < 10) {
            setError("Enter valid phone number");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // ✅ Call new Auth Endpoint
            const res = await axiosClient.post("/customer-auth/login", { phone });

            // Expected response: List of { customerId, retailerId, retailerName, ... }
            onLoginSuccess(res.data);
        } catch (err) {
            setError(err.response?.data || "Login failed. Check phone number.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-modal-overlay">
            <div className="login-modal">
                <button className="close-btn" onClick={onBack}>✕</button>

                <h2>🛍️ Customer Login</h2>
                <p>Enter your phone number to check your orders</p>

                {error && <p className="error-msg">{error}</p>}

                <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="login-input"
                />

                <button
                    className="login-btn"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? "Checking..." : "Continue"}
                </button>
            </div>
        </div>
    );
}

export default CustomerLogin;
