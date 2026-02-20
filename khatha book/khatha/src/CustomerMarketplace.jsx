import { useState, useEffect } from "react";
import { Plus, Minus, Store, Grid, Tag, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { getAllProducts } from "./api/productApi";
import "./CustomerApp.css";

// ✅ CATEGORY MAPPING (Icon + Label)
const CATEGORY_DATA = {
    "ALL": { label: "All Items", icon: "🛍️" },
    "FRUITS_VEGETABLES": { label: "Fruits & Veg", icon: "🥦" },
    "STAPLES_GRAINS": { label: "Staples", icon: "🌾" },
    "SPICES_MASALAS": { label: "Spices", icon: "🌶️" },
    "COOKING_OILS_GHEE": { label: "Oil & Ghee", icon: "🛢️" },
    "DAIRY_PRODUCTS": { label: "Dairy", icon: "🥛" },
    "BAKERY_BREAD": { label: "Bakery", icon: "🍞" },
    "SNACKS_PACKAGED": { label: "Snacks", icon: "🍪" },
    "BEVERAGES": { label: "Beverages", icon: "🥤" },
    "PERSONAL_CARE": { label: "Personal Care", icon: "🧼" },
    "HOUSEHOLD_CLEANING": { label: "Cleaning", icon: "🧹" },
    "BABY_CARE": { label: "Baby Care", icon: "👶" },
    "HEALTH_WELLNESS": { label: "Health", icon: "💊" },
    "PET_CARE": { label: "Pet Care", icon: "🐶" },
    "MEAT_FISH_EGGS": { label: "Meat & Eggs", icon: "🥚" },
    "READY_TO_EAT": { label: "Ready Foods", icon: "🍜" },
    "PAPER_DISPOSABLES": { label: "Disposables", icon: "🧻" },
    "SEASONAL_FESTIVAL": { label: "Seasonal", icon: "🎉" },
    "MISCELLANEOUS": { label: "Others", icon: "📦" }
};

function CustomerMarketplace({ products: propProducts, cart, addToCart, removeFromCart, isGlobal = false }) {
    const [products, setProducts] = useState(propProducts || []);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("ALL"); // ✅ Category State
    const [userLocation, setUserLocation] = useState(null); // 🌍 Location State
    const [locationStatus, setLocationStatus] = useState("Detecting location...");

    useEffect(() => {
        if (isGlobal) {
            // 🌍 Try to get location first
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log("Location detected:", position.coords);
                        setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                        setLocationStatus("Showing nearby products 📍");
                    },
                    (error) => {
                        console.warn("Location access denied or failed", error);
                        setLocationStatus("Showing all products (Location denied)");
                        loadGlobalProducts(null); // Load all if denied/error
                    }
                );
            } else {
                setLocationStatus("Geolocation not supported");
                loadGlobalProducts(null);
            }
        } else {
            setProducts(propProducts || []);
        }
    }, [isGlobal, propProducts]);

    // ✅ Reload when location changes
    useEffect(() => {
        if (isGlobal && userLocation) {
            loadGlobalProducts(userLocation);
        }
    }, [userLocation]);

    // ✅ Filter Effect
    useEffect(() => {
        if (selectedCategory === "ALL") {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p => p.category === selectedCategory));
        }
    }, [selectedCategory, products]);


    const loadGlobalProducts = async (location = null) => {
        try {
            setLoading(true);
            const res = await getAllProducts(location);
            setProducts(res.data || []);
        } catch (err) {
            console.error("Failed to load global products", err);
        } finally {
            setLoading(false);
        }
    };

    const [selectedProduct, setSelectedProduct] = useState(null); // Modal State

    const [currentImageIndex, setCurrentImageIndex] = useState(0); // ✅ Image Index

    const openProductModal = (product) => {
        setSelectedProduct(product);
        setCurrentImageIndex(0); // Reset index on open
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };

    const closeProductModal = () => {
        setSelectedProduct(null);
        document.body.style.overflow = 'auto';
    };

    // ✅ MOCK IMAGES (Use product category icon if available, else generic)
    const getProductMockImages = (product) => {
        const icon = CATEGORY_DATA[product.category]?.icon || "📦";
        return [icon, "📸", "✨"]; // 3 Mock Slides
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % 3);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + 3) % 3);
    };

    if (loading) return <div className="loader">Loading Global Market...</div>;

    if (!products || products.length === 0) {
        return (
            <div className="empty-state">
                <h3>No products available 🛍️</h3>
                <p>Check back later!</p>
            </div>
        );
    }

    return (
        <div className="customer-body">
            {/* ✅ CATEGORY FILTER BAR */}
            <div className="category-scroll-container">
                <div className="category-list">
                    {Object.entries(CATEGORY_DATA).map(([key, data]) => (
                        <div
                            key={key}
                            className={`category-item ${selectedCategory === key ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(key)}
                        >
                            <div className="cat-icon">{data.icon}</div>
                            <span className="cat-label">{data.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <h3 className="section-title">
                {isGlobal ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Global Market
                        <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#666' }}>
                            ({locationStatus})
                        </span>
                    </span>
                ) : "Available Products"}
                {selectedCategory !== "ALL" && ` - ${CATEGORY_DATA[selectedCategory].label}`}
            </h3>

            <div className="product-grid">
                {filteredProducts.map(p => (
                    <div key={p.id} className="product-card" onClick={() => openProductModal(p)}>
                        {/* Placeholder Image */}
                        <div className="product-img-placeholder">📦</div>

                        <div className="product-info">
                            <h4>{p.name}</h4>
                            <p className="price">₹ {p.price || p.sellingPrice}</p> {/* Handle both field names */}

                            {/* ✅ SHOW RETAILER NAME IF GLOBAL */}
                            {isGlobal && p.retailer && (
                                <p className="retailer-tag">
                                    <Store size={12} style={{ marginRight: 4 }} />
                                    {p.retailer.name || "Unknown Shop"}
                                </p>
                            )}

                            {/* ✅ STOCK STATUS BADGE */}
                            {p.quantity <= 0 ? (
                                <span className="stock-badge out">Out of Stock</span>
                            ) : p.quantity <= 5 ? (
                                <span className="stock-badge low">Only {p.quantity} left</span>
                            ) : null}

                            <div className="card-actions">
                                {p.quantity <= 0 ? (
                                    <button className="add-btn disabled" disabled>
                                        SOLD OUT
                                    </button>
                                ) : cart[p.barcode] ? (
                                    <div className="qty-control" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={(e) => { e.stopPropagation(); removeFromCart(p.barcode); }}>
                                            <Minus size={14} />
                                        </button>
                                        <span>{cart[p.barcode].qty}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                            disabled={cart[p.barcode].qty >= p.quantity}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button className="add-btn" onClick={(e) => { e.stopPropagation(); addToCart(p); }}>
                                        ADD +
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ✅ BOTTOM SHEET PRODUCT MODAL */}
            {selectedProduct && (
                <div className="modal-backdrop" onClick={closeProductModal}>
                    <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-actions">
                            <button className="close-btn-ghost" onClick={closeProductModal}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 15l-6-6-6 6" />
                                </svg>
                            </button>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <Tag size={20} color="#64748b" />
                                <div onClick={() => toast.success('Shared!')} style={{ cursor: 'pointer' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* ✅ CAROUSEL CONTENT AREA */}
                        <div className="modal-body-scroll">
                            <div className="product-detail-img-container carousel">
                                <div className="carousel-track" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                                    {getProductMockImages(selectedProduct).map((img, index) => (
                                        <div key={index} className="carousel-slide">
                                            {img}
                                        </div>
                                    ))}
                                </div>

                                {/* LEFT ARROW */}
                                <button className="carousel-btn left" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                                    <ChevronLeft size={24} />
                                </button>

                                {/* RIGHT ARROW */}
                                <button className="carousel-btn right" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                                    <ChevronRight size={24} />
                                </button>

                                {/* DOTS */}
                                <div className="carousel-dots">
                                    {[0, 1, 2].map((dot, index) => (
                                        <span
                                            key={index}
                                            className={`dot ${currentImageIndex === index ? 'active' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="product-detail-info">
                                <h2>{selectedProduct.name}</h2>
                                <p className="product-detail-unit">{selectedProduct.quantity || "1 Unit"}</p>

                                <div className="product-detail-price">
                                    <span className="current-price-lg">₹{selectedProduct.price || selectedProduct.sellingPrice}</span>
                                    {selectedProduct.mrp && (
                                        <>
                                            <span className="mrp-lg">₹{selectedProduct.mrp}</span>
                                            <span className="discount-badge-lg">
                                                {Math.round(((selectedProduct.mrp - (selectedProduct.price || selectedProduct.sellingPrice)) / selectedProduct.mrp) * 100)}% OFF
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div className="detail-section">
                                    <h4>Product Details</h4>
                                    <div className="detail-row">
                                        <span>Category</span>
                                        <span>{CATEGORY_DATA[selectedProduct.category]?.label || selectedProduct.category}</span>
                                    </div>
                                    {isGlobal && selectedProduct.retailer && (
                                        <div className="detail-row">
                                            <span>Seller</span>
                                            <span>{selectedProduct.retailer.name}</span>
                                        </div>
                                    )}
                                    {selectedProduct.description && (
                                        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px', lineHeight: '1.5' }}>
                                            {selectedProduct.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ✅ FIXED FOOTER */}
                        <div className="modal-footer-fixed">
                            {selectedProduct.quantity <= 0 ? (
                                <button className="add-btn-large disabled" disabled style={{ backgroundColor: '#ccc', cursor: 'not-allowed' }}>
                                    OUT OF STOCK
                                </button>
                            ) : cart[selectedProduct.barcode] ? (
                                <div className="qty-control" style={{ width: '100%', height: '50px', justifyContent: 'center' }}>
                                    <button onClick={() => removeFromCart(selectedProduct.barcode)} style={{ width: '50px', height: '100%' }}>
                                        <Minus size={20} />
                                    </button>
                                    <span style={{ fontSize: '18px', margin: '0 20px' }}>{cart[selectedProduct.barcode].qty}</span>
                                    <button
                                        onClick={() => addToCart(selectedProduct)}
                                        style={{ width: '50px', height: '100%' }}
                                        disabled={cart[selectedProduct.barcode].qty >= selectedProduct.quantity}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            ) : (
                                <button className="add-btn-large" onClick={() => addToCart(selectedProduct)}>
                                    ADD TO CART
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ✅ QUICK NAV BAR (Related Items) */}
                    <div className="modal-quick-nav-container" onClick={(e) => e.stopPropagation()}>
                        <div className="quick-nav-scroll">
                            {filteredProducts
                                .filter(p => p.id !== selectedProduct.id) // Exclude current
                                .slice(0, 10) // Limit to 10
                                .map(neighbor => (
                                    <div
                                        key={neighbor.id}
                                        className="quick-nav-item"
                                        onClick={() => openProductModal(neighbor)}
                                    >
                                        <div className="quick-nav-img-circle">
                                            📦
                                        </div>
                                        <span className="quick-nav-price">₹{neighbor.price || neighbor.sellingPrice}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomerMarketplace;
