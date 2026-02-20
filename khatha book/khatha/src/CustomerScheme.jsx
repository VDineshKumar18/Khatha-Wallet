
import { useState } from "react";
import { PiggyBank, MapPin, Store } from "lucide-react";
import ShopSelection from "./ShopSelection";

function CustomerScheme({ customer, onEnroll }) {
    const [view, setView] = useState("details"); // 'details' or 'discover'

    if (view === "discover") {
        return (
            <div className="scheme-discover-page">
                <button
                    onClick={() => setView("details")}
                    style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b' }}
                >
                    ⬅ Back to Scheme
                </button>
                <h2 style={{ fontSize: 20, color: '#1e293b', marginBottom: 8 }}>Find Schemes Near You 📍</h2>
                <p style={{ color: '#64748b', marginBottom: 20 }}>Discover shops offering the Monthly Savings Scheme.</p>

                <ShopSelection
                    accounts={[]}
                    onSelectShop={(retailerId) => onEnroll(retailerId)}
                    onBack={() => setView("details")}
                    isModal={false}
                    isRegistration={true} // Use discover mode
                    newCustomerData={null}
                    mode="scheme" // ✅ Trigger Scheme Mode in ShopSelection
                />
            </div>
        );
    }

    return (
        <div className="customer-scheme-container" style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <PiggyBank size={28} color="#0ea5e9" /> Monthly Savings Scheme
            </h2>
            <p style={{ color: '#64748b', marginBottom: 24 }}>
                Save small amounts monthly and redeem big rewards at your favorite local shops!
            </p>

            {customer.isSchemeActive ? (
                /* ✅ ACTIVE SCHEME CARD */
                <div className="scheme-active-card" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', borderRadius: 20, padding: 24, color: 'white', boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>CURRENT BALANCE</div>
                            <div style={{ fontSize: 32, fontWeight: 800 }}>₹{customer.schemeCollectedAmount?.toFixed(2) || "0.00"}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                            🎯 Target: ₹{customer.schemeTargetAmount}
                        </div>
                    </div>

                    <div style={{ height: 10, background: 'rgba(255,255,255,0.3)', borderRadius: 5, overflow: 'hidden', marginBottom: 20 }}>
                        <div style={{
                            width: `${Math.min((customer.schemeCollectedAmount / customer.schemeTargetAmount) * 100, 100)}%`,
                            height: '100%',
                            background: 'white',
                            transition: 'width 0.5s ease'
                        }}></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
                        {[...Array(12)].map((_, i) => (
                            <div key={i} style={{
                                aspectRatio: '1/1', borderRadius: '50%',
                                background: i < (customer.schemeMonthsPaid || 0) ? 'white' : 'rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, color: i < (customer.schemeMonthsPaid || 0) ? '#0284c7' : 'rgba(255,255,255,0.6)',
                                fontWeight: 700, border: i < (customer.schemeMonthsPaid || 0) ? 'none' : '1px solid rgba(255,255,255,0.3)'
                            }}>
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Store size={18} />
                        <div>
                            Managed by <strong>{customer.retailerName}</strong>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>Visit shop to make payments</div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ✅ NO SCHEME - ENROLL OPTION */
                <div className="scheme-enroll-card" style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, background: '#f0f9ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <PiggyBank size={32} color="#0ea5e9" />
                    </div>
                    <h3 style={{ fontSize: 18, color: '#1e293b', marginBottom: 8 }}>Start Saving Today!</h3>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                        Join a monthly savings scheme at a nearby trusted shop.<br />
                        Pay monthly and get bonus items or discounts at the end of the year.
                    </p>

                    <button
                        onClick={() => setView("discover")}
                        style={{
                            background: '#0ea5e9', color: 'white', border: 'none', padding: '14px 24px',
                            borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
                            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                        }}
                    >
                        <MapPin size={20} /> Find Nearby Schemes
                    </button>
                </div>
            )}
        </div>
    );
}

export default CustomerScheme;
