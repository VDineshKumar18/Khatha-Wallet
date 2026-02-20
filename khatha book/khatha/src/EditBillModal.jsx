import { useState } from "react";
import { toast } from "react-toastify";
import axiosClient from "./api/axiosClient";

function EditBillModal({ bill, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        amount: bill.amount,
        paidAmount: bill.paidAmount || 0,
        status: bill.status,
        paymentMode: bill.paymentMode || "CASH"
    });
    const [loading, setLoading] = useState(false);

    const due = formData.amount - formData.paidAmount;

    const handleSave = async () => {
        try {
            setLoading(true);
            const retailerId = sessionStorage.getItem("retailerId");
            await axiosClient.put(`/bills/${bill.id}`, {
                ...formData,
                dueAmount: due,
                retailerId
            });
            onUpdate();
            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data || err.message;
            toast.error("Failed to update bill: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h3>Edit Bill #{bill.billNumber}</h3>

                <div className="form-group">
                    <label>Total Amount</label>
                    <input
                        type="number"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    />
                </div>

                <div className="form-group">
                    <label>Paid Amount</label>
                    <input
                        type="number"
                        value={formData.paidAmount}
                        onChange={e => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    />
                </div>

                <div className="form-group">
                    <label>Status</label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="PAID">PAID</option>
                        <option value="DUE">DUE</option>
                        <option value="PARTIAL">PARTIAL</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Payment Mode</label>
                    <select
                        value={formData.paymentMode}
                        onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                    >
                        <option value="CASH">CASH</option>
                        <option value="UPI">UPI</option>
                        <option value="KHATHA">KHATHA</option>
                    </select>
                </div>

                <p><strong>Due Amount:</strong> ₹{due}</p>

                <div className="modal-actions">
                    <button className="btn secondary" onClick={onClose} disabled={loading}>Cancel</button>
                    <button className="btn primary" onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditBillModal;
