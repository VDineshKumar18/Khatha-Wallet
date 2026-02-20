import { ArrowLeft, Search, Filter, Download, Eye, FileText, Image as ImageIcon, User, ArrowUpRight, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllBills } from "./api/billApi";
import { getProducts } from "./api/productApi";
import BillReceipt from "./BillReceipt";
import EditBillModal from "./EditBillModal";
import "./BillList.css";

function BillList({ onBack }) {
    const [bills, setBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBill, setSelectedBill] = useState(null);

    useEffect(() => {
        loadBills();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredBills(bills);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredBills(
                bills.filter(
                    (b) =>
                        b.billNumber?.toLowerCase().includes(lower) ||
                        b.customer?.name?.toLowerCase().includes(lower) ||
                        b.status?.toLowerCase().includes(lower)
                )
            );
        }
    }, [searchTerm, bills]);

    const loadBills = async () => {
        setLoading(true);
        try {
            const res = await getAllBills();
            setBills(res.data || []);
            setFilteredBills(res.data || []);
        } catch (err) {
            console.error("Failed to load bills", err);
        } finally {
            setLoading(false);
        }
    };



    // Load products for receipt
    const [products, setProducts] = useState([]);
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const retailerId = sessionStorage.getItem("retailerId");
                const res = await getProducts(retailerId);
                setProducts(res.data || []);
            } catch (e) {
                console.error("Failed to load products for receipt:", e);
            }
        };
        fetchProducts();
    }, []);

    // Wait, I will use a cleaner approach. 
    // I will replace the imports FIRST.


    // Export to Excel (CSV)
    const handleExport = () => {
        const csvRows = [];
        // Headers
        csvRows.push(["Date", "Bill No", "Customer", "Items", "Amount", "Paid", "Due", "Mode", "Status"]);

        bills.forEach(bill => {
            const date = new Date(bill.billDate || bill.createdAt).toLocaleDateString();
            const customer = bill.customer ? bill.customer.name : "Walk-in";
            // Escape commas in items
            const items = `"${(bill.items || "").replace(/"/g, '""')}"`;

            csvRows.push([
                date,
                bill.billNumber,
                customer,
                items,
                bill.amount,
                bill.paidAmount,
                bill.dueAmount,
                bill.paymentMode,
                bill.status
            ]);
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "bills_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [editingBill, setEditingBill] = useState(null);

    return (
        <div className="bill-list-container fade-in">
            {/* Header */}
            <div className="bill-list-header">
                <div className="header-left">
                    <h2>📜 All Bills</h2>
                    <p className="text-muted">{bills.length} Total Records</p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn outline small" onClick={handleExport}>
                        <Download size={16} /> Export Excel
                    </button>

                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            placeholder="Search by Bill #, Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && <X size={16} className="clear-search" onClick={() => setSearchTerm("")} />}
                    </div>
                </div>
            </div>

            {/* Content */}
            {/* Content */}
            <div className="table-wrapper">
                <div className="table-container">
                    <table className="modern-table desktop-only">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Bill No</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th>Receipt</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>Loading bills...</td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                                        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={48} opacity={0.2} />
                                            <p>No bills found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td>{new Date(bill.billDate || bill.createdAt).toLocaleDateString()}</td>
                                        <td className="font-mono">
                                            {bill.billNumber}
                                            {bill.billNumber?.startsWith('ORD-') && (
                                                <span className="badge" style={{ marginLeft: 8, background: '#3b82f6', color: 'white', fontSize: 11 }}>
                                                    🛒 Online Order
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {bill.customer ? (
                                                <div className="customer-cell">

                                                    <span>{bill.customer.name}</span>
                                                </div>
                                            ) : (
                                                <span className="badge gray">Walk-in</span>
                                            )}
                                        </td>
                                        <td className="truncate-cell" title={bill.items}>
                                            {bill.items && bill.items.length > 30 ? bill.items.substring(0, 30) + "..." : bill.items}
                                        </td>
                                        <td className="font-bold">₹{bill.amount}</td>
                                        <td>{bill.paymentMode}</td>
                                        <td>
                                            <span className={`status-badge ${bill.status === "PAID" ? "success" : bill.status === "PARTIAL" ? "warning" : "danger"}`}>
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="icon-btn" title="View Receipt" onClick={() => setSelectedBill(bill)}>
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                        <td>
                                            {bill.customer && (!bill.billNumber?.startsWith('ORD-') || bill.paymentMode === 'KHATHA') && (
                                                <button className="icon-btn" title="Edit Bill" onClick={() => setEditingBill(bill)}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        ✏️ Edit
                                                    </div>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* ✅ MOBILE CARD VIEW */}
                    <div className="mobile-only">
                        {filteredBills.map(bill => (
                            <div className="mobile-card" key={bill.id}>
                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">
                                        #{bill.billNumber}
                                        {bill.billNumber?.startsWith('ORD-') && (
                                            <span className="badge" style={{ marginLeft: 6, background: '#3b82f6', color: 'white', fontSize: 10, padding: '2px 6px' }}>
                                                🛒 Online
                                            </span>
                                        )}
                                    </span>
                                    <span className="mobile-card-value">{new Date(bill.billDate || bill.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className="mobile-card-row">
                                    <span style={{ fontWeight: 'bold' }}>
                                        {bill.customer ? bill.customer.name : "Walk-in"}
                                    </span>
                                    <span style={{ fontWeight: 'bold' }}>₹{bill.amount}</span>
                                </div>

                                <div className="mobile-card-row">
                                    <span className="mobile-card-label">Status</span>
                                    <span className={`status-badge ${bill.status === "PAID" ? "success" : bill.status === "PARTIAL" ? "warning" : "danger"}`}>
                                        {bill.status}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                    <button
                                        className="btn outline small"
                                        style={{ flex: 1 }}
                                        onClick={() => setSelectedBill(bill)}
                                    >
                                        View Bill
                                    </button>
                                    {bill.customer && (!bill.billNumber?.startsWith('ORD-') || bill.paymentMode === 'KHATHA') && (
                                        <button
                                            className="btn outline small"
                                            style={{ flex: 1 }}
                                            onClick={() => setEditingBill(bill)}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bill Modal */}
            {selectedBill && (
                <BillReceipt
                    bill={selectedBill}
                    products={products}
                    onClose={() => setSelectedBill(null)}
                />
            )}

            {/* Edit Modal */}
            {editingBill && (
                <EditBillModal
                    bill={editingBill}
                    onClose={() => setEditingBill(null)}
                    onUpdate={loadBills}
                />
            )}
        </div>
    );
}

export default BillList;
