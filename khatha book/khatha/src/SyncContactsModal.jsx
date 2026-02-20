import { useState } from "react";

function SyncContactsModal({ onClose, onImport }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = "http://localhost:8084"; // ✅ change if needed

  /* ================= GOOGLE CONTACT SYNC ================= */
  const handleGoogleSync = () => {
    setError("");

    if (!window.google) {
      setError("Google services not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id:
        "708648356521-bh0hbsl9fk0j3704r7rp635pspjhetmn.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/contacts.readonly",

      callback: async (tokenResponse) => {
        try {
          if (!tokenResponse?.access_token) {
            throw new Error("No access token received");
          }

          const res = await fetch(
            `${BACKEND_URL}/api/contacts/google`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accessToken: tokenResponse.access_token,
              }),
            }
          );

          if (!res.ok) {
            throw new Error("Backend failed");
          }

          const contacts = await res.json();

          if (onImport) {
            onImport(contacts);
          }

          onClose();
        } catch (err) {
          console.error(err);
          setError("Unable to sync Google contacts");
        } finally {
          setLoading(false);
        }
      },
    });

    client.requestAccessToken();
  };

  return (
    <div className="modal">
      <div className="modal-box animate-scale">
        <h3>Sync Google Contacts</h3>

        <p className="muted">
          Import customer emails directly from your Google account.
        </p>

        {error && <p className="error">{error}</p>}

        <button
          className="btn google"
          onClick={handleGoogleSync}
          disabled={loading}
        >
          {loading ? "Syncing..." : "🔄 Continue with Google"}
        </button>

        <div className="modal-actions">
          <button
            className="btn ghost"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SyncContactsModal;
