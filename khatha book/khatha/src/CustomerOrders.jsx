import { useState } from "react";
import { Clock, CheckCircle, Package, XCircle, X } from "lucide-react";
import axiosClient from "./api/axiosClient";
import { toast } from "react-toastify";
import "./CustomerApp.css";

function CustomerOrders({ orders, onRefresh }) {
    const [loading, setLoading] = useState(false);

    const cancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;

        try {
            setLoading(true);
            await axiosClient.put(`/orders/${orderId}/status`, null, {
                params: { status: "CANCELLED" }
            });
            toast.success("Order cancelled successfully");
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data || "Failed to cancel order");
        } finally {
            setLoading(false);
        }
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="empty-state">
                <h3>No orders yet 📦</h3>
                <p>Place your first order from the Shop!</p>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <h3 className="section-title">My Orders</h3>

            <div className="orders-list">
                {orders.map(order => {
                    const items = order.items ? JSON.parse(order.items) : [];
                    return (
                        <div key={order.id} className="order-card-detailed">
                            <div className="order-header-row">
                                <div className="order-id">
                                    <span className="label">Order ID</span>
                                    #{order.id}
                                    {order.retailerName && (
                                        <span className="retailer-badge" style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                            🏬 {order.retailerName}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {order.status === "PENDING" && (
                                        <button
                                            className="btn secondary small cancel-btn"
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '11px',
                                                background: '#fee2e2',
                                                color: '#ef4444',
                                                border: '1px solid #fecaca',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            onClick={() => cancelOrder(order.id)}
                                            disabled={loading}
                                        >
                                            <X size={12} /> Cancel
                                        </button>
                                    )}
                                    <OrderStatusBadge status={order.status} />
                                </div>
                            </div>

                            <div className="order-items-preview">
                                {items.map((item, idx) => (
                                    <div key={idx} className="order-item-line">
                                        <span>{item.qty} x {item.name}</span>
                                        <span>₹{item.total}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="order-footer">
                                <span className="date">
                                    {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                                    {" "}
                                    {new Date(order.orderDate || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="total-amount">₹ {order.totalAmount}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function OrderStatusBadge({ status }) {
    const config = {
        PENDING: { icon: Clock, color: "orange", bg: "#fff7ed" },
        PACKED: { icon: Package, color: "blue", bg: "#eff6ff" },
        COMPLETED: { icon: CheckCircle, color: "green", bg: "#f0fdf4" },
        DELIVERED: { icon: CheckCircle, color: "green", bg: "#f0fdf4" },
        CANCELLED: { icon: XCircle, color: "red", bg: "#fef2f2" }
    };

    const { icon: Icon, color, bg } = config[status] || config.PENDING;

    return (
        <span className="status-badge" style={{ color, background: bg }}>
            <Icon size={14} />
            {status}
        </span>
    );
}

export default CustomerOrders;
