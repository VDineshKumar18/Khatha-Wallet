function InvoicePreview({ customer, billItems, total, billNumber, status, paidAmount, dueAmount, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card invoice" id="invoice-print">
        <h2>Khatha Book</h2>

        <p><b>Bill No:</b> {billNumber}</p>
        <p><b>Status:</b> {status}</p>
        <p><b>Customer:</b> {customer?.name || "Cash Sale"}</p>
        <p><b>Date:</b> {new Date().toLocaleDateString()}</p>

        <table className="modern-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {billItems.map((i, idx) => (
              <tr key={idx}>
                <td>{i.name}</td>
                <td>{i.qty}</td>
                <td>₹ {i.price}</td>
                <td>₹ {i.price * i.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ textAlign: "right" }}>Total: ₹ {total}</h3>
        <p>Paid: ₹ {paidAmount}</p>
        <p>Due: ₹ {dueAmount}</p>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn primary" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoicePreview;
