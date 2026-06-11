import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = "http://localhost:8080/products";
const CATEGORIES = ["All", "Electronics", "Clothing", "Food", "Furniture", "Other"];

const qtyColor = (qty) => {
  if (qty <= 3) return "text-red-500 bg-red-50 border-red-200";
  if (qty <= 10) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-green-600 bg-green-50 border-green-200";
};

const emptyForm = { name: "", category: "Electronics", quantity: "", price: "" };

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [stockInput, setStockInput] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Decode JWT to get role
  const token = localStorage.getItem("token");
  let username = "";
  let role = "";
  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.username || "";
      role = decoded.role || "";
    } catch (error) {
      console.error("Invalid token", error);
    }
  }

  const isAdmin = role === "Admin";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchAll = () => {
    setLoading(true);
    fetch(API, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLowStockCount(data.filter((p) => p.quantity <= 3).length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    let list = [...products];
    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(list);
  }, [products, activeCategory, search]);

  // ---------- EXPORT FUNCTIONS ----------
  const exportToExcel = () => {
    if (filtered.length === 0) {
      showToast("No data to export", "error");
      return;
    }
    const sheetData = filtered.map((p) => ({
      Name: p.name,
      Category: p.category,
      Quantity: p.quantity,
      Price: `₹${p.price.toLocaleString("en-IN")}`,
      "Total Value": `₹${(p.price * p.quantity).toLocaleString("en-IN")}`,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `inventory_${new Date().toISOString().slice(0, 19)}.xlsx`);
    showToast("Excel exported");
  };

  const exportToPDF = () => {
    if (filtered.length === 0) {
      showToast("No data to export", "error");
      return;
    }
    const doc = new jsPDF();
    doc.text("Inventory Report", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Category", "Quantity", "Price (₹)", "Total Value (₹)"]],
      body: filtered.map((p) => [
        p.name,
        p.category,
        p.quantity,
        p.price.toLocaleString("en-IN"),
        (p.price * p.quantity).toLocaleString("en-IN"),
      ]),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] }, // indigo
    });
    doc.save(`inventory_${new Date().toISOString().slice(0, 19)}.pdf`);
    showToast("PDF exported");
  };
  // -------------------------------------

  const openAdd = () => {
    if (!isAdmin) return;
    setEditProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p) => {
    if (!isAdmin) return;
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, quantity: p.quantity, price: p.price });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!isAdmin) return;
    const payload = { ...form, quantity: Number(form.quantity), price: Number(form.price) };
    const url = editProduct ? `${API}/${editProduct.id}` : API;
    const method = editProduct ? "PUT" : "POST";
    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then(() => {
        fetchAll();
        setShowModal(false);
        showToast(editProduct ? "Product updated" : "Product added");
      });
  };

  const handleDelete = (id) => {
    if (!isAdmin) return;
    fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      fetchAll();
      showToast("Product deleted", "error");
    });
  };

  const handleStock = (id, type) => {
    if (!isAdmin) return;
    const qty = Number(stockInput[id] || 1);
    fetch(`${API}/${id}/${type}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ quantity: qty })
    })
      .then((r) => r.json())
      .then(() => {
        fetchAll();
        setStockInput((prev) => ({ ...prev, [id]: "" }));
        showToast(`Stock ${type === "stock-in" ? "added" : "removed"}`);
      });
  };

  const lowstockPage = () => {
    navigate("/low-stock");
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
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

  const totalValue = filtered.reduce((s, p) => s + p.price * p.quantity, 0);

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
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${text}`}>Inventory</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>
              {products.length} products · ₹{totalValue.toLocaleString("en-IN")} total value
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="text-right">
              <p className={`font-semibold ${text}`}>{username}</p>
              <p className={`text-sm ${muted}`}>{role}</p>
            </div>

            {lowStockCount > 0 && (
              <span
                onClick={lowstockPage}
                className="cursor-pointer flex items-center gap-1.5 text-xs font-medium bg-red-100 text-red-600 px-3 py-1.5 rounded-full border border-red-200"
              >
                ⚠️ {lowStockCount} low stock
              </span>
            )}

            {/* Export Buttons */}
            <button
              onClick={exportToExcel}
              className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                dark
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                  : "border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
              title="Export to Excel"
            >
              📊 Excel
            </button>
            <button
              onClick={exportToPDF}
              className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                dark
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                  : "border-gray-200 text-gray-500 hover:bg-gray-100"
              }`}
              title="Export to PDF"
            >
              📄 PDF
            </button>

            <button
              onClick={() => setDark(!dark)}
              className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition-colors ${
                dark ? "bg-gray-800 border-gray-700 text-yellow-400" : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              {dark ? "☀️" : "🌙"}
            </button>

            {isAdmin && (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <span className="text-lg leading-none">+</span> Add Product
              </button>
            )}

            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search + Category Filters - unchanged */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 text-sm px-4 py-2.5 rounded-xl border outline-none transition-colors ${inputCls}`}
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : dark
                    ? "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table - unchanged except export respects filtered data */}
        <div className={`rounded-2xl border overflow-hidden ${surface}`}>
          {loading ? (
            <div className={`text-center py-16 text-sm ${muted}`}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className={`text-center py-16 text-sm ${muted}`}>No products found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider ${thCls}`}>
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-center px-4 py-3 font-medium">Qty</th>
                  <th className="text-right px-4 py-3 font-medium">Price</th>
                  <th className="text-right px-4 py-3 font-medium">Total Value</th>
                  {isAdmin && (
                    <>
                      <th className="text-center px-4 py-3 font-medium">Stock</th>
                      <th className="text-center px-4 py-3 font-medium">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
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
                    <td className={`px-4 py-3.5 text-right ${muted}`}>
                      ₹{(p.price * p.quantity).toLocaleString("en-IN")}
                    </td>

                    {isAdmin && (
                      <>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={stockInput[p.id] || ""}
                              onChange={(e) => setStockInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                              className={`w-14 text-center text-xs px-2 py-1.5 rounded-lg border outline-none ${inputCls}`}
                            />
                            <button
                              onClick={() => handleStock(p.id, "stock-in")}
                              className="text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 px-2 py-1.5 rounded-lg transition-colors"
                            >
                              +In
                            </button>
                            <button
                              onClick={() => handleStock(p.id, "stock-out")}
                              className="text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 border border-orange-200 px-2 py-1.5 rounded-lg transition-colors"
                            >
                              −Out
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEdit(p)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                                dark
                                  ? "border-gray-700 text-gray-300 hover:bg-gray-700"
                                  : "border-gray-200 text-gray-500 hover:bg-gray-100"
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr> // Fixed: Changed from </table> to </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className={`mt-3 text-xs text-right ${muted}`}>
            Showing {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Modal – only for Admin */}
      {isAdmin && showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${surface} ${text}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base">{editProduct ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowModal(false)} className={`text-xl leading-none ${muted} hover:opacity-70`}>×</button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Name", key: "name", type: "text", placeholder: "e.g. MacBook Pro" },
                { label: "Price (₹)", key: "price", type: "number", placeholder: "e.g. 85000" },
                { label: "Quantity", key: "quantity", type: "number", placeholder: "e.g. 10" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className={`text-xs font-medium mb-1 block ${muted}`}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={`w-full text-sm px-3 py-2.5 rounded-xl border outline-none transition-colors ${inputCls}`}
                  />
                </div>
              ))}
              <div>
                <label className={`text-xs font-medium mb-1 block ${muted}`}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={`w-full text-sm px-3 py-2.5 rounded-xl border outline-none transition-colors ${inputCls}`}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 text-sm py-2.5 rounded-xl border transition-colors ${
                  dark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.price || !form.quantity}
                className="flex-1 text-sm py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium transition-colors"
              >
                {editProduct ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}