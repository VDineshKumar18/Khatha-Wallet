import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getRetailerProfile, updateRetailerProfile } from "./api/retailerApi";
import { User, Phone, Mail, Save, ArrowLeft, Loader2, MapPin, CreditCard, Pencil, X, PiggyBank } from "lucide-react";
import "./RetailerProfile.css";

function RetailerProfile({ onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(10);
  const [schemeTargetAmount, setSchemeTargetAmount] = useState(6000); // ✅ New State
  const [schemeMonthlyAmount, setSchemeMonthlyAmount] = useState(500); // ✅ New State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getRetailerProfile();
      const data = res.data;
      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setShopName(data.shopName || "");
      setUpiId(data.upiId || sessionStorage.getItem("retailer_upi_id") || "");
      setPayeeName(data.payeeName || sessionStorage.getItem("retailer_payee_name") || "");
      setLatitude(data.latitude || null);
      setLongitude(data.longitude || null);
      setDeliveryRadiusKm(data.deliveryRadiusKm || 10);
      setSchemeTargetAmount(data.schemeTargetAmount || 6000); // ✅ Load
      setSchemeMonthlyAmount(data.schemeMonthlyAmount || 500); // ✅ Load

      // Update session for sidebar display
      if (data.name) sessionStorage.setItem("retailerName", data.name);
      if (data.email) sessionStorage.setItem("retailerEmail", data.email);

    } catch (err) {
      console.error("Failed to load profile", err);

      if (err.response && err.response.status === 404) {
        toast.error("⚠️ Session expired or Retailer not found.\nPlease log out and log in again.");
      }

      // Fallback to session
      setName(sessionStorage.getItem("retailerName") || "");
      setEmail(sessionStorage.getItem("retailerEmail") || "");
      setUpiId(localStorage.getItem("retailer_upi_id") || "");
      setPayeeName(localStorage.getItem("retailer_payee_name") || "");
    } finally {
      setLoading(false);
    }
  };

  const detectMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("❌ Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setDetectingLocation(false);
        toast.success("✅ Location detected successfully!");
      },
      (error) => {
        setDetectingLocation(false);
        toast.error(`❌ Could not detect location: ${error.message}\n\nPlease ensure location permissions are enabled.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to Session Storage (For immediate access in modals)
      sessionStorage.setItem("retailer_upi_id", upiId);
      sessionStorage.setItem("retailer_payee_name", payeeName);

      const payload = {
        name, phone, shopName, upiId, payeeName,
        latitude, longitude, deliveryRadiusKm,
        schemeTargetAmount: Number(schemeTargetAmount), // ✅ Save
        schemeMonthlyAmount: Number(schemeMonthlyAmount) // ✅ Save
      };
      await updateRetailerProfile(payload);

      sessionStorage.setItem("retailerShopName", shopName);

      toast.success("✅ Profile updated successfully!");
      setIsEditing(false); // Exit edit mode
    } catch (err) {
      console.error("Failed to update profile", err);

      if (err.response && err.response.status === 404) {
        toast.error("⚠️ Session expired. Please log out and log in again.");
      } else {
        const errorMsg = err.response?.data ?
          (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data)
          : err.message;
        toast.error("❌ Failed to update profile: " + errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLoading(true);
    loadProfile(); // Revert changes
  };

  return (
    <div className="profile-container fade-in">
      {loading ? (
        <div className="loading-screen">
          <Loader2 className="animate-spin" size={40} />
        </div>
      ) : (
        <>
          {/* 1. Header with Gradient Cover */}
          <div className="profile-cover">
            <button className="back-btn-abs" onClick={onBack}>
              <ArrowLeft size={16} /> Back
            </button>
            <div className="profile-header-content">
              <div className="profile-avatar-large">
                <User size={60} />
              </div>
              <div className="profile-info-basic">
                <h1>{shopName || "Retailer Store"}</h1>
                <p>Retailer ID: #KH-{sessionStorage.getItem("retailerId")?.substring(0, 6) || "USER"}</p>
              </div>
            </div>
          </div>

          <div className="profile-grid">
            {/* 2. Left Column: Business Details */}
            <div className="detail-card">
              <div className="card-title">
                <User size={20} className="text-blue-500" />
                Business Details
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Business Name / Shop Name</label>
                  <input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Nexus Retailers Ltd."
                    style={{ fontSize: '16px', fontWeight: 500 }}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      disabled={!isEditing}
                      className={!isEditing ? "read-only" : ""}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Right Column: Settings & Linked Accounts */}
            <div className="right-column">
              {/* Location Card */}
              <div className="location-card">
                <div className="card-title">
                  <MapPin size={20} className="text-green-500" /> {/* Changed Icon */}
                  Preferences / Location
                </div>

                <div className="form-group">
                  <label>Operating Region (GPS)</label>
                  <button
                    type="button"
                    className="detect-btn"
                    onClick={detectMyLocation}
                    disabled={detectingLocation || !isEditing}
                    style={{ opacity: isEditing ? 1 : 0.6, cursor: isEditing ? 'pointer' : 'not-allowed' }}
                  >
                    {detectingLocation ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                    {latitude ? "Update Location" : "Detect Location"}
                  </button>
                  {latitude && (
                    <div style={{ fontSize: '11px', color: '#10b981', textAlign: 'center' }}>
                      Selected: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Delivery Radius (km)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={deliveryRadiusKm}
                      onChange={(e) => setDeliveryRadiusKm(parseInt(e.target.value))}
                      disabled={!isEditing}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontWeight: 700, width: '40px', textAlign: 'right' }}>{deliveryRadiusKm}km</span>
                  </div>
                </div>
              </div>

              {/* UPI/Payment Card */}
              <div className="payment-card">
                <div className="card-title">
                  <CreditCard size={20} className="text-purple-500" /> {/* Changed Icon */}
                  Linked Accounts (UPI)
                </div>

                <div className="form-group">
                  <label>UPI ID (VPA)</label>
                  <input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Payee Name</label>
                  <input
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    placeholder="Name as per Bank"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* ✅ SCHEME CONFIGURATION */}
              <div className="payment-card" style={{ marginTop: '20px', borderColor: '#bae6fd', background: '#f0f9ff' }}>
                <div className="card-title" style={{ color: '#0284c7' }}>
                  <PiggyBank size={20} className="text-blue-500" />
                  Monthly Scheme Settings
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Target Amount (₹)</label>
                    <input
                      type="number"
                      value={schemeTargetAmount}
                      onChange={(e) => setSchemeTargetAmount(e.target.value)}
                      placeholder="6000"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Monthly Deposit (₹)</label>
                    <input
                      type="number"
                      value={schemeMonthlyAmount}
                      onChange={(e) => setSchemeMonthlyAmount(e.target.value)}
                      placeholder="500"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons-floating">
            {!isEditing ? (
              <button className="edit-btn-floating" onClick={() => setIsEditing(true)}>
                <Pencil size={18} /> Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="cancel-btn-floating" onClick={handleCancel} disabled={saving}>
                  <X size={18} /> Cancel
                </button>
                <button className="save-btn-floating" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default RetailerProfile;

