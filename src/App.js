import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import InventoryTable from './components/InventoryTable';
import AnalyticsReport from './components/AnalyticsReport';
import './App.css';

function App() {
  // --- 1. STATE & STORAGE ---
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('universal-inventory-matrix');
    return saved ? JSON.parse(saved) : [];
  });

  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [newItem, setNewItem] = useState({ name: '', qty: '', category: 'General' });

  useEffect(() => {
    localStorage.setItem('universal-inventory-matrix', JSON.stringify(items));
  }, [items]);

  // --- 2. EXPORT FUNCTION (JSON Backup) ---
  const exportInventory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `inventory_backup_${viewDate}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- 3. IMPORT FUNCTION (Restore Backup) ---
  const importInventory = (event) => {
    const fileReader = new FileReader();
    const file = event.target.files[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          if (window.confirm("This will replace current data. Continue?")) {
            setItems(importedData);
            alert("Data restored successfully!");
          }
        }
      } catch (err) {
        alert("Invalid file format.");
      }
    };
    fileReader.readAsText(file);
  };

  // --- 4. CSV DOWNLOAD FUNCTION (Excel Export) ---
  const downloadCSV = () => {
    const headers = ["Item Name", "Category", "Starting", "Inward", "Purchase", "Sales", "Final Stock"];
    const rows = items.map(item => {
      let mInward = 0, mPurchase = 0, mSales = 0;
      Object.keys(item.history || {}).forEach(date => {
        if (date.startsWith(viewDate)) {
          const d = item.history[date];
          mInward += (d.inward || 0);
          mPurchase += (d.purchase || 0);
          mSales += (d.sales || 0);
        }
      });
      const final = (item.initialQuantity || 0) + mPurchase - mSales;
      return [item.name, item.category, item.initialQuantity, mInward, mPurchase, mSales, final].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Inventory_Report_${viewDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 5. CORE LOGIC (Add/Update/Jump) ---
  const jumpToToday = () => {
    const now = new Date();
    setViewDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const addItem = (e) => {
    e.preventDefault();
    const itemObject = {
      id: Date.now(),
      name: newItem.name,
      category: newItem.category,
      initialQuantity: parseInt(newItem.qty) || 0,
      history: {}
    };
    setItems([...items, itemObject]);
    setNewItem({ name: '', qty: '', category: 'General' });
    setIsModalOpen(false);
  };

  const updateCell = (itemId, date, field, value) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        const history = item.history || {};
        const daily = history[date] || { inward: 0, purchase: 0, sales: 0 };
        return {
          ...item,
          history: { ...history, [date]: { ...daily, [field]: parseInt(value) || 0 } }
        };
      }
      return item;
    }));
  };

  // --- 6. FILTERING LOGIC ---
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(items.map(i => i.category || 'General'))];

  return (
    <Router>
      <div className="App">
        {/* --- NAVBAR --- */}
        <nav className="navbar-rich">
          <div className="nav-container">
            <div className="nav-brand">
              <div className="brand-text">
                <span className="nav-title">Inventory Manager</span>
               
              </div>
            </div>

            <div className="nav-content">
              <div className="nav-links">
                <Link to="/" className="nav-item">Dashboard</Link>
                <div className="nav-dropdown">
                  <button className="dropdown-trigger">Tools ▾</button>
                  <div className="dropdown-menu">
                    <Link to="/report" className="dropdown-item">📊 View Analytics</Link>
                    <button onClick={downloadCSV} className="dropdown-item">📥 Download CSV</button>
                    <button onClick={exportInventory} className="dropdown-item">💾 Backup (JSON)</button>
                    <label className="dropdown-item" style={{ cursor: 'pointer' }}>
                      📂 Restore (JSON)
                      <input type="file" accept=".json" onChange={importInventory} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => {if(window.confirm('Delete all?')) setItems([])}} className="dropdown-item">🗑️ Clear All</button>
                  </div>
                </div>
              </div>

              <div className="nav-search-box">
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button className="add-btn-rich" onClick={() => setIsModalOpen(true)}>+ Add Item</button>
            </div>
          </div>
        </nav>

        {/* --- CATEGORY BAR --- */}
        <div className="category-filter-bar">
          {categories.map(cat => (
            <button key={cat} className={`filter-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        <Routes>
          <Route path="/" element={
            <>
              <div className="sub-bar-rich">
                <div className="date-nav">
                  <input type="month" value={viewDate} onChange={(e) => setViewDate(e.target.value)} />
                  <button onClick={jumpToToday} className="btn-today">Today</button>
                </div>
              </div>
              <InventoryTable items={filteredItems} viewDate={viewDate} updateCell={updateCell} />
            </>
          } />
          <Route path="/report" element={<AnalyticsReport items={items} viewDate={viewDate} />} />
        </Routes>

        {/* --- ADD MODAL --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>New Entry</h3>
              <form onSubmit={addItem}>
                <div className="modal-inputs">
                  <input placeholder="Name" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} required />
                  <input type="number" placeholder="Qty" value={newItem.qty} onChange={(e) => setNewItem({...newItem, qty: e.target.value})} required />
                  <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
                    <option value="General">General</option>
                    <option value="Stock">Stock</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Supplies">Supplies</option>
                  </select>
                </div>
                <div className="modal-btns">
                  <button type="submit" className="save-btn">Save</button>
                  <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App; 