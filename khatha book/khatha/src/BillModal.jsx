import { useState } from "react";

function BillModal({ type, onSave, onClose }) {
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState("");
  const [date, setDate] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const save = () => {
    if (!amount || !date) return;

    const imageUrl = imageFile ? URL.createObjectURL(imageFile) : null;

    onSave({
      amount: Number(amount),
      items,
      date,
      imageUrl,
    });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{type === "gave" ? "You Gave" : "You Received"}</h3>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          placeholder="Items / Mode"
          value={items}
          onChange={(e) => setItems(e.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0] || null)}
        />

        <div className="modal-actions">
          <button className="btn primary" onClick={save}>
            Save
          </button>

          <button className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillModal;
