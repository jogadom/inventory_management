import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Report.css';
const AnalyticsReport = ({ items, viewDate }) => {
  // 1. Logic to calculate totals and item-level details from history
  const reportData = items.reduce((acc, item) => {
    let itemSales = 0;    // Vikri
    let itemPurchase = 0; // Navin
    let itemInward = 0;   // Dukanat

    Object.keys(item.history || {}).forEach(date => {
      if (date.startsWith(viewDate)) {
        const day = item.history[date];
        
        // Safety check for keys
        itemSales += Number(day.vikri || day.Vikri || day.sales || 0);
        itemPurchase += Number(day.navin || day.Navin || day.purchase || 0);
        itemInward += Number(day.dukanat || day.Dukanat || day.inward || 0);
      }
    });

    return {
      totalSales: acc.totalSales + itemSales,
      totalPurchase: acc.totalPurchase + itemPurchase,
      totalInward: acc.totalInward + itemInward,
      itemDetails: [...acc.itemDetails, { 
        name: item.name, 
        sales: itemSales, 
        purchase: itemPurchase, 
        inward: itemInward 
      }]
    };
  }, { totalSales: 0, totalPurchase: 0, totalInward: 0, itemDetails: [] });

  // Filter items for the chart
  const activeChartData = reportData.itemDetails.filter(d => d.sales > 0 || d.purchase > 0 || d.inward > 0);
  
  return (
    <div className="expert-report">
      <div className="report-header-rich">
        <h2>📊 Business Performance Analysis</h2>
        <p>Expert overview for <strong>Kantilal And Sons</strong> | Period: {viewDate}</p>
      </div>

      {/* 3. Multi-Bar Comparison Chart */}
      <div className="chart-container-rich">
        <h3>Inventory Flow vs. Sales Performance</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={activeChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" height={36}/>
              <Bar name="Navin" dataKey="purchase" fill="#38a169" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar name="Dukanat" dataKey="inward" fill="#ecc94b" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar name="Vikri" dataKey="sales" fill="#3182ce" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

     {/* 4. Item-Wise Detailed Table with Rich Styling */}
      <div className="item-breakdown-section">
        <div className="section-header">
          <span className="section-icon">📦</span>
          <h3>Detailed Item-Wise Performance</h3>
        </div>
        
        <div className="report-table-wrapper">
          <table className="rich-report-table">
            <thead>
              <tr>
                <th>Vastuche Nav (Item)</th>
                <th className="text-center">Navin (Purchase)</th>
                <th className="text-center">Dukanat (Inward)</th>
                <th className="text-center">Vikri (Sales)</th>
                <th className="text-center">Performance Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.itemDetails.map((item, index) => (
                <tr key={index}>
                  <td className="item-name-cell">
                    <span className="item-dot"></span>
                    {item.name}
                  </td>
                  <td className="text-center data-cell">{item.purchase}</td>
                  <td className="text-center data-cell">{item.inward}</td>
                  <td className="text-center data-cell sales-bold">{item.sales}</td>
                  <td className="text-center">
                    {item.sales > 0 ? (
                      <div className="status-badge active">
                        <span className="icon">🔥</span> Active Sales
                      </div>
                    ) : (
                      <div className="status-badge dormant">
                        <span className="icon">❄️</span> No Sales
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport;