import { useState } from "react";
import { toast } from "react-toastify";
import { makePayment } from "./api/paymentApi";

function PaymentModal({ customerId, totalAmount, onClose, onSuccess }) {
  const [paymentType, setPaymentType] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState(totalAmount);

  const handlePay = async () => {
    if (paidAmount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    try {
      await makePayment({
        customerId,
        amount: paidAmount,
        mode: paymentType,
      });

      toast.success("Payment recorded successfully");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Payment failed");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Make Payment</h3>

        <label>Payment Mode</label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
        </select>

        <label>Amount</label>
        <input
          type="number"
          value={paidAmount}
          onChange={(e) => setPaidAmount(Number(e.target.value))}
        />

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={handlePay}>
            Pay
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
