import { useState, useEffect, Suspense, lazy } from "react";
import "./App.css";
import { useTranslation } from "react-i18next";

// ✅ LAZY LOAD COMPONENTS
const Dashboard = lazy(() => import("./Dashboard"));
const LoginModal = lazy(() => import("./LoginModal"));
const Landing = lazy(() => import("./Landing"));
const CustomerApp = lazy(() => import("./CustomerApp"));

// ✅ Loading Fallback
import logoIcon from "./assets/logo-icon.png";

// ✅ Loading Fallback
const LoadingScreen = () => (
  <div className="loader-container">
    <img src={logoIcon} alt="Loading..." className="logo-spinner" />
    <p>Loading Khatha...</p>
  </div>
);

function App() {
  useTranslation();

  const [loggedIn, setLoggedIn] = useState(
    sessionStorage.getItem("loggedIn") === "true" &&
    !!sessionStorage.getItem("retailerId")
  );

  const [showLoginModal, setShowLoginModal] = useState(false);

  // 🔐 AUTH GUARD (UNCHANGED)
  useEffect(() => {
    const logged = sessionStorage.getItem("loggedIn");
    const retailerId = sessionStorage.getItem("retailerId");

    if (logged === "true" && !retailerId) {
      sessionStorage.clear();
      window.location.reload();
    }
  }, []);

  /* ================= MODE SWITCH ================= */
  const [customerAccounts, setCustomerAccounts] = useState(() => {
    const stored = sessionStorage.getItem("customer_retailer");
    return stored ? [JSON.parse(stored)] : [];
  });

  const [appMode, setAppMode] = useState(() => {
    if (sessionStorage.getItem("customer_retailer")) {
      return "customer";
    }
    return "retailer";
  });

  if (appMode === "customer") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CustomerApp
          initialAccounts={customerAccounts}
          onLogout={() => setAppMode("retailer")}
        />
      </Suspense>
    );
  }

  /* ================= DASHBOARD ================= */
  if (loggedIn) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Dashboard />
      </Suspense>
    );
  }

  /* ================= LANDING ================= */
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Landing
        onLoginClick={(mode = "retailer") => setShowLoginModal(mode)}
      />

      {showLoginModal && (
        <LoginModal
          initialMode={showLoginModal === true ? "retailer" : showLoginModal} // Handle boolean legacy or string
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setLoggedIn(true);
            setShowLoginModal(false);
          }}
          onCustomerSuccess={(accounts) => {
            if (accounts.length === 1) {
              sessionStorage.setItem("customer_retailer", JSON.stringify(accounts[0]));
            }
            setCustomerAccounts(accounts);
            setAppMode("customer");
            setShowLoginModal(false);
          }}
        />
      )}
    </Suspense>
  );
}



export default App;
