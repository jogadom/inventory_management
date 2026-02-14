import React, { useEffect, useRef } from 'react';

const InventoryTable = ({ items, viewDate, updateCell }) => {
  const todayRef = useRef(null);
  const [year, month] = viewDate.split('-').map(Number);
  
  // Calculate days in the selected month
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get today's date for highlighting and scrolling
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const isViewingCurrentMonth = year === currentYear && month === currentMonth;

  // Auto-scroll to today's column when the month loads
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [viewDate, items.length]);

  // Carry Forward Logic: Sums all activity before Day 1 of the current viewDate
  const getCarryForwardStock = (item) => {
    let balance = item.initialQuantity || 0;
    const historyDates = Object.keys(item.history || {}).sort();
    
    for (let date of historyDates) {
      if (date < `${viewDate}-01`) {
        const data = item.history[date];
        balance =balance - (data.inward || 0) + (data.purchase || 0) - (data.sales || 0);
      }
    }
    return balance;
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th rowSpan="2" className="sticky-col main-header">Item Name</th>
            {daysArray.map(day => {
              const isToday = isViewingCurrentMonth && day === currentDay;
              const displayDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
              
              return (
                <th 
                  key={day} 
                  colSpan="5" 
                  ref={isToday ? todayRef : null}
                  className={`date-header ${isToday ? 'highlight-today' : ''}`}
                >
                  {displayDate}
                </th>
              );
            })}
          </tr>
          <tr>
            {daysArray.map(day => (
              <React.Fragment key={`sub-${day}`}>
                <th className="sub">सुरुवात</th>
                <th className="sub">दुकानात</th>
                <th className="sub">नवीन</th>
                <th className="sub">विक्री</th>
                <th className="sub">शिल्लक</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(items) ? items : []).map(item => {
            let runningBalance = getCarryForwardStock(item);

            return (
              <tr key={item.id}>
                <td className="sticky-col item-name-cell">{item.name}</td>
                {daysArray.map(day => {
                  const dateKey = `${viewDate}-${String(day).padStart(2, '0')}`;
                  const current = (item.history && item.history[dateKey]) || { inward: 0, purchase: 0, sales: 0 };
                  
                  const startingStock = runningBalance;
                  const remainingStock = startingStock - (current.inward || 0) + (current.purchase || 0) - (current.sales || 0);
                  
                  // Update runningBalance for the next day in the loop
                  runningBalance = remainingStock;

                  const isToday = isViewingCurrentMonth && day === currentDay;
                  const dayClass = day % 2 === 0 ? 'day-even' : 'day-odd';

                  return (
                    <React.Fragment key={day}>
                      <td className={`auto-cell ${dayClass} ${isToday ? 'cell-today' : ''}`}>
                        {startingStock}
                      </td>
                      <td className={`${dayClass} ${isToday ? 'cell-today' : ''}`}>
                        <input 
                          type="number" 
                          value={current.inward || ''} 
                          onChange={(e) => updateCell(item.id, dateKey, 'inward', e.target.value)} 
                        />
                      </td>
                      <td className={`${dayClass} ${isToday ? 'cell-today' : ''}`}>
                        <input 
                          type="number" 
                          value={current.purchase || ''} 
                          onChange={(e) => updateCell(item.id, dateKey, 'purchase', e.target.value)} 
                        />
                      </td>
                      <td className={`${dayClass} ${isToday ? 'cell-today' : ''}`}>
                        <input 
                          type="number" 
                          value={current.sales || ''} 
                          onChange={(e) => updateCell(item.id, dateKey, 'sales', e.target.value)} 
                        />
                      </td>
                      <td className={`rem-cell ${dayClass} ${isToday ? 'cell-today-rem' : ''}`}>
                        {remainingStock}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;