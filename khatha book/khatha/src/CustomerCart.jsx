import { useState } from "react";
import axiosClient from "./api/axiosClient";
import { Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "react-toastify"; // ✅ Import react-toastify
import "./CustomerApp.css";

function CustomerCart({ cart, account, addToCart, removeFromCart, clearCart, onOrderPlaced }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [paymentMode, setPaymentMode] = useState("COD"); // ✅ Payment State

    const cartItems = Object.values(cart);
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const placeOrder = async () => {
        if (cartItems.length === 0) return;

        // 1. Group items by Retailer ID
        const ordersByRetailer = {};
        cartItems.forEach(item => {
            const rId = item.retailer ? item.retailer.id : (account ? account.retailerId : null);
            if (!rId) return;

            if (!ordersByRetailer[rId]) {
                ordersByRetailer[rId] = {
                    retailerId: rId,
                    items: [],
                    total: 0
                };
            }

            ordersByRetailer[rId].items.push({
                barcode: item.barcode, // ✅ ADDED BARCODE
                name: item.name,
                qty: item.qty,
                price: item.price,
                total: item.price * item.qty
            });
            ordersByRetailer[rId].total += (item.price * item.qty);
        });

        try {
            setLoading(true);
            setError("");

            // 2. Send separate requests for each retailer
            console.log("DEBUG: Placing Orders", ordersByRetailer); // ✅ DEBUG LOG

            const promises = Object.values(ordersByRetailer).map(group => {
                const itemsJson = JSON.stringify(group.items);
                console.log("DEBUG: Sending Items JSON:", itemsJson); // ✅ DEBUG LOG

                return axiosClient.post("/orders/create", {
                    customerId: account.customerId,
                    retailerId: group.retailerId,
                    items: itemsJson, // ✅ USE THE JSON STRING
                    totalAmount: group.total,
                    paymentMode: paymentMode // ✅ Send Payment Mode
                });
            });

            await Promise.all(promises);

            setLoading(false);
            clearCart();
            toast.success(`Order placed successfully via ${paymentMode}!`); // ✅ Use toast.success
            onOrderPlaced();
        } catch (err) {
            console.error("Order failed", err);
            setError("Failed to place some orders. Please try again.");
            setLoading(false);
            toast.error("Order failed. Please try again."); // ✅ Add error toast
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="empty-state">
                <h3>Your cart is empty 🛒</h3>
                <p>Go to Shop Items to add products.</p>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h3 className="section-title">Your Cart</h3>

            <div className="cart-items-list">
                {cartItems.map(item => (
                    <div key={item.barcode} className="cart-item-row">
                        <div className="item-info">
                            <h4>{item.name}</h4>
                            <p>₹ {item.price} x {item.qty}</p>
                        </div>

                        <div className="item-actions">
                            <div className="qty-control small">
                                <button onClick={() => removeFromCart(item.barcode)}>
                                    <Minus size={14} />
                                </button>
                                <span>{item.qty}</span>
                                <button onClick={() => addToCart(item)}>
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="item-total">
                                ₹ {item.price * item.qty}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="cart-summary">
                {/* ✅ Payment Selection */}
                <div className="payment-section" style={{ marginBottom: '15px' }}>
                    <h4>Payment Method</h4>
                    <div className="payment-options">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="payment"
                                value="COD"
                                checked={paymentMode === "COD"}
                                onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <span>Cash on Delivery</span>
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="payment"
                                value="UPI"
                                checked={paymentMode === "UPI"}
                                onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <span>UPI</span>
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="payment"
                                value="KHATHA"
                                checked={paymentMode === "KHATHA"}
                                onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <span>Khatha (Credit)</span>
                        </label>
                    </div>
                </div>

                <div className="summary-row total">
                    <span>Total Amount</span>
                    <span>₹ {cartTotal}</span>
                </div>

                {error && <p className="error-text">{error}</p>}

                <button
                    className="checkout-btn"
                    onClick={placeOrder}
                    disabled={loading}
                >
                    {loading ? "Placing Order..." : `Place Order (${paymentMode})`}
                </button>
            </div>
        </div>
    );
}

export default CustomerCart;
