import { useState, useEffect, Suspense, lazy } from "react";
import { Store, ShoppingCart, Package, User, Menu, Globe } from "lucide-react"; // ✅ Import Icons
import CustomerLogin from "./CustomerLogin";
import ShopSelection from "./ShopSelection";
import CustomerSidebar from "./CustomerSidebar";
import axiosClient from "./api/axiosClient";
import { toast } from "react-toastify"; // ✅ Use react-toastify
import "./CustomerApp.css";

// ✅ LAZY LOAD SUB-COMPONENTS
const CustomerMarketplace = lazy(() => import("./CustomerMarketplace"));
const CustomerCart = lazy(() => import("./CustomerCart"));
const CustomerOrders = lazy(() => import("./CustomerOrders"));
const CustomerProfile = lazy(() => import("./CustomerProfile"));
const CustomerScheme = lazy(() => import("./CustomerScheme")); // ✅ New Component

function CustomerApp({ onLogout, initialAccounts }) {
    // Auth & Routing State
    const [step, setStep] = useState("MARKETPLACE"); // ALWAYS GO TO DASHBOARD

    const [accounts, setAccounts] = useState(Array.isArray(initialAccounts) ? initialAccounts : []);

    // Auto-select first account if available
    const [selectedAccount, setSelectedAccount] = useState(() => {
        const stored = JSON.parse(sessionStorage.getItem("customer_retailer") || "null");
        if (stored) return stored;
        if (Array.isArray(initialAccounts) && initialAccounts.length > 0) return initialAccounts[0];
        return null;
    });

    // New User Data
    const newUserData = (initialAccounts && initialAccounts.isNewUser) ? initialAccounts : null;

    // Dashboard State
    // Default to "products" if we have an account, otherwise "switchShop" (so they can pick one)
    const [activeView, setActiveView] = useState(() => {
        if (!initialAccounts || (Array.isArray(initialAccounts) && initialAccounts.length === 0) || initialAccounts.isNewUser) {
            return "switchShop";
        }
        return "products";
    });

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768); // ✅ Responsive Init
    const [darkMode, setDarkMode] = useState(false);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Data State
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        if (selectedAccount) {
            loadProducts();
            loadOrders();
        }
    }, [selectedAccount]); // Reload if account changes

    const loadProducts = async () => {
        try {
            const res = await axiosClient.get("/products", {
                params: { retailerId: selectedAccount.retailerId }
            });
            setProducts(res.data || []);
        } catch (err) {
            console.error("Failed to load products", err);
        }
    };

    const loadOrders = async () => {
        try {
            const res = await axiosClient.get(`/orders/customer/${selectedAccount.customerId}`);
            setOrders(res.data || []);
        } catch (err) {
            console.error("Failed to load orders", err);
        }
    };

    // Cart Actions
    const addToCart = (product) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[product.barcode]) {
                newCart[product.barcode].qty += 1;
            } else {
                newCart[product.barcode] = { ...product, qty: 1 };
            }
            return newCart;
        });
        toast.success("Added to cart"); // ✅ Use toast.success
    };

    const removeFromCart = (barcode) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (!newCart[barcode]) return prev;
            if (newCart[barcode].qty > 1) {
                newCart[barcode].qty -= 1;
            } else {
                delete newCart[barcode];
            }
            return newCart;
        });
    };

    const clearCart = () => setCart({});

    // Auth Actions
    const handleLoginSuccess = (retailerList) => {
        setAccounts(retailerList);
        if (retailerList.length > 0) {
            selectShop(retailerList[0]);
        } else {
            setActiveView("switchShop");
        }
    };

    const selectShop = (account) => {
        sessionStorage.setItem("customer_retailer", JSON.stringify(account));
        setSelectedAccount(account);
        setActiveView("products"); // Go to products after selection
    };

    const handleLogout = () => {
        sessionStorage.removeItem("customer_retailer");
        setSelectedAccount(null);
        setStep("LOGIN");
        onLogout();
    };

    // Render Logic
    if (step === "LOGIN") {
        return (
            <div className="login-modal-overlay">
                <div className="login-modal">
                    <h2>Session Expired</h2>
                    <button onClick={onLogout}>Go Back</button>
                </div>
            </div>
        );
    }

    // REMOVED: if (step === "SELECT_SHOP") ...

    // MAIN DASHBOARD LAYOUT
    // MAIN DASHBOARD LAYOUT
    return (
        <div className="app-layout">
            {/* ✅ SIDEBAR (Hidden on mobile unless open) */}
            <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
                <CustomerSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    toggleDark={() => setDarkMode(!darkMode)}
                    cartCount={Object.values(cart).reduce((s, i) => s + i.qty, 0)}
                />
            </div>

            {/* ✅ MOBILE OVERLAY BACKDROP */}
            {sidebarOpen && (
                <div
                    className="mobile-backdrop mobile-only"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', zIndex: 1000
                    }}
                />
            )}

            {/* ✅ MOBILE BOTTOM NAV */}
            <div className="bottom-nav mobile-only">
                <button
                    className={`nav-item ${activeView === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveView('products')}
                >
                    <Store size={20} />
                    <span>Shop</span>
                </button>

                <button
                    className={`nav-item ${activeView === 'cart' ? 'active' : ''}`}
                    onClick={() => setActiveView('cart')}
                >
                    <div style={{ position: 'relative' }}>
                        <ShoppingCart size={20} />
                        {Object.keys(cart).length > 0 && (
                            <span style={{
                                position: 'absolute', top: -5, right: -8,
                                background: 'red', color: 'white',
                                fontSize: '9px', borderRadius: '50%', padding: '2px 4px'
                            }}>
                                {Object.values(cart).reduce((s, i) => s + i.qty, 0)}
                            </span>
                        )}
                    </div>
                    <span>Cart</span>
                </button>

                <button
                    className={`nav-item ${activeView === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveView('orders')}
                >
                    <Package size={20} />
                    <span>Orders</span>
                </button>

                <button
                    className={`nav-item ${activeView === 'all_products' ? 'active' : ''}`}
                    onClick={() => setActiveView('all_products')}
                >
                    <Globe size={20} />
                    <span>All Products</span>
                </button>

                <button
                    className="nav-item"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={20} />
                    <span>Menu</span>
                </button>
            </div>

            <main className="main-content">
                <div className="dashboard-root">
                    {/* Hide Main Header on Profile Page since Profile has its own header */}
                    {activeView !== 'profile' && (
                        <div className="dashboard-top">
                            <div className="welcome-box">
                                <h2>Welcome Back 👋</h2>
                                <p className="retailer-name">
                                    Shopping at: <span>{selectedAccount?.retailerName}</span>
                                </p>
                            </div>
                            {/* ✅ Top Right Profile Button */}
                            <button
                                className="profile-btn-top mobile-only"
                                onClick={() => setActiveView('profile')}
                            >
                                <User size={24} />
                            </button>
                        </div>
                    )}

                    {/* ✅ WRAP CONTENT IN SUSPENSE */}
                    <Suspense fallback={<div className="loader">Loading...</div>}>
                        {activeView === "products" && (
                            <CustomerMarketplace
                                products={products}
                                cart={cart}
                                addToCart={addToCart}
                                removeFromCart={removeFromCart}
                            />
                        )}

                        {/* ✅ GLOBAL MARKETPLACE */}
                        {activeView === "all_products" && (
                            <CustomerMarketplace
                                isGlobal={true}
                                cart={cart}
                                addToCart={addToCart}
                                removeFromCart={removeFromCart}
                            />
                        )}

                        {activeView === "cart" && selectedAccount && (
                            <CustomerCart
                                cart={cart}
                                account={selectedAccount}
                                addToCart={addToCart}
                                removeFromCart={removeFromCart}
                                clearCart={clearCart}
                                onOrderPlaced={() => {
                                    loadOrders();
                                    setActiveView("orders");
                                }}
                            />
                        )}

                        {activeView === "orders" && (
                            <CustomerOrders
                                orders={orders}
                                onRefresh={loadOrders}
                            />
                        )}

                        {activeView === "profile" && selectedAccount && (
                            <CustomerProfile customerId={selectedAccount.customerId} />
                        )}

                        {activeView === "scheme" && selectedAccount && (
                            <CustomerScheme
                                customer={selectedAccount}
                                onEnroll={async (retailerId) => {
                                    // 1. Check if we already have an account with this retailer
                                    const existingAccount = accounts.find(a => a.retailerId === retailerId);

                                    let accountToEnroll = existingAccount;

                                    if (!existingAccount) {
                                        // 2. If not, register first
                                        try {
                                            // Trigger normal shop selection logic to register
                                            // This is a bit tricky since selectShop just sets state.
                                            // We need to call the registration API manually here?
                                            // Actually, simplest is to switch shop to that retailer (which handles registration internally in ShopSelection if we used that)
                                            // But here we are getting retailerId from ShopSelection.

                                            // Let's rely on a helper or just do it here:
                                            // We need access to registerCustomer from authApi
                                            const { registerCustomer } = await import("./api/authApi");
                                            const res = await registerCustomer({
                                                email: selectedAccount.email, // Use current email
                                                name: selectedAccount.customerName,
                                                phone: selectedAccount.phone || "0000000000",
                                                retailerId: retailerId.toString()
                                            });

                                            accountToEnroll = res[0];

                                            // Update accounts list
                                            setAccounts(prev => [...prev, accountToEnroll]);

                                        } catch (err) {
                                            toast.error("Failed to join shop: " + err.message);
                                            return;
                                        }
                                    }

                                    // 3. Enroll in Scheme
                                    try {
                                        const { updateCustomerScheme } = await import("./api/customerApi");

                                        // ✅ USE RETAILER CONFIG for Scheme
                                        const targetAmount = accountToEnroll.schemeTargetAmount || 6000.0;
                                        const monthlyAmount = accountToEnroll.schemeMonthlyAmount || 500.0;

                                        await updateCustomerScheme(accountToEnroll.customerId, {
                                            isSchemeActive: true,
                                            schemeStartDate: new Date().toISOString().split('T')[0],
                                            schemeMonthlyAmount: monthlyAmount,
                                            schemeTargetAmount: targetAmount,
                                            schemeCollectedAmount: 0.0,
                                            schemeMonthsPaid: 0
                                        });

                                        toast.success("🎉 Successfully enrolled in Savings Scheme!");

                                        // 4. Switch to that shop and show scheme
                                        selectShop({
                                            ...accountToEnroll,
                                            isSchemeActive: true,
                                            schemeCollectedAmount: 0.0,
                                            schemeTargetAmount: targetAmount,
                                            schemeMonthlyAmount: monthlyAmount, // Ensure state has this
                                            schemeMonthsPaid: 0
                                        });
                                        setActiveView("scheme");

                                    } catch (err) {
                                        toast.error("Enrollment failed: " + err.message);
                                    }
                                }}
                            />
                        )}

                        {activeView === "switchShop" && (
                            <ShopSelection
                                accounts={accounts}
                                onSelectShop={selectShop}
                                isModal={false}
                                isRegistration={false}
                                newCustomerData={null}
                            />
                        )}

                        {activeView === "discoverShops" && (
                            <ShopSelection
                                accounts={[]}
                                onSelectShop={selectShop}
                                isModal={false}
                                isRegistration={true}
                                newCustomerData={null}
                            />
                        )}
                    </Suspense>
                </div>
            </main>
        </div>
    );
}

export default CustomerApp;
