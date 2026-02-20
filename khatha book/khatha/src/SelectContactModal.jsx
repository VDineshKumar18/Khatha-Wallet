import { useState } from "react";
import { X, Search, Check } from "lucide-react";

function SelectContactModal({ contacts, onClose, onSelect }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredContacts = contacts.filter((c) =>
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="modal">
            <div className="modal-box animate-scale" style={{ maxWidth: "500px" }}>
                <div className="modal-header row-between">
                    <h3>Select Contact</h3>
                    <button className="icon-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="search-bar" style={{ margin: "10px 0" }}>
                    <Search size={16} className="search-icon" />
                    <input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: "100%", padding: "8px 8px 8px 30px" }}
                    />
                </div>

                <div className="contact-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {filteredContacts.length === 0 ? (
                        <p className="muted" style={{ textAlign: "center", padding: "20px" }}>
                            No contacts found
                        </p>
                    ) : (
                        filteredContacts.map((contact, index) => (
                            <div
                                key={index}
                                className="contact-item row-between"
                                onClick={() => onSelect(contact)}
                                style={{
                                    padding: "10px",
                                    borderBottom: "1px solid #eee",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: "bold" }}>{contact.name || "Unknown"}</div>
                                    <div style={{ fontSize: "12px", color: "#666" }}>
                                        {contact.email || contact.phone || "No details"}
                                    </div>
                                </div>
                                <button className="btn small ghost">
                                    Select
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-footer" style={{ marginTop: "10px", textAlign: "right" }}>
                    <button className="btn" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SelectContactModal;
