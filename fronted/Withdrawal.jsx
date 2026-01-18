import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Withdrawal = ({ walletBalance, onWithdrawalSuccess }) => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [method, setMethod] = useState('UPI');
    const [amount, setAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        ifscCode: '',
        accountHolder: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchWithdrawalHistory();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.user.upiId) {
                setUpiId(response.data.user.upiId);
            }
            if (response.data.user.bankAccount) {
                setBankDetails(response.data.user.bankAccount);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchWithdrawalHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/wallet/withdrawals', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWithdrawals(response.data.withdrawals);
        } catch (error) {
            console.error('Error fetching withdrawal history:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (parseFloat(amount) < 100) {
            toast.error('Minimum withdrawal amount is ₹100');
            return;
        }
        
        if (parseFloat(amount) > walletBalance) {
            toast.error('Insufficient balance');
            return;
        }

        if (method === 'UPI' && !upiId) {
            toast.error('Please enter UPI ID');
            return;
        }

        if (method === 'Bank') {
            if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolder) {
                toast.error('Please fill all bank details');
                return;
            }
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                amount: parseFloat(amount),
                method
            };

            if (method === 'UPI') {
                payload.upiId = upiId;
            } else {
                payload.bankDetails = bankDetails;
            }

            const response = await axios.post('http://localhost:5000/api/wallet/withdraw', 
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Withdrawal request submitted successfully!');
            setAmount('');
            
            // Update withdrawal history
            fetchWithdrawalHistory();
            
            // Call parent callback to update wallet balance
            if (onWithdrawalSuccess) {
                onWithdrawalSuccess();
            }

            // Save payment details to profile
            await axios.put('http://localhost:5000/api/auth/profile', 
                method === 'UPI' ? { upiId } : { bankAccount: bankDetails },
                { headers: { Authorization: `Bearer ${token}` } }
            );

        } catch (error) {
            toast.error(error.response?.data?.error || 'Withdrawal failed');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Pending': return 'status-pending';
            case 'Approved': return 'status-approved';
            case 'Rejected': return 'status-rejected';
            case 'Completed': return 'status-completed';
            default: return '';
        }
    };

    return (
        <div>
            <h2>Withdraw Money</h2>
            <p>Minimum withdrawal: ₹100 | Current balance: ₹{walletBalance}</p>
            
            <form onSubmit={handleSubmit} className="withdrawal-form">
                <div className="form-group">
                    <label>Amount (₹)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="100"
                        max={walletBalance}
                        step="1"
                        required
                        placeholder="Enter amount"
                    />
                </div>

                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            value="UPI"
                            checked={method === 'UPI'}
                            onChange={(e) => setMethod(e.target.value)}
                        />
                        UPI
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="Bank"
                            checked={method === 'Bank'}
                            onChange={(e) => setMethod(e.target.value)}
                        />
                        Bank Transfer
                    </label>
                </div>

                {method === 'UPI' ? (
                    <div className="form-group">
                        <label>UPI ID</label>
                        <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            required
                            placeholder="yourname@upi"
                        />
                    </div>
                ) : (
                    <>
                        <div className="form-group">
                            <label>Account Holder Name</label>
                            <input
                                type="text"
                                value={bankDetails.accountHolder}
                                onChange={(e) => setBankDetails({
                                    ...bankDetails,
                                    accountHolder: e.target.value
                                })}
                                required
                                placeholder="Enter account holder name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Account Number</label>
                            <input
                                type="text"
                                value={bankDetails.accountNumber}
                                onChange={(e) => setBankDetails({
                                    ...bankDetails,
                                    accountNumber: e.target.value
                                })}
                                required
                                placeholder="Enter account number"
                            />
                        </div>
                        <div className="form-group">
                            <label>IFSC Code</label>
                            <input
                                type="text"
                                value={bankDetails.ifscCode}
                                onChange={(e) => setBankDetails({
                                    ...bankDetails,
                                    ifscCode: e.target.value
                                })}
                                required
                                placeholder="Enter IFSC code"
                            />
                        </div>
                    </>
                )}

                <button type="submit" className="btn" disabled={loading || walletBalance < 100}>
                    {loading ? 'Processing...' : 'Request Withdrawal'}
                </button>
            </form>

            <div style={{ marginTop: '40px' }}>
                <h3>Withdrawal History</h3>
                {withdrawals.length === 0 ? (
                    <p>No withdrawal history</p>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Transaction ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map((withdrawal, index) => (
                                <tr key={index}>
                                    <td>{formatDate(withdrawal.createdAt)}</td>
                                    <td>₹{withdrawal.amount}</td>
                                    <td>{withdrawal.method}</td>
                                    <td className={getStatusClass(withdrawal.status)}>
                                        {withdrawal.status}
                                    </td>
                                    <td>{withdrawal.transactionId || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Withdrawal;