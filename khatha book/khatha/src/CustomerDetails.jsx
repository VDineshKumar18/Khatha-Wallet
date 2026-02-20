import { useState, useEffect } from "react";
import { Share2, Phone, MessageCircle, ArrowLeft, Download, FileText, Calendar, Clock, CheckCircle, AlertCircle, Image as ImageIcon, Upload, Printer, Bell, Minus, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import BillReceipt from "./BillReceipt";
import { notifyCustomer } from "./api/notificationApi"; // ✅ Import Notify API
import { updateCustomerScheme } from "./api/customerApi"; // ✅ Import Scheme API
import axiosClient from "./api/axiosClient";
import { createBill, uploadBillImage } from "./api/billApi"; // Also missing imports for these used functions!
import "./CustomerDetails.css";

function CustomerDetails({ customer, bills = [], onBack, refreshBills }) {
  const [activeForm, setActiveForm] = useState(null); // ✅ Start closed
  const [saving, setSaving] = useState(false);

  const [gaveForm, setGaveForm] = useState({
    amount: "",
    items: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [receivedForm, setReceivedForm] = useState({
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [selectedFile, setSelectedFile] = useState(null); // ✅ File State
  const [viewingBill, setViewingBill] = useState(null); // ✅ View Receipt State
  const [viewingImage, setViewingImage] = useState(null); // ✅ View Image Modal State
  const [allProducts, setAllProducts] = useState([]); // ✅ Store full products for receipt
  const [notifying, setNotifying] = useState(false); // ✅ Notify Loading State

  /* ================= NOTIFY CUSTOMER ================= */
  const handleNotify = async () => {
    if (!customer?.email) {
      toast.error("Customer email not available");
      return;
    }
    try {
      setNotifying(true);
      await notifyCustomer(customer.id);
      toast.success(`Reminder sent to ${customer.email}`);
    } catch (error) {
      toast.error("Failed to send reminder");
    } finally {
      setNotifying(false);
    }
  };

  /* ================= PRINT STATEMENT ================= */
  const handlePrint = () => {
    window.print();
  };

  const totalDue = customer.dueAmount ?? 0;
  const loyaltyTotal = customer.loyaltyPoints ?? customer.points ?? 0;

  /* ================= LOAD PRODUCTS (FOR NAME MAPPING) ================= */
  const [productMap, setProductMap] = useState({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const retailerId = sessionStorage.getItem("retailerId");
      const res = await axiosClient.get("/products", {
        params: { retailerId },
      });

      const map = {};
      (res.data || []).forEach((p) => {
        map[p.barcode] = p.name;
      });

      setProductMap(map);
      setAllProducts(res.data || []);
    } catch (error) {
      console.error("Failed to load products for mapping:", error);
      // Optional: set empty state or show toast
    }
  };

  /* ================= FORMAT BILL ITEMS ================= */
  const formatItems = (items) => {
    if (!items) return "";
    return items
      .split(",")
      .map((entry) => {
        const parts = entry.trim().split(" x");
        if (parts.length < 2) return productMap[entry.trim()] || entry.trim();

        const barcode = parts[0];
        let qty = parts[1];

        if (qty === "undefined" || qty === "null" || !qty) qty = "1";

        return `${productMap[barcode] || barcode} x${qty}`;
      })
      .join(", ");
  };

  /* ================= SAVE BILL ================= */
  const handleSave = async () => {
    try {
      setSaving(true);

      if (activeForm === "GAVE") {
        if (!gaveForm.amount) {
          toast.error("Enter amount");
          return;
        }

        const res = await createBill(customer.id, {
          type: "GAVE",
          amount: Number(gaveForm.amount),
          paidAmount: 0,
          paymentMode: "KHATHA",
          items: gaveForm.items || "Manual entry",
          billDate: gaveForm.date,
        });

        // ✅ UPLOAD IMAGE IF SELECTED
        if (selectedFile) {
          await uploadBillImage(res.data.id, selectedFile);
        }

        setGaveForm({ ...gaveForm, amount: "", items: "" });
      } else if (activeForm === "SCHEME") {
        if (!receivedForm.amount) {
          toast.error("Enter amount");
          return;
        }

        const res = await createBill(customer.id, {
          type: "SCHEME",
          amount: Number(receivedForm.amount),
          paidAmount: Number(receivedForm.amount), // Scheme is fully paid deposit
          paymentMode: receivedForm.note || "SCHEME_DEPOSIT",
          items: "Monthly Savings Deposit",
          billDate: receivedForm.date,
        });

        // ✅ UPLOAD IMAGE IF SELECTED
        if (selectedFile) {
          await uploadBillImage(res.data.id, selectedFile);
        }

        setReceivedForm({ ...receivedForm, amount: "", note: "" });

      } else {
        if (!receivedForm.amount) {
          toast.error("Enter amount");
          return;
        }

        const res = await createBill(customer.id, {
          type: "RECEIVED",
          amount: Number(receivedForm.amount),
          paidAmount: Number(receivedForm.amount),
          paymentMode: receivedForm.note || "PAYMENT",
          items: receivedForm.note || "Payment received",
          billDate: receivedForm.date,
        });

        // ✅ UPLOAD IMAGE IF SELECTED
        if (selectedFile) {
          await uploadBillImage(res.data.id, selectedFile);
        }

        setReceivedForm({ ...receivedForm, amount: "", note: "" });
      }

      setSelectedFile(null); // Reset file
      setActiveForm(null); // ✅ Close form after save
      await refreshBills?.(customer.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      <button className="back-nav" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Customers
      </button>

      {/* ✅ MODERN PROFILE HEADER */}
      <div className="profile-card">
        <div className="profile-left">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="status-indicator"></div>
          </div>

          <div className="profile-info">
            <h1>{customer.name}</h1>
            <div className="profile-meta">
              <span className="meta-item"><Phone size={14} /> {customer.phone}</span>
              {customer.address && <span className="meta-item">• {customer.address}</span>}
            </div>

            <div className="profile-actions">
              <button className="btn-pill" onClick={handleNotify} disabled={notifying}>
                <Bell size={14} className={notifying ? "animate-pulse" : ""} />
                {notifying ? "Sending..." : "Reminder"}
              </button>
              <button className="btn-pill">
                <MessageCircle size={14} /> Message
              </button>
            </div>
          </div>
        </div>

        {/* ✅ BALANCE CARD */}
        <div className="balance-card">
          <div className="balance-label">Net Balance</div>
          <h2 className={`balance-amount ${totalDue > 0 ? "text-danger" : "text-success"}`}>
            ₹ {Math.abs(totalDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <div className={`balance-status ${totalDue > 0 ? "text-danger" : "text-success"}`}>
            {totalDue > 0 ? "You'll receive ↗" : "Settled ✓"}
          </div>
        </div>
      </div>

      {/* ✅ SAVINGS SCHEME CARD */}
      <div className="scheme-card" style={{ marginTop: 16, padding: 16, background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: 16, border: '1px solid #bae6fd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} /> Monthly Savings Scheme
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#0c4a6e' }}>
              Pay ₹{customer.schemeMonthlyAmount || 500}/mo for 12 months & get free items worth ₹{customer.schemeTargetAmount || 6000}!
            </p>
          </div>
          {customer.isSchemeActive && (
            <span style={{ background: '#0ea5e9', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              ACTIVE
            </span>
          )}
        </div>

        {!customer.isSchemeActive ? (
          <button
            onClick={async () => {
              if (window.confirm("Enroll this customer in the ₹500/mo Monthly Savings Scheme?")) {
                try {
                  await updateCustomerScheme(customer.id, {
                    isSchemeActive: true,
                    schemeMonthlyAmount: 500,
                    schemeTargetAmount: 6000,
                    schemeCollectedAmount: 0,
                    schemeMonthsPaid: 0
                  });
                  toast.success("Customer Enrolled in Scheme!");
                  refreshBills(); // Refresh customer data
                } catch (e) {
                  toast.error("Failed to enroll");
                }
              }
            }}
            style={{ width: '100%', padding: 12, background: '#0284c7', color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Start Savings Scheme (Enroll)
          </button>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, fontWeight: 600, color: '#0369a1' }}>
              <span>Collected: ₹{customer.schemeCollectedAmount}</span>
              <span>Target: ₹{customer.schemeTargetAmount}</span>
            </div>
            <div style={{ height: 10, background: '#bae6fd', borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{
                width: `${Math.min((customer.schemeCollectedAmount / customer.schemeTargetAmount) * 100, 100)}%`,
                height: '100%',
                background: '#0284c7',
                transition: 'width 0.5s ease'
              }}></div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[...Array(12)].map((_, i) => {
                const monthlyAmount = customer.schemeMonthlyAmount || 500;
                const monthsPaid = Math.floor((customer.schemeCollectedAmount || 0) / monthlyAmount);
                const isPaid = i < monthsPaid;

                return (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: isPaid ? '#0ea5e9' : 'white',
                    border: '2px solid #0ea5e9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: isPaid ? 'white' : '#0ea5e9',
                    fontWeight: 700
                  }}>
                    {i + 1}
                  </div>
                );
              })}
            </div>
            {/* Payment Button Removed as per request */}
          </div>
        )}
      </div>

      {/* ✅ CONTROLS BAR */}
      <div className="controls-bar">
        <div className="action-buttons-group">
          <button
            className={`btn-main btn-gave ${activeForm === "GAVE" ? "active" : ""}`}
            onClick={() => setActiveForm(activeForm === "GAVE" ? null : "GAVE")}
          >
            <Minus size={18} /> You Gave
          </button>
          <button
            className={`btn-main btn-received ${activeForm === "RECEIVED" ? "active" : ""}`}
            onClick={() => setActiveForm(activeForm === "RECEIVED" ? null : "RECEIVED")}
          >
            <Plus size={18} /> You Received
          </button>
        </div>

        <div className="filter-actions">
          <span style={{ fontSize: 14 }}>Sort by:</span>
          <select className="sort-dropdown">
            <option>Date (Newest)</option>
            <option>Date (Oldest)</option>
            <option>Amount (High-Low)</option>
          </select>
          <div style={{ width: 1, height: 20, background: '#d1d5db', margin: '0 8px' }}></div>
          <Download size={18} style={{ cursor: 'pointer' }} onClick={handlePrint} />
        </div>
      </div>

      {/* FORMS - POPUP MODAL (Strictly Matching Supplier Modal) */}
      {
        (activeForm === "GAVE" || activeForm === "RECEIVED" || activeForm === "SCHEME") && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: activeForm === "GAVE" ? "#ef4444" : activeForm === "SCHEME" ? "#0284c7" : "#10b981", display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeForm === "GAVE" ? <Minus size={20} /> : <Plus size={20} />}
                  {activeForm === "GAVE" ? "You Gave Credit" : activeForm === "SCHEME" ? "Monthly Savings Deposit" : "You Received Payment"}
                </h4>
                <button onClick={() => setActiveForm(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    autoFocus
                    value={activeForm === "GAVE" ? gaveForm.amount : receivedForm.amount}
                    onChange={(e) =>
                      activeForm === "GAVE"
                        ? setGaveForm({ ...gaveForm, amount: e.target.value })
                        : setReceivedForm({ ...receivedForm, amount: e.target.value })
                    }
                    style={{ padding: "12px", borderRadius: "8px", border: "2px solid #e5e7eb", width: "100%", boxSizing: "border-box", fontSize: "18px", fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Description / Bill No.</label>
                  <input
                    placeholder={activeForm === "GAVE" ? "e.g. Rice, Sugar" : "e.g. Cash, UPI"}
                    value={activeForm === "GAVE" ? gaveForm.items : receivedForm.note}
                    onChange={(e) =>
                      activeForm === "GAVE"
                        ? setGaveForm({ ...gaveForm, items: e.target.value })
                        : setReceivedForm({ ...receivedForm, note: e.target.value })
                    }
                    style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", width: "100%", boxSizing: "border-box", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' }}>Date</label>
                  <input
                    type="date"
                    value={activeForm === "GAVE" ? gaveForm.date : receivedForm.date}
                    onChange={(e) =>
                      activeForm === "GAVE"
                        ? setGaveForm({ ...gaveForm, date: e.target.value })
                        : setReceivedForm({ ...receivedForm, date: e.target.value })
                    }
                    style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", width: "100%", boxSizing: "border-box", fontSize: "14px" }}
                  />
                </div>

                {/* FILE INPUT */}
                <div
                  onClick={() => document.getElementById('file-upload-modal').click()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', background: '#f9fafb',
                    border: '1px solid #e5e7eb', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '14px', color: '#6b7280'
                  }}
                >
                  <Upload size={16} />
                  {selectedFile ? selectedFile.name : "Attach Bill/Receipt"}
                </div>
                <input
                  id="file-upload-modal"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />


                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    marginTop: "8px",
                    padding: "14px",
                    background: activeForm === "GAVE" ? "#ef4444" : activeForm === "SCHEME" ? "#0284c7" : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "15px",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? "Saving..." : activeForm === "SCHEME" ? "Deposit to Savings" : "Confirm Transaction"}
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* ================= BILLS TABLE ================= */}
      <div className="transactions-card desktop-only" style={{ marginTop: 24 }}>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan="5" align="center" style={{ padding: 40, color: '#9ca3af' }}>
                  No transactions found
                </td>
              </tr>
            ) : (
              bills.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="date-cell">
                      {new Date(b.billDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <span className="date-time">10:42 AM</span> {/* Placeholder time if not available */}
                    </div>
                  </td>
                  <td>
                    <div className="desc-cell">
                      <div className={`icon-box ${b.type === "GAVE" ? "gave" : b.type === "SALE" ? "sale" : "received"}`}>
                        {b.type === "GAVE" ? <Download size={18} /> : b.type === "SALE" ? <FileText size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div className="desc-text">
                        <h4>{b.type === "SALE" ? "New Purchase" : b.type === "GAVE" ? "You Gave Credit" : "Payment Received"}</h4>
                        <p className="desc-sub">{formatItems(b.items) || "No description"}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${b.type === "GAVE" ? "gave" : "received"}`} style={{
                      background: b.type === 'GAVE' ? '#fee2e2' : b.type === 'SALE' ? '#e0f2fe' : '#dcfce7',
                      color: b.type === 'GAVE' ? '#991b1b' : b.type === 'SALE' ? '#075985' : '#166534'
                    }}>
                      {b.type === "GAVE" ? "You Gave" : b.type === "SALE" ? "Sale" : "Received"}
                    </span>
                  </td>
                  <td align="right" className="amount-cell" style={{ color: b.type === 'GAVE' || b.type === 'SALE' ? '#ef4444' : '#10b981' }}>
                    ₹ {b.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td align="right">
                    {b.imageUrl ? (
                      <div
                        onClick={() => setViewingImage(b.imageUrl)}
                        style={{ color: '#6b7280', cursor: 'pointer' }}
                      >
                        <ImageIcon size={18} />
                      </div>
                    ) : b.type === "SALE" ? (
                      <span onClick={() => setViewingBill(b)} style={{ color: '#6b7280', cursor: 'pointer' }}>
                        <FileText size={18} />
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MOBILE CARD VIEW */}
      <div className="mobile-only" style={{ marginTop: 24 }}>
        {bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#aaa' }}>No bills found</div>
        ) : (
          bills.map(b => (
            <div className="mobile-tx-card" key={b.id}>
              <div className="mobile-tx-header">
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className={`icon-box ${b.type === "GAVE" ? "gave" : b.type === "SALE" ? "sale" : "received"}`}>
                    {b.type === "GAVE" ? <Download size={16} /> : <CheckCircle size={16} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{b.type === "SALE" ? "Purchase" : b.type === "GAVE" ? "Credit Given" : "Payment"}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{b.billDate}</div>
                  </div>
                </div>
                <div className="mobile-tx-amount" style={{ color: b.type === 'GAVE' || b.type === 'SALE' ? '#ef4444' : '#10b981' }}>
                  ₹ {b.amount}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 8 }}>
                {formatItems(b.items)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ BILL RECEIPT MODAL */}
      {
        viewingBill && (
          <BillReceipt
            bill={viewingBill}
            products={allProducts}
            onClose={() => setViewingBill(null)}
          />
        )
      }

      {/* ✅ IMAGE PREVIEW MODAL */}
      {
        viewingImage && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
              <button
                onClick={() => setViewingImage(null)}
                style={{ position: 'absolute', top: -40, right: 0, background: 'white', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
              <img
                src={`http://${window.location.hostname}:8084/api/bills/image/${viewingImage}`}
                alt="Bill"
                style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/300x400?text=Image+Not+Found";
                }}
              />
            </div>
          </div>
        )
      }
    </div >
  );
}

export default CustomerDetails;
