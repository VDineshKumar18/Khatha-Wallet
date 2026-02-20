import { useState, useEffect } from "react";
import axiosClient from "./api/axiosClient";
import { toast } from "react-toastify"; // ✅ Import react-toastify
import { Package, CheckCircle, Clock, XCircle } from "lucide-react";

function RetailerOrderManager({ onBack }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null); // ✅ NEW STATE

    useEffect(() => {
        loadOrders();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadOrders = async () => {
        try {
            const retailerId = sessionStorage.getItem("retailerId");
            if (!retailerId) return;

            const res = await axiosClient.get(`/orders/retailer/${retailerId}`);
            setOrders(res.data || []);
        } catch (err) {
            console.error("Failed to load orders", err);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        let otp = null;

        // ✅ PROMPT FOR OTP ON DELIVERY
        if (newStatus === "DELIVERED") {
            otp = prompt("🔐 Enter Delivery OTP provided by Customer:");
            if (!otp) return; // Cancel if no OTP entered
        }

        try {
            setLoading(true);
            await axiosClient.put(`/orders/${orderId}/status`, null, {
                params: {
                    status: newStatus,
                    otp: otp
                }
            });

            toast.success(`Order marked as ${newStatus}`); // ✅ Use toast.success
            loadOrders(); // Refresh
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data || "Failed to update status";
            toast.error(errorMsg); // ✅ Use toast.error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content">
            <div className="row-between mb-20">
                <button className="btn back small" onClick={onBack}>⬅ Back</button>
                <h2>📦 Online Orders</h2>
            </div>

            <div className="card">
                {orders.length === 0 ? (
                    <div className="empty-state">No active orders</div>
                ) : (
                    <>
                        {/* ✅ DESKTOP TABLE */}
                        <table className="modern-table desktop-only">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Time</th>
                                    <th>Items</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => {
                                    const items = order.items ? JSON.parse(order.items) : [];
                                    const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

                                    return (
                                        <tr key={order.id}>
                                            <td>#{order.id}</td>
                                            <td>
                                                <div className="customer-info">
                                                    <strong>{order.customerName || "Customer"}</strong>
                                                    {order.customerPhone && (
                                                        <a href={`tel:${order.customerPhone}`} className="phone-link">
                                                            📞 {order.customerPhone}
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>
                                                <div className="item-summary" title={items.map(i => `${i.qty}x ${i.name}`).join(", ")} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{itemCount} items</span>
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        title="View Items"
                                                        style={{
                                                            background: '#eef2ff',
                                                            color: '#4f46e5',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            padding: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Package size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>₹ {order.totalAmount}</td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    color: order.paymentMode === 'KHATHA' ? '#ea580c' : '#059669',
                                                    background: order.paymentMode === 'KHATHA' ? '#fff7ed' : '#ecfdf5',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                }}>
                                                    {order.paymentMode || 'COD'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-row">
                                                    {order.status === "PENDING" && (
                                                        <div className="action-row" style={{ gap: '8px', display: 'flex' }}>
                                                            <button
                                                                className="btn primary small"
                                                                onClick={() => updateStatus(order.id, "PACKED")}
                                                                disabled={loading}
                                                            >
                                                                📦 Mark Packed
                                                            </button>
                                                            <button
                                                                className="btn secondary small"
                                                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                                                onClick={() => {
                                                                    if (window.confirm("Are you sure you want to cancel this order?")) {
                                                                        updateStatus(order.id, "CANCELLED");
                                                                    }
                                                                }}
                                                                disabled={loading}
                                                            >
                                                                ✖ Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                    {order.status === "PACKED" && (
                                                        <button
                                                            className="btn success small"
                                                            onClick={() => updateStatus(order.id, "DELIVERED")}
                                                            disabled={loading}
                                                        >
                                                            ✅ Mark Delivered
                                                        </button>
                                                    )}
                                                    {(order.status === "COMPLETED" || order.status === "DELIVERED") && (
                                                        <span style={{ color: '#aaa' }}>-</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* ✅ MOBILE CARD VIEW */}
                        <div className="mobile-only">
                            {orders.map(order => (
                                <div className="mobile-card" key={order.id}>
                                    <div className="mobile-card-row">
                                        <span className="mobile-card-label">Order #{order.id}</span>
                                        <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                                    </div>

                                    <div className="mobile-card-row">
                                        <span style={{ fontWeight: 'bold' }}>{order.customerName}</span>
                                        <span style={{ fontWeight: 'bold' }}>₹ {order.totalAmount}</span>
                                    </div>

                                    <div className="mobile-card-row">
                                        <span className="mobile-card-label">Time</span>
                                        <span className="mobile-card-value">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                        <button
                                            className="btn outline small"
                                            style={{ flex: 1 }}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            View Items
                                        </button>

                                        {order.status === "PENDING" && (
                                            <>
                                                <button
                                                    className="btn primary small"
                                                    style={{ flex: 1 }}
                                                    onClick={() => updateStatus(order.id, "PACKED")}
                                                >
                                                    📦 Pack
                                                </button>
                                                <button
                                                    className="btn secondary small"
                                                    style={{ flex: 1, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                                    onClick={() => {
                                                        if (window.confirm("Are you sure you want to cancel this order?")) {
                                                            updateStatus(order.id, "CANCELLED");
                                                        }
                                                    }}
                                                >
                                                    ✖ Cancel
                                                </button>
                                            </>
                                        )}
                                        {order.status === "PACKED" && (
                                            <button
                                                className="btn success small"
                                                style={{ flex: 1 }}
                                                onClick={() => updateStatus(order.id, "DELIVERED")}
                                            >
                                                ✅ Deliver
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ✅ ITEMS MODAL */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}

function OrderDetailsModal({ order, onClose }) {
    const items = order.items ? JSON.parse(order.items) : [];

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>📦 Order #{order.id} Items</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="customer-summary mb-20" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                        <p><strong>Customer:</strong> {order.customerName}</p>
                        {order.customerPhone && <p><strong>Phone:</strong> {order.customerPhone}</p>}
                        <p><strong>Total Amount:</strong> ₹{order.totalAmount}</p>
                    </div>

                    <table className="modern-table" style={{ fontSize: '14px' }}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.qty}</td>
                                    <td>₹{item.price}</td>
                                    <td>₹{item.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="modal-footer">
                    <button className="btn secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default RetailerOrderManager;
