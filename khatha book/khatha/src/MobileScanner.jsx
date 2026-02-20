import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera } from "lucide-react"; // Start using icons

function MobileScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);

  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    // Check for secure context (required for camera access)
    const secure = window.isSecureContext || window.location.hostname === "localhost";
    setIsSecure(secure);

    if (!secure) {
      console.warn("Camera access requires HTTPS (except for localhost)");
      return;
    }

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        videoConstraints: {
          facingMode: "environment" // Prefer back camera
        }
      },
      /* verbose= */ false
    );

    try {
      scanner.render(
        (decodedText) => {
          // Success callback
          setScanResult(decodedText);

          // Play beep sound
          const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
          audio.play().catch(e => console.log("Audio play failed", e));

          if (onScan) {
            onScan(decodedText);
          }

          // Reset scan result visually after a delay
          setTimeout(() => setScanResult(null), 2000);
        },
        (errorMessage) => {
          // Error callback
        }
      );
    } catch (err) {
      console.error("Scanner render failed:", err);
    }

    scannerRef.current = scanner;

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode scanner. ", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <h3>📷 Scan Barcode</h3>

        {!isSecure && (
          <div className="security-warning">
            ⚠️ <b>Security Limitation:</b> Camera access requires <b>HTTPS</b>.
            Please use a secure connection or <b>localhost</b>.
          </div>
        )}

        <div id="reader" style={{ width: "100%", maxWidth: "400px" }}></div>

        <p style={{ marginTop: 10, color: "#666" }}>
          {isSecure ? "Point camera at a barcode or QR code" : "Please use HTTPS to enable camera scanning"}
        </p>

        {scanResult && (
          <div className="scan-success-badge">
            ✅ Scanned: {scanResult}
          </div>
        )}
      </div>

      <style>{`
        .scanner-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .scanner-modal {
            background: white;
            padding: 20px;
            border-radius: 12px;
            position: relative;
            width: 90%;
            max-width: 450px;
            text-align: center;
        }
        .close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            cursor: pointer;
            color: #333;
        }
        .security-warning {
            background: #fff7ed;
            color: #9a3412;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 15px;
            border: 1px solid #fed7aa;
        }
        .scan-success-badge {
            margin-top: 10px;
            background: #f0fdf4;
            color: #166534;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            border: 1px solid #bbf7d0;
        }
      `}</style>
    </div>
  );
}

export default MobileScanner;
