import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8080/products";

const qtyColor = (qty) => {
  if (qty <= 3) return "text-red-500 bg-red-50 border-red-200";
  if (qty <= 10) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-green-600 bg-green-50 border-green-200";
};

export default function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [stockInput, setStockInput] = useState({});
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchLowStock = () => {
    setLoading(true);
    fetch(`${API}/low-stock`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLowStock(); }, []);

  const handleStockIn = (id) => {
    const qty = Number(stockInput[id] || 1);
    fetch(`${API}/${id}/stock-in`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    })
      .then((r) => r.json())
      .then(() => {
        fetchLowStock();
        setStockInput((prev) => ({ ...prev, [id]: "" }));
        showToast("Stock added");
      });
  };

  const bg = dark ? "bg-gray-950" : "bg-gray-50";
  const surface = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const text = dark ? "text-gray-100" : "text-gray-800";
  const muted = dark ? "text-gray-400" : "text-gray-400";
  const inputCls = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-indigo-500"
    : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400";
  const rowHover = dark ? "hover:bg-gray-800/60" : "hover:bg-gray-50";
  const thCls = dark ? "text-gray-400 border-gray-800" : "text-gray-400 border-gray-100";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300 font-sans`}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
          toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/products")}
              className={`text-sm px-3 py-2 rounded-xl border transition-colors ${
                dark
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                  : "border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
            >
              ← All products
            </button>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${text}`}>Low Stock</h1>
              <p className={`text-sm mt-0.5 ${muted}`}>
                {products.length} product{products.length !== 1 ? "s" : ""} need restocking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {products.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium bg-red-100 text-red-600 px-3 py-1.5 rounded-full border border-red-200">
                ⚠️ {products.length} low stock
              </span>
            )}
            <button
              onClick={() => setDark(!dark)}
              className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition-colors ${
                dark ? "bg-gray-800 border-gray-700 text-yellow-400" : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border overflow-hidden ${surface}`}>
          {loading ? (
            <div className={`text-center py-16 text-sm ${muted}`}>Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🎉</p>
              <p className={`text-sm font-medium ${text}`}>All stocked up!</p>
              <p className={`text-xs mt-1 ${muted}`}>No products are running low right now</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider ${thCls}`}>
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-center px-4 py-3 font-medium">Qty</th>
                  <th className="text-right px-4 py-3 font-medium">Price</th>
                  <th className="text-center px-4 py-3 font-medium">Restock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b last:border-0 transition-colors ${rowHover} ${
                      dark ? "border-gray-800" : "border-gray-100"
                    }`}
                  >
                    <td className={`px-5 py-3.5 font-medium ${text}`}>{p.name}</td>
                    <td className={`px-4 py-3.5 ${muted}`}>{p.category}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${qtyColor(p.quantity)}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-medium ${text}`}>
                      ₹{p.price.toLocaleString("en-IN")}
                    </td>

                    {/* Restock / Stock In only */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={stockInput[p.id] || ""}
                          onChange={(e) =>
                            setStockInput((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          className={`w-14 text-center text-xs px-2 py-1.5 rounded-lg border outline-none ${inputCls}`}
                        />
                        <button
                          onClick={() => handleStockIn(p.id)}
                          className="text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          + Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {products.length > 0 && (
          <div className={`mt-3 text-xs text-right ${muted}`}>
            Showing {products.length} product{products.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}