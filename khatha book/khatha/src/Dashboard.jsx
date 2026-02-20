import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Billing from "./Billing";
import CustomerList from "./CustomerList";
import Products from "./Products";
import CustomerDetails from "./CustomerDetails";
import RetailerProfile from "./RetailerProfile";
import SyncContactsModal from "./SyncContactsModal";
import SelectContactModal from "./SelectContactModal";
import BillList from "./BillList";
import RetailerOrderManager from "./RetailerOrderManager"; // ✅ New Component
import SupplierPage from "./SupplierPage"; // ✅ Supplier List
import SchemeDetails from "./SchemeDetails"; // ✅ Import

import { getCustomers, createCustomer } from "./api/customerApi";
import { getBillsByCustomer } from "./api/billApi";
import { getProducts } from "./api/productApi"; // ✅ NEW
import axiosClient from "./api/axiosClient"; // ✅ NEW

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Menu, LayoutDashboard, ReceiptText, ShoppingBag, Users, LogOut, ChartBar, CreditCard, ChevronRight, Moon, Sun, Home, Package, FileText, User } from "lucide-react";
import "./Dashboard.css";
import "./addcustomer.css";

function Dashboard() {
  const retailerId = sessionStorage.getItem("retailerId");
  const retailerName =
    sessionStorage.getItem("retailerName") ||
    sessionStorage.getItem("retailerEmail") ||
    "Retailer";

  /* ================= AUTH GUARD ================= */
  useEffect(() => {
    if (!retailerId) {
      sessionStorage.clear();
      window.location.reload();
    }
  }, [retailerId]);

  /* ================= STATE ================= */
  const [activeView, setActiveView] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]); // ✅ NEW
  const [orders, setOrders] = useState([]); // ✅ NEW
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // ✅ Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [showSync, setShowSync] = useState(false);
  const [showSelectContact, setShowSelectContact] = useState(false); // ✅ NEW
  const [syncedContacts, setSyncedContacts] = useState([]); // ✅ NEW

  /* ================= DARK MODE ================= */
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  /* ================= LOAD DASHBOARD DATA ================= */
  const loadDashboardData = async () => {
    try {
      // 1. Customers
      const resCustomers = await getCustomers();
      const customerData = resCustomers.data || [];
      setCustomers(customerData);

      // Sync selected customer
      if (selectedCustomer) {
        const updated = customerData.find((c) => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
      }

      if (retailerId) {
        // 2. Products (For Mobile Top 2)
        const resProducts = await getProducts(retailerId);
        setProducts(resProducts.data || []);

        // 3. Online Orders (For Mobile Top 2)
        const resOrders = await axiosClient.get(`/orders/retailer/${retailerId}`);
        setOrders(resOrders.data || []);
      }

    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []); // eslint-disable-line



  /* ================= LOAD BILLS ================= */
  const loadBills = async (customerId) => {
    const res = await getBillsByCustomer(customerId);
    setBills(res.data || []);
  };

  useEffect(() => {
    if (!selectedCustomer?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBills(selectedCustomer.id);
  }, [selectedCustomer?.id]);

  /* ================= REFRESH WRAPPER ================= */
  const refreshData = async (customerId) => {
    await loadBills(customerId);
    await loadDashboardData(); // ✅ UPDATED
  };



  /* ================= CALCULATIONS ================= */
  const totalGave = customers.reduce((s, c) => s + (c.dueAmount || 0), 0);

  const totalReceived = customers.reduce((s, c) => s + (c.totalReceived || c.paidAmount || 0), 0);

  // TOP 2 LISTS
  const top2Customers = [...customers]
    .sort((a, b) => (b.dueAmount || 0) - (a.dueAmount || 0))
    .slice(0, 2);

  const top2Products = [...products]
    .sort((a, b) => (a.stock || 0) - (b.stock || 0)) // Low stock priority
    .slice(0, 2);

  const top2Orders = [...orders]
    .filter(o => o.status === 'PENDING') // Priority to pending
    .slice(0, 2);

  /* ================= BILLING CHART DATA ================= */
  const billingChartData = bills.reduce((acc, bill) => {
    const date = new Date(bill.date || bill.createdAt || 0);
    const month = date.toLocaleString("default", { month: "short" });

    const existing = acc.find((item) => item.month === month);

    if (existing) {
      existing.amount += bill.totalAmount || 0;
    } else {
      acc.push({
        month,
        amount: bill.totalAmount || 0,
      });
    }

    return acc;
  }, []);

  /* ================= PRODUCT SUMMARY DATA ================= */
  const productChartData = products.slice(0, 5).map(p => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '..' : p.name,
    stock: p.quantity || 0,
  }));

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  /* ================= RENDER ================= */
  return (
    <div className="app-layout">
      {/* ===== SIDEBAR ===== */}
      {sidebarOpen && (
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleDark={() => setDarkMode(!darkMode)}
        />
      )}

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className="bottom-nav mobile-only">
        <button
          className={`nav-item ${!activeView || activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView(null)}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </button>

        <button
          className={`nav-item ${activeView === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveView('billing')}
        >
          <ReceiptText size={20} />
          <span>Billing</span>
        </button>

        <button
          className={`nav-item ${activeView === 'onlineOrders' ? 'active' : ''}`}
          onClick={() => setActiveView('onlineOrders')}
        >
          <ShoppingBag size={20} />
          <span>Orders</span>
        </button>

        <button
          className={`nav-item ${activeView === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveView('customers')}
        >
          <Users size={20} />
          <span>Customers</span>
        </button>

        <button
          className="nav-item"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </div>

      {/* ================= MOBILE TOP PROFILE BUTTON ================= */}
      <div className="mobile-top-profile mobile-only">
        <button
          className="profile-icon-btn"
          onClick={() => setActiveView('profile')}
        >
          <div className="avatar-circle">
            <User size={24} />
          </div>
        </button>
      </div>
      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'none' // Hidden by default, shown via CSS media query
          }}
        >
          <style>{`
            @media (max-width: 768px) {
              .mobile-backdrop { display: block !important; }
            }
          `}</style>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      {/* ===== MAIN CONTENT ===== */}
      <main className={`main-content ${!sidebarOpen ? "full" : ""}`}>
        <div className="dashboard-root">

          {/* ===== TOP BAR ===== */}

          <div className="dashboard-header-row">
            {/* ✅ MOBILE MENU TOGGLE */}
            {!sidebarOpen && (
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                <Menu size={24} />
              </button>
            )}

            <div>
              <h2>Welcome 👋</h2>
              <p className="retailer-name">
                Retailer: <span>{retailerName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ===== DASHBOARD HOME ===== */}
        {!activeView && (
          <>
            {/* ===== GAVE / RECEIVED CARDS ===== */}
            <div className="cards-row summary-stats-row">
              <div
                className="summary-card success"
                onClick={() => setActiveView("customers")}
              >
                <h3>You Received</h3>
                <h2>₹ {totalReceived.toFixed(2)}</h2>
              </div>

              <div
                className="summary-card danger"
                onClick={() => setActiveView("customers")}
              >
                <h3>You Gave</h3>
                <h2>₹ {totalGave.toFixed(2)}</h2>
              </div>
            </div>

            {/* ===== SECTION CARDS WITH CHARTS ===== */}
            <div className="cards-row">

              {/* BILLING / CUSTOMERS CARD */}
              <div
                className="section-card chart-card"
                onClick={() => setActiveView("billing")}
              >
                <h3>Billing Section</h3>

                {/* DESKTOP CHART */}
                <div className="desktop-only">
                  <p>Create & Manage Bills</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={billingChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* MOBILE TOP 2 CUSTOMERS */}
                <div className="mobile-only mt-4">
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Top Due Customers</p>
                  {top2Customers.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f9fafb', borderRadius: '6px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{c.name}</span>
                      <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '13px' }}>₹{c.dueAmount?.toFixed(2)}</span>
                    </div>
                  ))}
                  {top2Customers.length === 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}>No dues pending</span>}
                </div>
              </div>

              {/* PRODUCTS CARD */}
              <div
                className="section-card chart-card"
                onClick={() => setActiveView("products")}
              >
                <h3>Product Section</h3>

                {/* DESKTOP CHART */}
                <div className="desktop-only">
                  <p>Manage Inventory & Products</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={productChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis width={40} fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="stock" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* MOBILE TOP 2 PRODUCTS */}
                <div className="mobile-only mt-4">
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Low Stock Alert</p>
                  {top2Products.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f9fafb', borderRadius: '6px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{p.name}</span>
                      <span style={{ color: '#ea580c', fontWeight: 700, fontSize: '12px' }}>{p.stock} left</span>
                    </div>
                  ))}
                  {top2Products.length === 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Inventory healthy</span>}
                </div>
              </div>

              {/* ORDERS CARD */}
              <div
                className="section-card chart-card"
                onClick={() => setActiveView("onlineOrders")}
                style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}
              >
                <h3>📦 Online Orders</h3>

                {/* DESKTOP ICON */}
                <div className="desktop-only">
                  <p>Manage Customer Pickup Orders</p>
                  <div style={{ fontSize: '3rem', textAlign: 'center', marginTop: 20 }}>
                    🛵
                  </div>
                </div>

                {/* MOBILE TOP 2 ORDERS */}
                <div className="mobile-only mt-4">
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Pending Orders</p>
                  {top2Orders.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '6px', marginBottom: '6px', border: '1px solid #bfdbfe' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a' }}>#{o.id ? o.id.toString().slice(-4) : '...'}</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{o.customerName}</span>
                      </div>
                      <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>₹{o.totalAmount}</span>
                    </div>
                  ))}
                  {top2Orders.length === 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}>No pending orders</span>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== CUSTOMER LIST ===== */}
        {activeView === "customers" && (
          <CustomerList
            customers={customers}
            onBack={() => setActiveView(null)}
            onSelectCustomer={(c) => {
              setSelectedCustomer(c);
              setActiveView("details");
            }}
          />
        )}

        {/* ===== SCHEME MEMBERS LIST (FILTERED) ===== */}
        {activeView === "scheme" && (
          <CustomerList
            customers={customers.filter(c => c.isSchemeActive)}
            title="Monthly Savings Members"
            onBack={() => setActiveView(null)}
            onSelectCustomer={(c) => {
              setSelectedCustomer(c);
              setActiveView("schemeDetails"); // ✅ Go to Scheme Details
            }}
          />
        )}

        {/* ===== SCHEME DETAILS VIEW ===== */}
        {activeView === "schemeDetails" && selectedCustomer && (
          <SchemeDetails
            customer={selectedCustomer}
            bills={bills} // Dashboard loads bills when selectedCustomer changes
            refreshBills={refreshData} // ✅ Pass refresh function
            onBack={() => {
              setActiveView("scheme");
              setSelectedCustomer(null);
            }}
          />
        )}

        {/* ===== CUSTOMER DETAILS ===== */}
        {activeView === "details" && selectedCustomer && (
          <CustomerDetails
            customer={selectedCustomer}
            bills={bills}
            refreshBills={refreshData} // ✅ Use wrapper
            onBack={() => {
              setActiveView("customers");
              setSelectedCustomer(null);
            }}
          />
        )}
        {/* ===== ADD CUSTOMER ===== */}
        {activeView === "addCustomer" && (
          <>
            <div className="add-customer-wrapper">

              <div className="add-customer-header">
                <h2>👤 Add New Customer</h2>
                <p>Add customer details or sync from Google contacts</p>
              </div>

              <div className="add-customer-card">

                <div className="sync-row">
                  <button
                    className="sync-btn"
                    onClick={() => setShowSync(true)}
                  >
                    🔄 Sync Contacts
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input
                      placeholder="Enter full name"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      placeholder="Enter phone number"
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      placeholder="Enter email"
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="save-btn"
                    onClick={async () => {
                      await createCustomer(newCustomer);
                      setNewCustomer({ name: "", phone: "", email: "" });
                      loadCustomers();
                      setActiveView("customers");
                    }}
                  >
                    💾 Save Customer
                  </button>
                </div>

              </div>
            </div>

            {showSync && (
              <SyncContactsModal
                onClose={() => setShowSync(false)}
                onImport={(contacts) => {
                  setSyncedContacts(contacts);
                  setShowSync(false);
                  setShowSelectContact(true);
                }}
              />
            )}

            {/* ✅ SELECT CONTACT MODAL */}
            {showSelectContact && (
              <SelectContactModal
                contacts={syncedContacts}
                onClose={() => setShowSelectContact(false)}
                onSelect={(contact) => {
                  setNewCustomer({
                    name: contact.name || "",
                    phone: contact.phone || "", // Google might not give phone, but if it does
                    email: contact.email || "",
                  });
                  setShowSelectContact(false);
                }}
              />
            )}
          </>
        )}


        {activeView === "billing" && (
          <Billing onBack={() => setActiveView(null)} />
        )}

        {activeView === "products" && (
          <Products onBack={() => setActiveView(null)} />
        )}

        {activeView === "profile" && (
          <RetailerProfile onBack={() => setActiveView(null)} />
        )}


        {activeView === "bills" && (
          <BillList onBack={() => setActiveView(null)} />
        )}

        {/* ✅ NEW ONLINE ORDERS VIEW */}
        {activeView === "onlineOrders" && (
          <RetailerOrderManager onBack={() => setActiveView(null)} />
        )}

        {/* ✅ ONLINE KHATHA CUSTOMERS VIEW */}
        {activeView === "onlineCustomers" && (
          <CustomerList
            customers={(() => {
              // 1. Create a Set of existing customer phones for fast lookup
              const existingPhones = new Set(
                customers
                  .map(c => c.phone?.trim())
                  .filter(p => p)
              );

              // 2. Extract unique customers from orders with paymentMode === 'KHATHA'
              // 3. ONLY include those NOT in existingPhones
              const onlineKhathaOrders = orders.filter(o =>
                o.paymentMode === 'KHATHA' &&
                o.customerPhone &&
                !existingPhones.has(o.customerPhone.trim())
              );

              const unknownCustomers = [];
              const seenPhones = new Set();

              onlineKhathaOrders.forEach(order => {
                const phone = order.customerPhone.trim();
                if (!seenPhones.has(phone)) {
                  seenPhones.add(phone);
                  unknownCustomers.push({
                    id: `online_${order.id}`,
                    name: order.customerName,
                    phone: phone,
                    dueAmount: order.totalAmount,
                    isOnline: true
                  });
                }
              });
              return unknownCustomers;
            })()}
            title="Online Khatha Customers"
            onBack={() => setActiveView(null)}
            onSelectCustomer={(c) => {
              // For now, view details might be limited if they aren't fully registered
              setSelectedCustomer(c);
              setActiveView("details");
            }}
          />
        )}

        {/* ✅ SUPPLIER VIEW */}
        {activeView === "supplier" && (
          <SupplierPage onBack={() => setActiveView(null)} />
        )}

      </main>
    </div>
  );
}


export default Dashboard;

