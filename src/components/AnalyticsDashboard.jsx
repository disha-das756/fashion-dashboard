import React, { useState } from "react";

export function AnalyticsDashboard({ orderStats, products }) {
  const [timeRange, setTimeRange] = useState("7d");

  // Simulated 7-day revenue trend data
  const revenueTrend = [
    { day: "Mon", revenue: 420, orders: 8 },
    { day: "Tue", revenue: 680, orders: 12 },
    { day: "Wed", revenue: 510, orders: 9 },
    { day: "Thu", revenue: 940, orders: 15 },
    { day: "Fri", revenue: 1250, orders: 21 },
    { day: "Sat", revenue: 1580, orders: 26 },
    { day: "Sun", revenue: 1120, orders: 18 },
  ];

  const maxRev = Math.max(...revenueTrend.map((d) => d.revenue));

  // Category sales breakdown
  const categoryBreakdown = [
    { name: "Women's Collection", percentage: 58, count: 142, color: "#ec4899" },
    { name: "Men's Collection", percentage: 34, count: 83, color: "#3b82f6" },
    { name: "Footwear & Accessories", percentage: 8, count: 20, color: "#a855f7" },
  ];

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">📊 Executive Financial & Sales Analytics</h2>
          <p className="analytics-subtitle">Real-time revenue performance, order velocity, and category distribution.</p>
        </div>
        <div className="time-range-toggle">
          {["24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              className={`range-btn ${timeRange === range ? "active" : ""}`}
              onClick={() => setTimeRange(range)}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-cards-grid">
        <div className="kpi-card revenue-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <span className="kpi-label">Gross Revenue</span>
            <span className="kpi-value">${orderStats?.revenue || "4,500.00"}</span>
            <span className="kpi-badge positive">↑ 18.4% vs last period</span>
          </div>
        </div>

        <div className="kpi-card orders-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <span className="kpi-label">Total Completed Orders</span>
            <span className="kpi-value">{orderStats?.total_orders || 109}</span>
            <span className="kpi-badge positive">↑ 12 new today</span>
          </div>
        </div>

        <div className="kpi-card velocity-card">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-content">
            <span className="kpi-label">7-Day Sales Velocity</span>
            <span className="kpi-value">{orderStats?.last_7_days || 48} items</span>
            <span className="kpi-badge neutral">Active campaign</span>
          </div>
        </div>

        <div className="kpi-card aov-card">
          <div className="kpi-icon">💎</div>
          <div className="kpi-content">
            <span className="kpi-label">Average Order Value</span>
            <span className="kpi-value">$87.50</span>
            <span className="kpi-badge positive">↑ 4.2% AOV</span>
          </div>
        </div>
      </div>

      {/* Visual SVG Interactive Charts Row */}
      <div className="analytics-charts-grid">
        {/* Revenue Trend Line Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>📈 Weekly Revenue Trend ($)</h3>
            <span className="chart-meta">Live Daily Aggregation</span>
          </div>

          <div className="svg-chart-container">
            <svg viewBox="0 0 500 200" className="revenue-svg-chart">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="#e2e8f0" strokeDasharray="4 4" />

              {/* Area Fill */}
              <polygon
                points={`40,160 ${revenueTrend
                  .map((d, i) => `${40 + i * 70},${160 - (d.revenue / maxRev) * 120}`)
                  .join(" ")} 460,160`}
                fill="url(#chartGradient)"
              />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={revenueTrend
                  .map((d, i) => `${40 + i * 70},${160 - (d.revenue / maxRev) * 120}`)
                  .join(" ")}
              />

              {/* Data Points */}
              {revenueTrend.map((d, i) => {
                const cx = 40 + i * 70;
                const cy = 160 - (d.revenue / maxRev) * 120;
                return (
                  <g key={d.day} className="chart-dot-group">
                    <circle cx={cx} cy={cy} r="5" fill="#6366f1" stroke="#fff" strokeWidth="2" />
                    <text x={cx} y={cy - 12} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">
                      ${d.revenue}
                    </text>
                    <text x={cx} y="180" textAnchor="middle" fill="#64748b" fontSize="12">
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>👗 Sales Distribution by Category</h3>
            <span className="chart-meta">Share of Total Units Sold</span>
          </div>

          <div className="category-bars-list">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="cat-bar-item">
                <div className="cat-bar-label">
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-val">{cat.percentage}% ({cat.count} units)</span>
                </div>
                <div className="cat-bar-track">
                  <div
                    className="cat-bar-fill"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="popular-item-spotlight">
            <div className="spotlight-title">⭐ Top Selling Item This Week</div>
            <div className="spotlight-content">
              <strong>WMX Rubber Zebra Sandal</strong> — 46 Units Sold ($1,656 Revenue)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
