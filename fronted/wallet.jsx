import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Wallet = ({ userId }) => {
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClickHistory();
    }, [userId]);

    const fetchClickHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/wallet/clicks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClicks(response.data.clicks);
        } catch (error) {
            console.error('Error fetching click history:', error);
            toast.error('Failed to load click history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div>
            <h2>Click History</h2>
            {loading ? (
                <p>Loading history...</p>
            ) : clicks.length === 0 ? (
                <p>No click history available</p>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Banner ID</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clicks.map((click, index) => (
                            <tr key={index}>
                                <td>{formatDate(click.timestamp)}</td>
                                <td>{click.bannerId}</td>
                                <td>₹{click.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Wallet;