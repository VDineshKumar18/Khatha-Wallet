import { useState } from "react";
import { notifyCustomer } from "./api/notificationApi";
import { updateCustomerEmail, deleteCustomer } from "./api/customerApi";
import { toast } from "react-toastify"; // ✅ Use react-toastify

function CustomerList({ customers = [], onBack, onSelectCustomer, title }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [emailInput, setEmailInput] = useState("");

  // ✅ SAFE FILTER (NO CRASH)
  const filteredCustomers = customers.filter(
    (c) =>
      c &&
      typeof c.name === "string" &&
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= NOTIFY ================= */
  const handleNotify = async (customer) => {
    if (!customer?.email) {
      toast.error("Email not available");
      return;
    }

    try {
      setSendingId(customer.id);
      await notifyCustomer(customer.id);

      toast.success(`Email sent to ${customer.email}`);
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  /* ================= UPDATE EMAIL ================= */
  const handleUpdateEmail = async (customerId) => {
    if (!emailInput.trim()) return;

    try {
      await updateCustomerEmail(customerId, emailInput.trim());

      toast.success("Email updated successfully");

      setEditingCustomerId(null);
      setEmailInput("");
    } catch {
      toast.error("Failed to update email");
    }
  };

  /* ================= DELETE CUSTOMER (FINAL & CORRECT) ================= */
  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm("Delete this customer permanently?")) return;

    try {
      await deleteCustomer(customerId);

      toast.success("Customer deleted successfully");
    } catch (err) {
      const backendMessage =
        err?.message || "Cannot delete customer";

      toast.error(backendMessage);
    }
  };

  const isSchemeView = title === "Monthly Savings Members";

  return (
    <div className="content">
      <button className="btn back small" onClick={onBack}>
        ⬅ Back
      </button>

      <div className="card mt-20">
        <div className="row-between">
          <h3>{title || "Customer List"}</h3>
          <input
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table className="modern-table desktop-only">
          <thead>
            <tr>
              <th>Name</th>
              <th>{isSchemeView ? "Saved" : "Due"}</th>
              <th>Email</th>
              <th>Notify</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" align="center">
                  No customers
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.name}
                    {c.isOnline && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '10px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>ONLINE</span>
                    )}
                  </td>

                  <td>
                    {isSchemeView ? (
                      <span className="status-badge received" style={{ background: '#dcfce7', color: '#166534' }}>
                        ₹{c.schemeCollectedAmount?.toFixed(2) || "0.00"}
                      </span>
                    ) : c.dueAmount > 0 ? (
                      <span className="status-badge due"> {c.dueAmount.toFixed(2)}</span>
                    ) : (
                      <span className="status-badge paid">PAID</span>
                    )}
                  </td>


                  {/* EMAIL */}
                  <td>
                    {editingCustomerId === c.id ? (
                      <div className="row">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                        />
                        <button
                          className="btn primary"
                          onClick={() => handleUpdateEmail(c.id)}
                        >
                          Save
                        </button>
                      </div>
                    ) : c.email ? (
                      c.email
                    ) : (
                      <button
                        className="btn warning"
                        onClick={() => {
                          setEditingCustomerId(c.id);
                          setEmailInput("");
                        }}
                      >
                        Update Email
                      </button>
                    )}
                  </td>

                  {/* NOTIFY */}
                  <td>
                    {c.dueAmount > 0 && !isSchemeView ? (
                      <button
                        className="btn reminder"
                        disabled={sendingId === c.id}
                        onClick={() => handleNotify(c)}
                      >
                        {sendingId === c.id ? "Sending..." : "Notify"}
                      </button>
                    ) : isSchemeView ? (
                      <button
                        className="btn reminder"
                        onClick={() => handleNotify(c)} // Allow notify for scheme too? Or maybe hide? keeping for now.
                      >
                        Notify
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* ACTION */}
                  <td>
                    <button
                      className="btn view"
                      onClick={() => onSelectCustomer(c)}
                    >
                      View
                    </button>

                    <button
                      className="btn danger"
                      disabled={c.dueAmount > 0} // Simplify delete logic?
                      title={
                        c.dueAmount > 0
                          ? "Cannot delete customer with bills"
                          : ""
                      }
                      onClick={() => handleDeleteCustomer(c.id)}
                      style={{ marginLeft: 6 }}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ✅ MOBILE CARD VIEW */}
        <div className="mobile-only">
          {filteredCustomers.map(c => (
            <div className="mobile-card" key={c.id}>
              {/* Row 1: Name (Left) & Status Badge (Right) */}
              <div className="mobile-card-row" style={{ alignItems: 'center', marginBottom: 12 }}>
                <span className="mobile-card-value font-bold" style={{ fontSize: '16px' }}>
                  {c.name}
                  {c.isOnline && (
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '9px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      verticalAlign: 'middle'
                    }}>ONLINE</span>
                  )}
                </span>

                {isSchemeView ? (
                  <span className="status-badge received" style={{ fontSize: '11px', background: '#dcfce7', color: '#166534' }}>SAVED: {c.schemeCollectedAmount?.toFixed(2)}</span>
                ) : c.dueAmount > 0 ? (
                  <span className="status-badge due" style={{ fontSize: '11px' }}>DUE: {c.dueAmount.toFixed(2)}</span>
                ) : (
                  <span className="status-badge paid" style={{ fontSize: '11px' }}>PAID</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  className="btn view small"
                  style={{ flex: 1 }}
                  onClick={() => onSelectCustomer(c)}
                >
                  View Details
                </button>

                {c.dueAmount > 0 && (
                  <button
                    className="btn reminder small"
                    style={{ flex: 1 }}
                    disabled={sendingId === c.id}
                    onClick={() => handleNotify(c)}
                  >
                    {sendingId === c.id ? "..." : "Notify"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CustomerList;
