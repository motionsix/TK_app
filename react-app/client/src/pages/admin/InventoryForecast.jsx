import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api';

export default function InventoryForecast() {
  const [summary, setSummary] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ทั้งหมด');
  const [exportScope, setExportScope] = useState('all'); // 'all' or 'low-stock'

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, forecastRes, stockRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/forecast'),
        api.get('/analytics/stock-status'),
      ]);
      setSummary(summaryRes.data?.data || null);
      setForecastData(forecastRes.data?.data || []);
      setInventoryList(stockRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    let dataToExport = inventoryList;
    if (exportScope === 'low-stock') {
      dataToExport = inventoryList.filter(item => item.percentage <= 20);
    }
    const excelData = dataToExport.map((item, index) => ({
      'ลำดับ': index + 1,
      'ชื่อสินค้า': item.name,
      'หมวดหมู่': item.category,
      'สต็อกคงเหลือ': `${item.currentStock} / ${item.maxStock}`,
      'สต็อกสูงสุด': item.maxStock,
      '% คงเหลือ': `${item.percentage}%`,
      'ยอดพยากรณ์': `${item.predictedDemand} ชิ้น`,
      'สถานะ': item.statusText
    }));
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายงานสต็อกสินค้า");
    XLSX.writeFile(workbook, "รายงานสต็อกสินค้า.xlsx");
  };

  const exportToPDF = () => {
    let dataToExport = inventoryList;
    if (exportScope === 'low-stock') {
      dataToExport = inventoryList.filter(item => item.percentage <= 20);
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('รายงานสต็อกสินค้า', 105, 20, { align: 'center' });
    const today = new Date();
    const dateString = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`;
    doc.setFontSize(12);
    doc.text(`วันที่พิมพ์: ${dateString}`, 105, 30, { align: 'center' });
    
    const tableColumn = ["ลำดับ", "ชื่อสินค้า", "หมวดหมู่", "สต็อกคงเหลือ", "สต็อกสูงสุด", "% คงเหลือ", "ยอดพยากรณ์", "สถานะ"];
    const tableRows = dataToExport.map((item, index) => [
      index + 1, item.name, item.category, `${item.currentStock} / ${item.maxStock}`,
      item.maxStock, `${item.percentage}%`, `${item.predictedDemand} ชิ้น`, item.statusText
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      headStyles: { fillColor: [34, 197, 194], textColor: 255, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    doc.save("รายงานสต็อกสินค้า.pdf");
  };

  const getBadgeStyle = (alertLevel) => {
    switch (alertLevel) {
      case 'critical': return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const getProgressColor = (alertLevel) => {
    switch (alertLevel) {
      case 'critical': return 'bg-rose-600';
      case 'warning': return 'bg-orange-500';
      case 'moderate': return 'bg-amber-400';
      default: return 'bg-emerald-500';
    }
  };

  const filteredInventory = filterCategory === 'ทั้งหมด'
    ? inventoryList
    : inventoryList.filter((item) => item.category === filterCategory);

  const categories = ['ทั้งหมด', ...new Set(inventoryList.map((i) => i.category))];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">กำลังโหลดข้อมูลการวิเคราะห์และพยากรณ์สต็อก...</div>
      </div>
    );
  }

  // ==========================================
  // เปลี่ยนกราฟจาก SVG เป็น HTML/CSS Flexbox ล้วน
  // ==========================================
  const renderBarChart = () => {
    if (!forecastData || forecastData.length === 0) return null;

    // หาค่าที่สูงที่สุดเพื่อนำมาเทียบสัดส่วน 100%
    const maxValue = Math.max(
      1,
      ...forecastData.map((d) => Math.max(Number(d['ยอดขายจริง']) || 0, Number(d['ยอดพยากรณ์']) || 0))
    );

    return (
      // กล่องนอกสุด: กำหนดความสูง h-72 (288px) ตายตัว และตัดส่วนเกินทิ้ง (overflow-hidden)
      <div className="h-72 w-full flex flex-col justify-end relative bg-slate-50/50 rounded-xl border border-slate-100 pt-12 pb-6 px-4 sm:px-8 overflow-hidden">
        
        {/* ป้ายบอกสถานะสีกราฟ (Legend) */}
        <div className="absolute top-4 right-4 flex items-center gap-4 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs z-20">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
            <span className="text-slate-600">ยอดขายจริง</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
            <span className="text-slate-600">ยอดพยากรณ์</span>
          </div>
        </div>

        {/* เส้นนำสายตาแกน Y (Grid Lines) */}
        <div className="absolute inset-0 flex flex-col justify-between pt-12 pb-12 px-4 pointer-events-none z-0">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, i) => (
            <div key={i} className="flex items-center w-full h-0">
              <span className="text-[10px] text-slate-400 w-8 text-right pr-2">
                {Math.round(maxValue * ratio)}
              </span>
              <div className="flex-1 border-t border-slate-200 border-dashed"></div>
            </div>
          ))}
        </div>

        {/* พื้นที่สำหรับวาดแท่งกราฟ HTML */}
        <div className="relative z-10 flex w-full h-full justify-between items-end ml-6 sm:ml-8 gap-2">
          {forecastData.map((data, index) => {
            // คำนวณความสูงเป็น % โดยจำกัดไม่ให้เกิน 100% เด็ดขาด
            const realHeight = Math.min((data['ยอดขายจริง'] / maxValue) * 100, 100);
            const forecastHeight = Math.min((data['ยอดพยากรณ์'] / maxValue) * 100, 100);

            return (
              <div key={index} className="h-full flex flex-col justify-end items-center flex-1 gap-2">
                {/* กล่องใส่แท่งคู่ (ต้องให้แนบชิดฐานตลอดด้วย items-end) */}
                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full relative">
                  
                  {/* แท่งยอดขายจริง (เขียว) */}
                  <div 
                    className="w-4 sm:w-8 lg:w-10 bg-emerald-500 rounded-t-sm transition-all duration-700 ease-out group relative"
                    style={{ height: `${realHeight}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition-opacity">
                      {data['ยอดขายจริง']}
                    </div>
                  </div>

                  {/* แท่งยอดพยากรณ์ (ส้ม) */}
                  <div 
                    className="w-4 sm:w-8 lg:w-10 bg-amber-500 rounded-t-sm transition-all duration-700 ease-out group relative"
                    style={{ height: `${forecastHeight}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition-opacity">
                      {data['ยอดพยากรณ์']}
                    </div>
                  </div>
                  
                </div>
                
                {/* ป้ายชื่อเดือนด้านล่าง */}
                <span className="text-xs font-medium text-slate-600 mt-1">{data.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ระบบพยากรณ์ยอดขาย & แจ้งเตือนสต็อก</h1>
          <p className="text-sm text-slate-500">วิเคราะห์แนวโน้มการสั่งซื้อล่วงหน้าและบริหารคลังสินค้าสหกรณ์</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">สินค้าทั้งหมด</option>
              <option value="low-stock">เฉพาะสินค้าสต็อกต่ำ (&lt; 20%)</option>
            </select>
          </div>
          <button onClick={exportToExcel} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel
          </button>
          <button onClick={exportToPDF} className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
          <button onClick={fetchDashboardData} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition">
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Low Stock Critical Banner */}
      {summary && summary.lowStockCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div>
              <span className="font-bold">แจ้งเตือนสต็อกวิกฤต!</span> มีสินค้า {summary.lowStockCount} รายการที่มีสต็อกเหลือต่ำกว่า 20%
            </div>
          </div>
          <a href="#stock-table" className="text-sm font-semibold underline hover:text-rose-900">
            ดูรายการสินค้า
          </a>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium">สินค้าทั้งหมด</div>
          <div className="text-3xl font-bold text-slate-800 mt-2">{summary?.totalProducts || 0} รายการ</div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-amber-600 font-medium">ต้องเติมด่วน (&lt; 20%)</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{summary?.lowStockCount || 0} รายการ</div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium">สินค้าขายดีประจำเดือน</div>
          <div className="text-lg font-bold text-slate-800 mt-2 truncate">{summary?.topSellingProduct || '-'}</div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm text-emerald-600 font-medium">ประมาณการยอดซื้อสัปดาห์หน้า</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2">~{summary?.predictedNextWeekOrders || 0} ชิ้น</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">แนวโน้มยอดขายจริง vs พยากรณ์ล่วงหน้า</h2>
          <p className="text-xs text-slate-500">เปรียบเทียบยอดขายย้อนหลังและประมาณการความต้องการสินค้าช่วงเปิดเทอม</p>
        </div>
        {/* เลิกครอบด้วย h-64 ธรรมดา เพราะผมไปเซ็ต h-72 ไว้ในตัวฟังก์ชันแล้ว */}
        {renderBarChart()}
      </div>

      {/* Stock Table Section */}
      <div id="stock-table" className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">สถานะสต็อกสินค้า & ระดับการเตือนภัย</h2>
            <p className="text-xs text-slate-500">แสดงการไล่ระดับสีตาม % สต็อกคงเหลือ (เขียว &gt; 50% | เหลือง 21-50% | ส้ม 10-20% | แดง &lt; 10%)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">หมวดหมู่:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">ชื่อสินค้า</th>
                <th className="p-3">หมวดหมู่</th>
                <th className="p-3">สต็อกคงเหลือ</th>
                <th className="p-3">ระดับ % คลัง</th>
                <th className="p-3">พยากรณ์เดือนหน้า</th>
                <th className="p-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-medium text-slate-800">{item.name}</td>
                  <td className="p-3 text-slate-500">{item.category}</td>
                  <td className="p-3 font-semibold text-slate-700">
                    {item.currentStock} / {item.maxStock} ชิ้น
                  </td>
                  <td className="p-3 w-48">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressColor(item.alertLevel)}`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-9">{item.percentage}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">
                    ~{item.predictedDemand} ชิ้น
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${getBadgeStyle(item.alertLevel)}`}>
                      {item.statusText}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}