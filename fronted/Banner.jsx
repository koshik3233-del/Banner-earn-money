import React from 'react';

const Banner = ({ clicksToday, onBannerClick }) => {
    const isLimitReached = clicksToday >= 50;

    return (
        <div className="banner-section">
            <h2>Click the Banner to Earn ₹1</h2>
            <p>You can click up to 50 times per day. Today: {clicksToday}/50 clicks</p>
            
            <div className="banner-container">
                <div className="banner-ad" onClick={!isLimitReached ? onBannerClick : null}>
                    <h2>ADVERTISEMENT</h2>
                    <p>Click this banner to earn ₹1 instantly!</p>
                    <button 
                        className="click-btn"
                        disabled={isLimitReached}
                    >
                        {isLimitReached ? 'Daily Limit Reached' : 'CLICK TO EARN ₹1'}
                    </button>
                </div>
            </div>
            
            <div style={{ marginTop: '20px', color: '#666' }}>
                <h3>How it works:</h3>
                <ul style={{ listStyle: 'none', padding: '0', textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
                    <li>✅ 1 Click = ₹1 added to your wallet</li>
                    <li>✅ Maximum 50 clicks per day</li>
                    <li>✅ Withdraw minimum ₹100 via UPI or Bank</li>
                    <li>✅ Instant wallet updates</li>
                    <li>✅ Secure payments</li>
                </ul>
            </div>
        </div>
    );
};

export default Banner;