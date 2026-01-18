import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Optional CSS file

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalEarned: 0,
        walletBalance: 0,
        clicksToday: 0,
        totalClicks: 0,
        withdrawals: 0,
        pendingWithdrawals: 0
    });
    
    const [earningsData, setEarningsData] = useState([]);
    const [clickData, setClickData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch user stats
            const userRes = await axios.get('http://localhost:5000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Fetch click history for charts
            const clicksRes = await axios.get('http://localhost:5000/api/wallet/clicks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Fetch withdrawal history
            const withdrawalsRes = await axios.get('http://localhost:5000/api/wallet/withdrawals', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const userData = userRes.data.user;
            const clicks = clicksRes.data.clicks;
            const withdrawals = withdrawalsRes.data.withdrawals;

            // Process stats
            const processedStats = {
                totalEarned: userData.totalEarned || 0,
                walletBalance: userData.walletBalance || 0,
                clicksToday: userData.clicksToday || 0,
                totalClicks: clicks.length || 0,
                withdrawals: withdrawals.length || 0,
                pendingWithdrawals: withdrawals.filter(w => w.status === 'Pending').length || 0
            };

            setStats(processedStats);

            // Process earnings data for chart
            const earningsByDate = processEarningsData(clicks, timeRange);
            setEarningsData(earningsByDate);

            // Process click data for chart
            const clicksByDate = processClickData(clicks, timeRange);
            setClickData(clicksByDate);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const processEarningsData = (clicks, range) => {
        const now = new Date();
        const data = [];
        
        let days = 7; // Default to week
        if (range === 'month') days = 30;
        if (range === 'year') days = 365;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateStr = date.toLocaleDateString('en-IN', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            const dayClicks = clicks.filter(click => {
                const clickDate = new Date(click.timestamp);
                return clickDate.toDateString() === date.toDateString();
            });
            
            const dailyEarnings = dayClicks.reduce((sum, click) => sum + (click.amount || 1), 0);
            
            data.push({
                date: dateStr,
                earnings: dailyEarnings,
                clicks: dayClicks.length
            });
        }
        
        return data;
    };

    const processClickData = (clicks, range) => {
        const now = new Date();
        const data = [];
        
        let days = 7;
        if (range === 'month') days = 30;
        if (range === 'year') days = 12; // Monthly for year
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            
            if (range === 'year') {
                date.setMonth(now.getMonth() - i);
                const dateStr = date.toLocaleDateString('en-IN', { 
                    month: 'short',
                    year: '2-digit'
                });
                
                const monthClicks = clicks.filter(click => {
                    const clickDate = new Date(click.timestamp);
                    return clickDate.getMonth() === date.getMonth() && 
                           clickDate.getFullYear() === date.getFullYear();
                });
                
                data.push({
                    period: dateStr,
                    clicks: monthClicks.length,
                    earnings: monthClicks.reduce((sum, click) => sum + (click.amount || 1), 0)
                });
            } else {
                date.setDate(now.getDate() - i);
                const dateStr = date.toLocaleDateString('en-IN', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                const dayClicks = clicks.filter(click => {
                    const clickDate = new Date(click.timestamp);
                    return clickDate.toDateString() === date.toDateString();
                });
                
                data.push({
                    period: dateStr,
                    clicks: dayClicks.length,
                    earnings: dayClicks.reduce((sum, click) => sum + (click.amount || 1), 0)
                });
            }
        }
        
        return data;
    };

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Dashboard Overview</h1>
                <div className="time-range-selector">
                    <button 
                        className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
                        onClick={() => handleTimeRangeChange('week')}
                    >
                        Week
                    </button>
                    <button 
                        className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
                        onClick={() => handleTimeRangeChange('month')}
                    >
                        Month
                    </button>
                    <button 
                        className={`time-btn ${timeRange === 'year' ? 'active' : ''}`}
                        onClick={() => handleTimeRangeChange('year')}
                    >
                        Year
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card earnings">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Total Earned</h3>
                        <p className="stat-value">₹{stats.totalEarned}</p>
                        <p className="stat-label">Lifetime earnings</p>
                    </div>
                </div>

                <div className="stat-card balance">
                    <div className="stat-icon">🏦</div>
                    <div className="stat-content">
                        <h3>Wallet Balance</h3>
                        <p className="stat-value">₹{stats.walletBalance}</p>
                        <p className="stat-label">Available for withdrawal</p>
                    </div>
                </div>

                <div className="stat-card today">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                        <h3>Today's Clicks</h3>
                        <p className="stat-value">{stats.clicksToday}/50</p>
                        <p className="stat-label">Daily limit 50 clicks</p>
                    </div>
                </div>

                <div className="stat-card total">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>Total Clicks</h3>
                        <p className="stat-value">{stats.totalClicks}</p>
                        <p className="stat-label">All time clicks</p>
                    </div>
                </div>

                <div className="stat-card withdrawal">
                    <div className="stat-icon">💸</div>
                    <div className="stat-content">
                        <h3>Withdrawals</h3>
                        <p className="stat-value">{stats.withdrawals}</p>
                        <p className="stat-label">{stats.pendingWithdrawals} pending</p>
                    </div>
                </div>

                <div className="stat-card rate">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                        <h3>Earning Rate</h3>
                        <p className="stat-value">₹50/day</p>
                        <p className="stat-label">Maximum potential</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="chart-container earnings-chart">
                    <h3>Earnings Trend</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={earningsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#666" 
                                    fontSize={12}
                                />
                                <YAxis 
                                    stroke="#666" 
                                    fontSize={12}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip 
                                    formatter={(value) => [`₹${value}`, 'Earnings']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ 
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="earnings" 
                                    stroke="#667eea" 
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                    name="Earnings (₹)"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="clicks" 
                                    stroke="#4CAF50" 
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="Clicks"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container clicks-chart">
                    <h3>Clicks Distribution</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={clickData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="period" 
                                    stroke="#666" 
                                    fontSize={12}
                                />
                                <YAxis 
                                    stroke="#666" 
                                    fontSize={12}
                                />
                                <Tooltip 
                                    formatter={(value, name) => {
                                        if (name === 'earnings') return [`₹${value}`, 'Earnings'];
                                        return [value, 'Clicks'];
                                    }}
                                    contentStyle={{ 
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="clicks" 
                                    fill="#764ba2" 
                                    name="Clicks"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar 
                                    dataKey="earnings" 
                                    fill="#FFA726" 
                                    name="Earnings (₹)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                    <button className="action-btn click-earn">
                        <span className="action-icon">🎯</span>
                        <span className="action-text">Click & Earn Now</span>
                        <span className="action-subtext">Earn ₹1 per click</span>
                    </button>
                    
                    <button className="action-btn withdraw" disabled={stats.walletBalance < 100}>
                        <span className="action-icon">💸</span>
                        <span className="action-text">Withdraw Money</span>
                        <span className="action-subtext">Min. ₹100 required</span>
                    </button>
                    
                    <button className="action-btn history">
                        <span className="action-icon">📋</span>
                        <span className="action-text">View History</span>
                        <span className="action-subtext">Clicks & withdrawals</span>
                    </button>
                    
                    <button className="action-btn refer">
                        <span className="action-icon">👥</span>
                        <span className="action-text">Refer & Earn</span>
                        <span className="action-subtext">Earn 20% commission</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                    <div className="activity-item success">
                        <div className="activity-icon">✅</div>
                        <div className="activity-content">
                            <p className="activity-title">Banner Click Rewarded</p>
                            <p className="activity-time">Just now</p>
                        </div>
                        <div className="activity-amount">+₹1</div>
                    </div>
                    
                    <div className="activity-item pending">
                        <div className="activity-icon">⏳</div>
                        <div className="activity-content">
                            <p className="activity-title">Withdrawal Requested</p>
                            <p className="activity-time">2 hours ago</p>
                        </div>
                        <div className="activity-amount">-₹500</div>
                    </div>
                    
                    <div className="activity-item info">
                        <div className="activity-icon">ℹ️</div>
                        <div className="activity-content">
                            <p className="activity-title">Daily Limit Reminder</p>
                            <p className="activity-time">Today, 10:00 AM</p>
                        </div>
                        <div className="activity-amount">25/50 clicks</div>
                    </div>
                </div>
            </div>

            {/* Tips & Info */}
            <div className="tips-section">
                <h3>💡 Tips to Maximize Earnings</h3>
                <div className="tips-grid">
                    <div className="tip-card">
                        <div className="tip-icon">🎯</div>
                        <h4>Click Daily</h4>
                        <p>Make clicking banners a daily habit. You can earn up to ₹50 per day.</p>
                    </div>
                    
                    <div className="tip-card">
                        <div className="tip-icon">⏰</div>
                        <h4>Set Reminders</h4>
                        <p>Set daily reminders to never miss your earning opportunities.</p>
                    </div>
                    
                    <div className="tip-card">
                        <div className="tip-icon">👥</div>
                        <h4>Refer Friends</h4>
                        <p>Invite friends and earn 20% of their earnings for 30 days.</p>
                    </div>
                    
                    <div className="tip-card">
                        <div className="tip-icon">📱</div>
                        <h4>Use Mobile App</h4>
                        <p>Download our mobile app for easier access and push notifications.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Optional CSS (can be moved to Dashboard.css)
const styles = `
.dashboard-container {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 20px;
}

.dashboard-header h1 {
    color: #333;
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.time-range-selector {
    display: flex;
    gap: 10px;
    background: #f8f9fa;
    padding: 5px;
    border-radius: 10px;
}

.time-btn {
    padding: 8px 16px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s;
}

.time-btn.active {
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    color: #667eea;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    border-radius: 15px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    transition: transform 0.3s;
}

.stat-card:hover {
    transform: translateY(-5px);
}

.stat-card.earnings { border-left: 4px solid #4CAF50; }
.stat-card.balance { border-left: 4px solid #2196F3; }
.stat-card.today { border-left: 4px solid #FF9800; }
.stat-card.total { border-left: 4px solid #9C27B0; }
.stat-card.withdrawal { border-left: 4px solid #F44336; }
.stat-card.rate { border-left: 4px solid #00BCD4; }

.stat-icon {
    font-size: 32px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 12px;
}

.stat-content h3 {
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
    font-weight: 500;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #333;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 12px;
    color: #999;
}

.charts-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 30px;
    margin-bottom: 30px;
}

@media (max-width: 1100px) {
    .charts-section {
        grid-template-columns: 1fr;
    }
}

.chart-container {
    background: white;
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.chart-container h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: 600;
}

.chart-wrapper {
    height: 300px;
}

.quick-actions {
    background: white;
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 30px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.quick-actions h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: 600;
}

.action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.action-btn {
    background: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.action-btn:hover:not(:disabled) {
    background: white;
    border-color: #667eea;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-icon {
    font-size: 32px;
    margin-bottom: 5px;
}

.action-text {
    font-weight: 600;
    color: #333;
    font-size: 16px;
}

.action-subtext {
    font-size: 12px;
    color: #666;
}

.recent-activity {
    background: white;
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 30px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.recent-activity h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: 600;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.activity-item {
    display: flex;
    align-items: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 10px;
    gap: 15px;
}

.activity-item.success {
    border-left: 4px solid #4CAF50;
}

.activity-item.pending {
    border-left: 4px solid #FF9800;
}

.activity-item.info {
    border-left: 4px solid #2196F3;
}

.activity-icon {
    font-size: 20px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 10px;
}

.activity-content {
    flex: 1;
}

.activity-title {
    font-weight: 500;
    color: #333;
    margin-bottom: 5px;
}

.activity-time {
    font-size: 12px;
    color: #999;
}

.activity-amount {
    font-weight: 600;
    font-size: 18px;
}

.activity-item.success .activity-amount {
    color: #4CAF50;
}

.activity-item.pending .activity-amount {
    color: #FF9800;
}

.tips-section {
    background: white;
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.tips-section h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
}

.tips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.tip-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s;
}

.tip-card:hover {
    background: white;
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    transform: translateY(-3px);
}

.tip-icon {
    font-size: 24px;
    margin-bottom: 15px;
}

.tip-card h4 {
    color: #333;
    margin-bottom: 10px;
    font-size: 16px;
    font-weight: 600;
}

.tip-card p {
    color: #666;
    font-size: 14px;
    line-height: 1.5;
}

.dashboard-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}

export default Dashboard;