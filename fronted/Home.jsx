import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Banner from '../components/Banner';
import Wallet from '../components/Wallet';
import Withdrawal from '../components/Withdrawal';

const Home = () => {
    const [user, setUser] = useState(null);
    const [wallet, setWallet] = useState({ balance: 0, clicksToday: 0, totalEarned: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('banner');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            setUser(JSON.parse(userData));
            fetchWallet();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchWallet = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/wallet/balance', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWallet(response.data);
        } catch (error) {
            console.error('Error fetching wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBannerClick = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/wallet/click', 
                { bannerId: 'banner_1' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setWallet({
                ...wallet,
                balance: response.data.walletBalance,
                clicksToday: response.data.clicksToday
            });
            
            toast.success(`₹1 added to wallet! Total: ₹${response.data.walletBalance}`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Click failed');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.info('Logged out successfully');
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <div>
                    <h1>Welcome, {user?.name}!</h1>
                    <p>Earn money by clicking banners</p>
                </div>
                <div className="user-info">
                    <div className="wallet-balance">
                        ₹{wallet.balance}
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>

            <div className="dashboard">
                <div className="card">
                    <h3>Today's Earnings</h3>
                    <div className="stats">
                        <div className="stat-value">₹{wallet.clicksToday}</div>
                        <div className="stat-label">from {wallet.clicksToday} clicks</div>
                    </div>
                </div>
                
                <div className="card">
                    <h3>Total Earned</h3>
                    <div className="stats">
                        <div className="stat-value">₹{wallet.totalEarned}</div>
                        <div className="stat-label">lifetime earnings</div>
                    </div>
                </div>
                
                <div className="card">
                    <h3>Wallet Balance</h3>
                    <div className="stats">
                        <div className="stat-value">₹{wallet.balance}</div>
                        <div className="stat-label">available for withdrawal</div>
                    </div>
                </div>
            </div>

            <div className="tabs">
                <button 
                    className={`tab-btn ${activeTab === 'banner' ? 'active' : ''}`}
                    onClick={() => setActiveTab('banner')}
                >
                    Click & Earn
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wallet')}
                >
                    Wallet
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'withdrawal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('withdrawal')}
                >
                    Withdraw
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'banner' && (
                    <Banner 
                        clicksToday={wallet.clicksToday}
                        onBannerClick={handleBannerClick}
                    />
                )}
                
                {activeTab === 'wallet' && (
                    <Wallet userId={user?.id} />
                )}
                
                {activeTab === 'withdrawal' && (
                    <Withdrawal 
                        walletBalance={wallet.balance}
                        onWithdrawalSuccess={fetchWallet}
                    />
                )}
            </div>
        </div>
    );
};

export default Home;