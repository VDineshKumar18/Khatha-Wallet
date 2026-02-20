import { useEffect, useState, useRef } from "react";
import { getCustomers, createCustomer } from "./api/customerApi";
import { createBill, createPaidBill } from "./api/billApi";
import { getProducts } from "./api/productApi";
import { notifyCustomer } from "./api/notificationApi";
import BillReceipt from "./BillReceipt";
import MobileScanner from "./MobileScanner";
import UPIPaymentModal from "./UPIPaymentModal";
import { ScanBarcode, Search, ChevronRight, ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import "./Billing.css";

function Billing({ onBack }) {
  const retailerId = sessionStorage.getItem("retailerId");

  /* ================= STATE ================= */
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [billItems, setBillItems] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcode, setBarcode] = useState("");

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [showMobileCart, setShowMobileCart] = useState(false); // Mobile Cart Modal
  const [showUPIModal, setShowUPIModal] = useState(false); // UPI Payment Modal

  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const GST_PERCENT = 5;

  /* ================= LOAD DATA ================= */
  const loadCustomers = async () => {
    const res = await getCustomers();
    setCustomers(res.data || []);
  };

  const loadProducts = async () => {
    const res = await getProducts(retailerId);
    setProducts(res.data || []);
  };

  useEffect(() => {
    loadCustomers();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= BILL ITEM LOGIC ================= */
  const getProductQtyInBill = (productId) => {
    const item = billItems.find(i => i.id === productId);
    return item ? item.qty : 0;
  };

  const addProductToBill = (product) => {
    if (product.quantity <= 0) {
      toast.error("❌ Out of stock");
      return;
    }

    setBillItems((prev) => {
      const found = prev.find((p) => p.id === product.id);
      if (found) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: Number(p.qty) + 1 } : p
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          price: product.price,
          unit: product.productType === 'WEIGHT' ? 'kg' : product.productType === 'LIQUID' ? 'L' : 'pcs',
          qty: 1,
        },
      ];
    });
  };

  const removeProductFromBill = (id) => {
    setBillItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const updateQty = (id, newQty) => {
    if (newQty < 0) return;
    if (newQty == 0) {
      removeProductFromBill(id); // Logic to remove if 0, though usually handle separately
      return;
    }
    setBillItems(prev => prev.map(p => p.id === id ? { ...p, qty: newQty } : p));
  }

  /* ================= TOTALS ================= */
  const subTotal = billItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const gst = (subTotal * GST_PERCENT) / 100;
  const grossTotal = subTotal + gst;
  const availablePoints = selectedCustomer?.loyaltyPoints ?? 0;
  const safeRedeemPoints = Math.min(Math.max(redeemPoints, 0), availablePoints, grossTotal);
  const total = Math.floor(grossTotal - safeRedeemPoints);
  const loyaltyPoints = Math.floor(grossTotal / 100);

  const safePaidAmount = paymentMode === "KHATHA" ? Math.min(Math.max(paidAmount, 0), total) : total;
  const dueAmount = paymentMode === "KHATHA" ? Math.max(total - safePaidAmount, 0) : 0;

  const totalItems = billItems.reduce((sum, i) => sum + Number(i.qty), 0);

  /* ================= SAVE ================= */
  const saveBill = async (customerId) => {
    if (billItems.length === 0) {
      toast.error("Add at least one product");
      return;
    }

    const billType = paymentMode === "KHATHA" ? "GAVE" : "SALE";
    const itemsString = billItems.map((i) => `${i.barcode} x${i.qty}`).join(", ");

    const payload = {
      type: billType,
      amount: Number(total.toFixed(2)),
      paidAmount: Number(safePaidAmount.toFixed(2)),
      paymentMode,
      items: itemsString,
      loyaltyPointsUsed: safeRedeemPoints,
    };

    if (!customerId && paymentMode === "KHATHA") {
      setShowCustomerForm(true);
      return;
    }

    // Intercept for UPI
    if (paymentMode === "UPI" && !showUPIModal) {
      setShowUPIModal(true);
      return;
    }

    try {
      let res;
      if (customerId) {
        res = await createBill(customerId, payload);
      } else {
        res = await createPaidBill(payload);
      }
      // alert("✅ Bill Saved");
      setSavedBill(res.data);

      // RESET
      setBillItems([]);
      setPaidAmount(0);
      setRedeemPoints(0);
      setSelectedCustomer(null);
      setPaymentMode("CASH");
      setShowMobileCart(false);

      await loadProducts();
      await loadCustomers();
    } catch (err) {
      console.error("Error creating bill", err);
      if (err.response && err.response.data) {
        console.error("Server Error Data:", err.response.data);
        // Show the specific message from backend (e.g. "Insufficient stock")
        toast.error(`Failed: ${err.response.data}`);
      } else {
        toast.error("Bill save failed");
      }
    }
  };

  const saveCustomerAndBill = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Name & Phone required");
      return;
    }
    const res = await createCustomer(newCustomer);
    setShowCustomerForm(false);
    setNewCustomer({ name: "", phone: "", email: "" });
    await loadCustomers();
    await saveBill(res.data.id);
  };

  /* ================= RENDER HELPERS ================= */
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  );

  return (
    <div className="billing-layout">

      {/* LEFT: MAIN CONTENT */}
      <div className="billing-main">
        {/* HEADER BAR */}
        <div className="billing-header-bar">
          <div className="back-btn-icon" onClick={onBack}>
            <ArrowLeft size={24} />
          </div>

          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              className="search-input"
              placeholder='Search "Milk" or scan...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchTerm) {
                  const p = products.find(prod => prod.barcode === searchTerm);
                  if (p) {
                    addProductToBill(p);
                    setSearchTerm("");
                  } else if (filteredProducts.length === 1) {
                    // If searching by name and only 1 remains, maybe add that too? 
                    // Let's stick to exact barcode for now to be safe.
                  }
                }
              }}
            />
          </div>

          <button className="scan-btn" onClick={() => setShowScanner(true)}>
            <ScanBarcode size={24} />
          </button>
        </div>

        {/* CUSTOMER SELECTOR (Optional) */}
        <div style={{ marginBottom: 16 }}>
          <select
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: '1px solid #e5e7eb', fontSize: '14px', background: 'white'
            }}
            value={selectedCustomer?.id || ""}
            onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === Number(e.target.value)))}
          >
            <option value="">Select Customer (Optional - for Loyalty/Credit)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
            ))}
          </select>
          {selectedCustomer && (
            <div style={{ fontSize: '12px', color: '#0c831f', marginTop: 4, fontWeight: 600 }}>
              Type: {paymentMode === 'KHATHA' ? 'Credit Bill' : 'Cash/UPI Sale'} • Loyalty Points: {selectedCustomer.loyaltyPoints}
            </div>
          )}
        </div>

        {/* PRODUCT GRID */}
        <div className="modern-product-grid">
          {filteredProducts.map(product => {
            const qtyInBill = getProductQtyInBill(product.id);

            return (
              <div key={product.id} className="modern-card">
                <div className="card-img-placeholder">
                  {/* Default Image for all products */}
                  <img src="/image1.png" alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                </div>

                <div className="card-info">
                  <div className="card-name" title={product.name}>{product.name}</div>
                  <div className="card-unit">
                    1 {product.productType === 'WEIGHT' ? 'kg' : product.productType === 'LIQUID' ? 'L' : 'Unit'}
                  </div>
                </div>

                <div className="card-footer">
                  <div className="card-price">₹{product.price}</div>

                  {qtyInBill === 0 ? (
                    <button className="add-btn" onClick={() => addProductToBill(product)}>
                      ADD
                    </button>
                  ) : (
                    <div className="qty-counter">
                      <button className="qty-btn" onClick={() => removeProductFromBill(product.id)}>−</button>
                      <input
                        className="qty-val"
                        type="number"
                        value={qtyInBill}
                        onChange={(e) => updateQty(product.id, e.target.value)}
                      />
                      <button className="qty-btn" onClick={() => addProductToBill(product)}>+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: CART DRAWER (Desktop) */}
      <div className={`billing-cart-drawer ${billItems.length === 0 ? 'hidden' : ''}`}>
        <CartContent
          billItems={billItems}
          total={total}
          subTotal={subTotal}
          gst={gst}
          grossTotal={grossTotal}
          removeProductFromBill={removeProductFromBill}
          updateQty={updateQty}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          paidAmount={paidAmount}
          setPaidAmount={setPaidAmount}
          saveBill={saveBill}
          selectedCustomer={selectedCustomer}
          redeemPoints={redeemPoints}
          setRedeemPoints={setRedeemPoints}
          availablePoints={availablePoints}
          dueAmount={dueAmount}
        />
      </div>

      {/* MOBILE FLOATING BAR */}
      {billItems.length > 0 && (
        <div className="mobile-cart-bar" onClick={() => setShowMobileCart(true)}>
          <div className="cart-bar-info">
            <span className="cart-bar-qty">{totalItems} ITEMS</span>
            <span className="cart-bar-total">₹{total}</span>
          </div>
          <div className="cart-bar-action">
            View Cart <ChevronRight size={18} />
          </div>
        </div>
      )}

      {/* MOBILE CART MODAL */}
      {showMobileCart && (
        <div className="mobile-cart-modal">
          <div className="mobile-cart-header">
            <button onClick={() => setShowMobileCart(false)} className="back-btn-icon" style={{ width: 32, height: 32, border: 'none' }}>
              <ArrowLeft />
            </button>
            Cart ({totalItems} Items)
          </div>
          <CartContent
            billItems={billItems}
            total={total}
            subTotal={subTotal}
            gst={gst}
            grossTotal={grossTotal}
            removeProductFromBill={removeProductFromBill}
            updateQty={updateQty}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
            saveBill={saveBill}
            selectedCustomer={selectedCustomer}
            redeemPoints={redeemPoints}
            setRedeemPoints={setRedeemPoints}
            availablePoints={availablePoints}
            dueAmount={dueAmount}
          />
        </div>
      )}

      {/* MODALS */}
      {showCustomerForm && (
        <div className="modal">
          <h3>New Customer</h3>
          <input placeholder="Name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
          <input placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="primary" style={{ flex: 1 }} onClick={saveCustomerAndBill}>Save</button>
            <button className="secondary" style={{ flex: 1 }} onClick={() => setShowCustomerForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {savedBill && <BillReceipt bill={savedBill} products={products} onClose={() => setSavedBill(null)} />}

      {showScanner && (
        <MobileScanner
          onClose={() => setShowScanner(false)}
          onScan={(code) => {
            const p = products.find(prod => prod.barcode === code);
            if (p) {
              addProductToBill(p);
              toast.success(`Added ${p.name}`);
            } else {
              toast.error("Product not found");
            }
          }}
        />
      )}

      {showUPIModal && (
        <UPIPaymentModal
          amount={total}
          customerName={selectedCustomer?.name}
          onClose={() => setShowUPIModal(false)}
          onPaymentConfirmed={() => {
            setShowUPIModal(false);
            saveBill(selectedCustomer?.id); // Proceed to save bill
          }}
        />
      )}

      {/* Hidden Thermal Receipt for Printing (Used by handlePrint in internal logic if needed, currently BillReceipt handles it) */}

    </div>
  );
}

// Swipeable Item Component
function SwipeableCartItem({ children, onRemove }) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // Only allow swipe left (diff < 0)
    if (diff < 0) {
      setOffset(Math.max(diff, -100)); // Limit swipe to -100px
    }
  };

  const handleTouchEnd = () => {
    if (offset < -60) { // Threshold to trigger remove
      if (window.confirm("Remove item?")) {
        onRemove();
      } else {
        setOffset(0);
      }
    }
    setOffset(0); // Always snap back visually after action
    startX.current = null;
  };

  return (
    <div className="swipe-container" style={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}>
      {/* Background (Delete Action) */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '100%',
        background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: '32px', color: 'white', borderRadius: '8px'
      }}>
        <Trash2 size={24} />
      </div>

      {/* Foreground Content */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: startX.current ? 'none' : 'transform 0.2s ease-out',
          background: 'white',
          position: 'relative',
          zIndex: 10,
          borderRadius: '8px' // Match card style
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Sub-component for Cart Content (Reused in Drawer & Mobile Modal)
function CartContent({
  billItems, total, subTotal, gst, grossTotal,
  removeProductFromBill, updateQty,
  paymentMode, setPaymentMode, paidAmount, setPaidAmount,
  saveBill, selectedCustomer, redeemPoints, setRedeemPoints, availablePoints, dueAmount
}) {
  return (
    <>
      <div className="cart-header">
        <h3>My Cart</h3>
        <span style={{ fontSize: 14, color: '#6b7280' }}>{billItems.length} Items</span>
      </div>

      <div className="cart-body">
        {billItems.map(item => (
          <SwipeableCartItem key={item.id} onRemove={() => removeProductFromBill(item.id)}>
            <div className="cart-item">
              <div className="cart-item-info">
                <span className="cart-item-name">{item.name}</span>
                <span className="cart-item-unit">₹{item.price} / {item.unit}</span>
              </div>

              <div className="qty-counter" style={{ height: 32 }}>
                <button className="qty-btn" onClick={() => removeProductFromBill(item.id)}>−</button>
                <input
                  className="qty-val"
                  style={{ width: 36, fontSize: 13 }}
                  type="number"
                  value={item.qty}
                  onChange={(e) => updateQty(item.id, e.target.value)}
                />
                <button className="qty-btn" onClick={() => updateQty(item.id, Number(item.qty) + 1)}>+</button>
              </div>

              <div className="cart-item-price">₹{Math.round(item.price * item.qty)}</div>
            </div>
          </SwipeableCartItem>
        ))}
      </div>

      <div className="cart-footer">
        <div className="bill-summary-row"><span>Item Total</span> <span>₹{subTotal}</span></div>
        <div className="bill-summary-row"><span>GST (5%)</span> <span>₹{gst}</span></div>
        {selectedCustomer && availablePoints > 0 && (
          <div className="bill-summary-row">
            <span>Redeem Points (Max {availablePoints})</span>
            <input
              type="number" style={{ width: 60, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
              value={redeemPoints} onChange={e => setRedeemPoints(Number(e.target.value))}
            />
          </div>
        )}
        <div className="bill-summary-row total"><span>To Pay</span> <span>₹{total}</span></div>

        <div className="payment-modes">
          {["CASH", "UPI", "KHATHA"].map(mode => (
            <button
              key={mode}
              className={paymentMode === mode ? 'active' : ''}
              onClick={() => setPaymentMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        {paymentMode === "KHATHA" && (
          <div style={{ marginBottom: 12 }}>
            <input
              type="number"
              className="search-input"
              placeholder="Custom Paid Amount"
              value={paidAmount}
              onChange={e => setPaidAmount(Number(e.target.value))}
            />
            <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Due: ₹{dueAmount}</div>
          </div>
        )}

        <button className="save-bill-btn" onClick={() => saveBill(selectedCustomer?.id)}>
          <ShoppingBag size={20} /> Place Order
        </button>
      </div>
    </>
  );
}

export default Billing;
