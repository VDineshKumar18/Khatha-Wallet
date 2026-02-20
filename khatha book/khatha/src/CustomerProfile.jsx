import { useState, useEffect } from "react";
import axiosClient from "./api/axiosClient";
import "./CustomerApp.css";
import { User, Mail, Phone, CreditCard, Award } from "lucide-react";

function CustomerProfile({ customerId }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, [customerId]);

    const loadProfile = async () => {
        try {
            const res = await axiosClient.get(`/customers/${customerId}`);
            setProfile(res.data);
        } catch (err) {
            console.error("Failed to load profile", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading Profile...</div>;
    if (!profile) return <div className="error-text">Failed to load profile</div>;

    return (
        <div className="customer-profile-container fade-in">
            {/* 1. Header with Gradient Cover */}
            <div className="profile-cover">
                <div className="profile-header-content">
                    <div className="profile-avatar-large">
                        {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info-basic">
                        <h1>{profile.name}</h1>
                        <p>Customer ID: #CUST-{profile.id}</p>
                    </div>
                </div>
            </div>

            <div className="profile-grid">
                {/* 2. Left Column: Personal Details */}
                <div className="detail-card">
                    <div className="card-title">
                        <User size={20} className="text-blue-500" />
                        Personal Details
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                value={profile.name}
                                readOnly
                                className="read-only"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    value={profile.phone || "Not Provided"}
                                    readOnly
                                    className="read-only"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    value={profile.email || "Not Provided"}
                                    readOnly
                                    className="read-only"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Right Column: Account Status */}
                <div className="right-column">
                    <div className="info-card">
                        <div className="card-title">
                            <CreditCard size={20} className="text-purple-500" />
                            Account Status
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Outstanding Due</label>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: profile.dueAmount > 0 ? '#ef4444' : '#10b981' }}>
                                    ₹ {profile.dueAmount || 0}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Loyalty Points</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Award size={24} color="#eab308" />
                                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                                        {profile.loyaltyPoints || 0} pts
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="support-section" style={{ marginTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        <p>Need to update details? Contact your retailer.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustomerProfile;
