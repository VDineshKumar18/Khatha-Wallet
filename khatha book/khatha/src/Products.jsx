import { useEffect, useState } from "react";
import axiosClient from "./api/axiosClient";
import MobileScanner from "./MobileScanner";
import { toast } from "react-toastify";
import {
  ArrowLeft, Search, Plus, Trash2, Edit2,
  Package, ScanBarcode, ChevronLeft, ChevronRight, Filter, Printer, ChevronUp, AlertTriangle, XCircle, CheckCircle
} from "lucide-react";
import Barcode from "react-barcode";
import { createRoot } from "react-dom/client";
import { scanProduct } from "./api/productApi"; // ✅ IMPORT

import "./product.css";

/* ================= CATEGORY LIST ================= */
const PRODUCT_CATEGORIES = [
  { value: "FRUITS_VEGETABLES", label: "Fruits & Vegetables" },
  { value: "STAPLES_GRAINS", label: "Staples & Grains" },
  { value: "SPICES_MASALAS", label: "Spices & Masalas" },
  { value: "COOKING_OILS_GHEE", label: "Cooking Oils & Ghee" },
  { value: "DAIRY_PRODUCTS", label: "Dairy Products" },
  { value: "BAKERY_BREAD", label: "Bakery & Bread" },
  { value: "SNACKS_PACKAGED", label: "Snacks & Packaged Foods" },
  { value: "READY_TO_EAT", label: "Ready to Eat / Cook" },
  { value: "MEAT_FISH_EGGS", label: "Meat, Fish & Eggs" },
  { value: "BEVERAGES", label: "Beverages" },
  { value: "PERSONAL_CARE", label: "Personal Care" },
  { value: "HOUSEHOLD_CLEANING", label: "Household & Cleaning" },
  { value: "BABY_CARE", label: "Baby Care" },
  { value: "HEALTH_WELLNESS", label: "Health & Wellness" },
  { value: "PET_CARE", label: "Pet Care" },
  { value: "PAPER_DISPOSABLES", label: "Paper & Disposables" },
  { value: "SEASONAL_FESTIVAL", label: "Seasonal & Festival" },
  { value: "MISCELLANEOUS", label: "Miscellaneous" }
];

const LOW_STOCK_THRESHOLD = 10;

function Products({ onBack }) {
  const retailerId = sessionStorage.getItem("retailerId");
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    barcode: "", // ✅ NEW
    price: "",
    priceQuantity: "1", // ✅ Default to 1 unit
    productType: "WEIGHT",
    category: "",
    bagSizeKg: "",
    packetsPerBox: "",
    packetSize: "",
    unitsPerBox: "",
    boxes: ""
  });

  const loadProducts = async () => {
    const res = await axiosClient.get("/products", {
      params: { retailerId }
    });
    setProducts(res.data || []);
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const res = await scanProduct(file);
      const { id, name, ocrText } = res.data;

      if (id) {
        // Product exists
        toast.success(`✅ Product Found: ${name}`);
        setSearchTerm(name); // Filter to show it
      } else {
        // Product Unknown
        let likelyName = "";

        // Relaxes logic: Accept any OCR text > 0 length
        if (ocrText && ocrText.trim().length > 0) {
          const rawFirstLine = ocrText.split('\n')[0].trim();
          // Less aggressive cleaning: Keep % and . for measurements (e.g. 50% 1.5L)
          likelyName = rawFirstLine.replace(/[^a-zA-Z0-9 %.-]/g, "").trim();

          if (likelyName.length === 0) likelyName = rawFirstLine; // Fallback to raw if regex fails

          toast.info(`ℹ️ New Product Detected via OCR: "${likelyName}"`);
        } else if (name !== "UNKNOWN") {
          likelyName = name;
          toast.info(`ℹ️ New Product Detected by AI: "${likelyName}"`);
        } else {
          toast.warn("⚠️ Product Unknown. Please enter details manualy.");
        }

        setShowAddForm(true);
        setNewProduct(prev => ({
          ...prev,
          name: likelyName
        }));
      }

    } catch (err) {
      console.error(err);
      toast.error("❌ AI Scan Failed");
    } finally {
      setIsScanning(false);
      e.target.value = null; // Reset input
    }
  };



  const addProduct = async () => {
    const { name, barcode, price, productType, category, boxes, priceQuantity } = newProduct;

    if (!name || !price || !category || !boxes) {
      toast.error("Name, price, category and initial boxes are required");
      return;
    }

    // ✅ Calculate Unit Price
    const qty = Number(priceQuantity) || 1;
    if (qty <= 0) {
      toast.error("Price quantity must be greater than 0");
      return;
    }
    const unitPrice = Number(price) / qty;

    const payload = { name, price: unitPrice, productType, category, barcode }; // ✅ Use Calculated Unit Price

    if (productType === "WEIGHT") {
      if (!newProduct.bagSizeKg) {
        toast.error("Bag size required");
        return;
      }
      payload.bagSizeKg = Number(newProduct.bagSizeKg);
    }

    if (productType === "LIQUID") {
      if (!newProduct.packetsPerBox || !newProduct.packetSize) {
        toast.error("Liquid configuration required");
        return;
      }
      payload.packetsPerBox = Number(newProduct.packetsPerBox);
      payload.packetSize = Number(newProduct.packetSize);
    }

    if (productType === "UNIT") {
      if (!newProduct.unitsPerBox) {
        toast.error("Units per box required");
        return;
      }
      payload.unitsPerBox = Number(newProduct.unitsPerBox);
    }

    await axiosClient.post("/products", payload, {
      params: { retailerId, boxes }
    });

    setNewProduct({
      name: "",
      barcode: "",
      price: "",
      priceQuantity: "1", // ✅ Reset to 1
      productType: "WEIGHT",
      category: "",
      bagSizeKg: "",
      packetsPerBox: "",
      packetSize: "",
      unitsPerBox: "",
      boxes: ""
    });

    loadProducts();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axiosClient.delete(`/products/${id}`, {
        params: { retailerId }
      });
      toast.success("Product deleted");
      loadProducts();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete product");
    }
  };

  const addStock = async (product, boxes) => {
    if (!boxes || boxes <= 0) {
      toast.error("Enter valid boxes");
      return;
    }

    if (
      (product.productType === "WEIGHT" && !product.bagSizeKg) ||
      (product.productType === "LIQUID" &&
        (!product.packetsPerBox || !product.packetSize)) ||
      (product.productType === "UNIT" && !product.unitsPerBox)
    ) {
      toast.error("Stock configuration missing. Edit product first.");
      return;
    }

    await axiosClient.post(
      `/products/${product.id}/add-stock`,
      null,
      { params: { boxes } }
    );

    loadProducts();
  };

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= LOW_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? p.category === filterCategory : true;
    const matchesLowStock = filterLowStock ? p.quantity <= LOW_STOCK_THRESHOLD : true;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handlePrintBarcode = (product) => {
    if (!product.barcode) {
      toast.error("No barcode to print");
      return;
    }

    const printWindow = window.open("", "_blank", "width=400,height=400");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              font-family: Arial, sans-serif;
            }
            .label { text-align: center; }
            .name { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
            .price { font-size: 12px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${product.name}</div>
            <div id="barcode-container"></div>
            <div class="price">Rs. ${product.price}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Render React component into the new window
    const container = printWindow.document.getElementById("barcode-container");
    const root = createRoot(container);
    root.render(
      <Barcode
        value={product.barcode}
        width={1.5}
        height={40}
        fontSize={12}
      />
    );

    // Wait for render then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="products-page">

      {/* HEADER */}
      {/* HEADER */}
      <div className="products-header">
        <div className="header-left">
          <h2>📦 Inventory</h2>
          <p>Manage your stock levels and pricing</p>
        </div>
        <div className="header-actions">
          <div style={{ position: 'relative' }}>
            <input
              type="file"
              accept="image/*"
              id="ai-scan-input"
              style={{ display: 'none' }}
              onChange={handleScan}
            />
            <button
              className="btn secondary icon-btn"
              onClick={() => document.getElementById('ai-scan-input').click()}
              disabled={isScanning}
            >
              {isScanning ? <span className="spinner-small" /> : <ScanBarcode size={18} />}
              {isScanning ? "Scanning..." : "Scan Product"}
            </button>
          </div>

          <button
            className={`btn ${showAddForm ? 'secondary' : 'primary'} icon-btn`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? <ChevronUp size={18} /> : <Plus size={18} />}
            {showAddForm ? "Close Form" : "New Product"}
          </button>
          <button className="btn ghost icon-btn" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>

      {/* ✅ INVENTORY STATS CARDS */}
      <div className="inventory-stats">
        <div className="stat-card blue">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{totalProducts}</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Low Stock</span>
            <span className="stat-value">{lowStockCount}</span>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Out of Stock</span>
            <span className="stat-value">{outOfStockCount}</span>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-wrapper">
          <Filter className="filter-icon" size={16} />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {PRODUCT_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* LOW STOCK FILTER BUTTON */}
        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 600, fontSize: '13px', border: '1.5px solid',
            borderColor: filterLowStock ? '#ef4444' : '#e5e7eb',
            background: filterLowStock ? '#fef2f2' : 'white',
            color: filterLowStock ? '#ef4444' : '#374151',
            whiteSpace: 'nowrap'
          }}
        >
          🔴 Low Stock
          {lowStockCount > 0 && (
            <span style={{
              background: filterLowStock ? '#ef4444' : '#fee2e2',
              color: filterLowStock ? 'white' : '#ef4444',
              borderRadius: '20px', padding: '1px 7px', fontSize: '12px', fontWeight: 700
            }}>
              {lowStockCount}
            </span>
          )}
        </button>
      </div>

      {/* ADD PRODUCT CARD */}
      {/* ADD PRODUCT CARD */}
      {showAddForm && (
        <div className="products-card add-product-section slide-down">
          <div className="card-header">
            <h3>Add New Product</h3>
          </div>

          <div className="add-product-row">
            {/* ALL INPUTS EXACT SAME — NO LOGIC CHANGE */}

            <input
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />

            <input
              placeholder="Barcode (Optional)"
              value={newProduct.barcode}
              onChange={(e) =>
                setNewProduct({ ...newProduct, barcode: e.target.value })
              }
            />

            <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: '300px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>Price (₹)</label>
                <input
                  placeholder="e.g. 100"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>
                  For Qty ({newProduct.productType === 'WEIGHT' ? 'kg' : newProduct.productType === 'LIQUID' ? 'L' : 'Units'})
                </label>
                <input
                  placeholder="e.g. 1"
                  type="number"
                  value={newProduct.priceQuantity}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, priceQuantity: e.target.value })
                  }
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <select
              value={newProduct.productType}
              onChange={(e) =>
                setNewProduct({ ...newProduct, productType: e.target.value })
              }
            >
              <option value="WEIGHT">Weight</option>
              <option value="LIQUID">Liquid</option>
              <option value="UNIT">Unit</option>
            </select>

            <select
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
            >
              <option value="">Select Category</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {newProduct.productType === "WEIGHT" && (
              <input
                type="number"
                placeholder="Bag size (kg)"
                value={newProduct.bagSizeKg}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, bagSizeKg: e.target.value })
                }
              />
            )}

            {newProduct.productType === "LIQUID" && (
              <>
                <input
                  type="number"
                  placeholder="Packets / box"
                  value={newProduct.packetsPerBox}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, packetsPerBox: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Packet size (L)"
                  value={newProduct.packetSize}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, packetSize: e.target.value })
                  }
                />
              </>
            )}

            {newProduct.productType === "UNIT" && (
              <input
                type="number"
                placeholder="Units / box"
                value={newProduct.unitsPerBox}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, unitsPerBox: e.target.value })
                }
              />
            )}

            <input
              type="number"
              placeholder="Initial boxes"
              value={newProduct.boxes}
              onChange={(e) =>
                setNewProduct({ ...newProduct, boxes: e.target.value })
              }
            />

            <div className="form-actions-row">
              <button className="btn primary large-btn" onClick={addProduct}>
                <Plus size={18} />
                Add Product to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT TABLE CARD */}
      <div className="products-card desktop-table">
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Barcode</th>
              <th>Total Stock</th>
              <th>Add Stock</th>
              <th className="action-col">Action</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  {searchTerm ? "No products found" : "No products added yet"}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onAddStock={addStock}
                  onDelete={deleteProduct}
                  onPrint={handlePrintBarcode}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== MOBILE CARDS ===== */}
      <div className="mobile-cards">
        {filteredProducts.map((p) => (
          <div key={p.id} className="mobile-product-card">
            <div className="card-top">
              <div>
                <div className="card-title">{p.name}</div>
                <span className="category-badge">{p.category.replace("_", " ")}</span>
              </div>
              <div className="card-price">₹ {p.price}</div>
            </div>

            <div className="card-barcode">
              {p.barcode && <Barcode value={p.barcode} height={30} width={1.5} fontSize={10} displayValue={false} />}
            </div>

            <div className="product-info-row" style={{ fontSize: '12px', color: '#64748b', margin: '5px 0' }}>
              Stock: <b>{p.quantity} {p.productType === 'WEIGHT' ? 'kg' : p.productType === 'LIQUID' ? 'L' : 'pcs'}</b>
            </div>

            <div className="card-actions">
              <div className="action-buttons" style={{ width: '100%', justifyContent: 'space-between' }}>
                <button className="btn small" onClick={() => {
                  const boxes = prompt("Enter boxes to add:");
                  if (boxes) addStock(p, parseInt(boxes));
                }}>+ Stock</button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* ✅ MOBILE PRINT BUTTON */}
                  {p.barcode && (
                    <button className="btn secondary small icon-btn" onClick={() => handlePrintBarcode(p)} title="Print Barcode">
                      <Printer size={16} />
                    </button>
                  )}

                  <button className="edit-btn small" onClick={() => {
                    toast.info("Please switch to desktop to edit details or delete, or use the row below");
                  }}>Edit</button>

                  <button className="btn delete-btn small" onClick={() => deleteProduct(p.id)}>🗑</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* PRODUCT ROW */
function ProductRow({ product, onAddStock, onDelete, onPrint }) { // ✅ Receive onPrint
  const [boxes, setBoxes] = useState("");
  const [editing, setEditing] = useState(false);

  const [editData, setEditData] = useState({
    price: product.price,
    category: product.category,
    bagSizeKg: product.bagSizeKg || "",
    packetSize: product.packetSize || "",
    packetsPerBox: product.packetsPerBox || "",
    unitsPerBox: product.unitsPerBox || ""
  });

  const saveEdit = async () => {
    try {
      await axiosClient.put(`/products/${product.id}`, editData);
      toast.success("✅ Product updated");
      setEditing(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    }
  };

  const unit =
    product.productType === "WEIGHT"
      ? "kg"
      : product.productType === "LIQUID"
        ? "L"
        : "pcs";

  return (
    <tr>
      <td>{product.name}</td>

      <td>
        {editing ? (
          <select
            value={editData.category}
            onChange={(e) =>
              setEditData({ ...editData, category: e.target.value })
            }
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="category-badge">
            {product.category.replaceAll("_", " ")}
          </span>
        )}
      </td>

      <td>
        {editing ? (
          <input
            type="number"
            value={editData.price}
            onChange={(e) =>
              setEditData({ ...editData, price: e.target.value })
            }
          />
        ) : (
          `₹ ${product.price}`
        )}
      </td>

      {/* ✅ BARCODE COLUMN */}
      <td style={{ textAlign: "center" }}>
        {product.barcode ? (
          <Barcode
            value={product.barcode}
            height={30}
            width={1}
            fontSize={10}
            margin={0}
          />
        ) : (
          <span style={{ color: "#ccc", fontSize: "12px" }}>No Barcode</span>
        )}
      </td>

      <td>
        <span style={{
          color: product.quantity <= LOW_STOCK_THRESHOLD ? '#ef4444' : 'inherit',
          fontWeight: product.quantity <= LOW_STOCK_THRESHOLD ? 700 : 'normal'
        }}>
          {product.quantity} {unit}
          {product.quantity <= LOW_STOCK_THRESHOLD && (
            <span style={{ marginLeft: 6, background: '#fef2f2', color: '#ef4444', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', border: '1px solid #fecaca' }}>Low</span>
          )}
        </span>
      </td>

      <td>
        <div className="add-stock-box">
          <input
            type="number"
            placeholder="Boxes"
            value={boxes}
            onChange={(e) => setBoxes(e.target.value)}
          />
          <button onClick={() => onAddStock(product, boxes)}>
            Add
          </button>
        </div>
      </td>

      <td className="action-col">
        {editing ? (
          <>
            <div className="edit-actions-column">
              {product.productType === "WEIGHT" && (
                <div className="edit-input-group">
                  <label>Bag Size (kg)</label>
                  <input
                    type="number"
                    className="small-input"
                    value={editData.bagSizeKg}
                    onChange={(e) =>
                      setEditData({ ...editData, bagSizeKg: e.target.value })
                    }
                  />
                </div>
              )}

              {product.productType === "LIQUID" && (
                <div className="edit-input-group">
                  <label>Packets/Box & Size(L)</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      placeholder="Pks"
                      className="small-input"
                      value={editData.packetsPerBox}
                      onChange={(e) =>
                        setEditData({ ...editData, packetsPerBox: e.target.value })
                      }
                    />
                    <input
                      placeholder="Size"
                      className="small-input"
                      value={editData.packetSize}
                      onChange={(e) =>
                        setEditData({ ...editData, packetSize: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {product.productType === "UNIT" && (
                <div className="edit-input-group">
                  <label>Units/Box</label>
                  <input
                    type="number"
                    className="small-input"
                    value={editData.unitsPerBox}
                    onChange={(e) =>
                      setEditData({ ...editData, unitsPerBox: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="edit-btns">
                <button className="btn primary small" onClick={saveEdit}>Save</button>
                <button className="btn ghost small" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          </>
        ) : (
          <button className="edit-btn" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}

        {/* ACTION BUTTONS ROW */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {/* ✅ DESKTOP PRINT BUTTON */}
          {product.barcode && (
            <button
              className="btn ghost icon-btn"
              onClick={() => onPrint(product)}
              title="Print Barcode"
            >
              <Printer size={16} color="#475569" />
            </button>
          )}

          <button
            className="btn ghost icon-btn delete-btn"
            onClick={() => onDelete(product.id)}
            title="Delete Product"
          >
            <Trash2 size={16} color="#ef4444" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default Products;
