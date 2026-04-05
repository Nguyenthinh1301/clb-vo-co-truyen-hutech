const crypto = require('crypto');
const querystring = require('querystring');
const db = require('../config/db');

class PaymentService {
    constructor() {
        this.vnpayConfig = {
            tmnCode: process.env.VNPAY_TMN_CODE || '',
            secretKey: process.env.VNPAY_SECRET_KEY || '',
            url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payments/vnpay/return',
            apiUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'
        };
    }

    // Create VNPay payment URL
    createVNPayPaymentUrl(paymentData) {
        const {
            amount,
            orderInfo,
            orderId,
            ipAddr,
            locale = 'vn',
            bankCode = ''
        } = paymentData;

        const date = new Date();
        const createDate = this.formatDate(date);
        const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

        let vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.vnpayConfig.tmnCode,
            vnp_Locale: locale,
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_Amount: amount * 100, // VNPay requires amount in smallest currency unit
            vnp_ReturnUrl: this.vnpayConfig.returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate
        };

        if (bankCode) {
            vnpParams.vnp_BankCode = bankCode;
        }

        // Sort parameters
        vnpParams = this.sortObject(vnpParams);

        // Create signature
        const signData = querystring.stringify(vnpParams, { encode: false });
        const hmac = crypto.createHmac('sha512', this.vnpayConfig.secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnpParams.vnp_SecureHash = signed;

        // Create payment URL
        const paymentUrl = this.vnpayConfig.url + '?' + querystring.stringify(vnpParams, { encode: false });

        return {
            success: true,
            paymentUrl,
            orderId
        };
    }

    // Verify VNPay return
    verifyVNPayReturn(vnpParams) {
        const secureHash = vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHashType;

        // Sort parameters
        const sortedParams = this.sortObject(vnpParams);

        // Create signature
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', this.vnpayConfig.secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            return {
                success: true,
                isValid: true,
                responseCode: vnpParams.vnp_ResponseCode,
                transactionNo: vnpParams.vnp_TransactionNo,
                amount: vnpParams.vnp_Amount / 100,
                orderId: vnpParams.vnp_TxnRef,
                bankCode: vnpParams.vnp_BankCode,
                payDate: vnpParams.vnp_PayDate
            };
        } else {
            return {
                success: false,
                isValid: false,
                message: 'Invalid signature'
            };
        }
    }

    // Create payment record
    async createPayment(paymentData) {
        try {
            const {
                user_id,
                reference_type,
                reference_id,
                amount,
                payment_method = 'vnpay',
                notes = ''
            } = paymentData;

            const paymentId = await db.insert('payments', {
                user_id,
                reference_type,
                reference_id,
                amount,
                currency: 'VND',
                payment_method,
                status: 'pending',
                notes
            });

            return {
                success: true,
                paymentId,
                message: 'Payment record created'
            };
        } catch (error) {
            console.error('Create payment error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Update payment status
    async updatePaymentStatus(paymentId, status, transactionData = {}) {
        try {
            const updateData = {
                status,
                paid_at: status === 'completed' ? new Date() : null,
                transaction_id: transactionData.transactionNo || null,
                gateway_response: JSON.stringify(transactionData)
            };

            await db.update('payments', updateData, 'id = ?', [paymentId]);

            // Update related records based on reference type
            const payment = await db.findOne('SELECT * FROM payments WHERE id = ?', [paymentId]);
            
            if (status === 'completed' && payment) {
                await this.updateRelatedRecords(payment);
            }

            return {
                success: true,
                message: 'Payment status updated'
            };
        } catch (error) {
            console.error('Update payment status error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Update related records after successful payment
    async updateRelatedRecords(payment) {
        try {
            switch (payment.reference_type) {
                case 'class_enrollment':
                    await db.update(
                        'class_enrollments',
                        { payment_status: 'paid' },
                        'id = ?',
                        [payment.reference_id]
                    );
                    break;

                case 'event_registration':
                    await db.update(
                        'event_registrations',
                        { payment_status: 'paid' },
                        'id = ?',
                        [payment.reference_id]
                    );
                    break;

                case 'membership_fee':
                    await db.update(
                        'users',
                        { membership_status: 'active' },
                        'id = ?',
                        [payment.user_id]
                    );
                    break;
            }

            // Create notification
            await db.insert('notifications', {
                user_id: payment.user_id,
                title: 'Thanh toán thành công',
                message: `Thanh toán ${this.formatCurrency(payment.amount)} đã được xử lý thành công.`,
                type: 'payment',
                priority: 'medium'
            });

            return { success: true };
        } catch (error) {
            console.error('Update related records error:', error);
            return { success: false, message: error.message };
        }
    }

    // Get payment by order ID
    async getPaymentByOrderId(orderId) {
        try {
            const payment = await db.findOne(
                'SELECT * FROM payments WHERE id = ?',
                [orderId]
            );

            if (!payment) {
                return {
                    success: false,
                    message: 'Payment not found'
                };
            }

            return {
                success: true,
                payment
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Get user payment history
    async getUserPaymentHistory(userId, options = {}) {
        try {
            const { page = 1, limit = 10, status } = options;

            let whereClause = 'user_id = ?';
            let params = [userId];

            if (status) {
                whereClause += ' AND status = ?';
                params.push(status);
            }

            const sql = `
                SELECT p.*, 
                 CASE 
                    WHEN p.reference_type = 'class_enrollment' THEN c.name
                    WHEN p.reference_type = 'event_registration' THEN e.title
                    ELSE 'Khác'
                 END as reference_name
                 FROM payments p
                 LEFT JOIN class_enrollments ce ON p.reference_type = 'class_enrollment' AND p.reference_id = ce.id
                 LEFT JOIN classes c ON ce.class_id = c.id
                 LEFT JOIN event_registrations er ON p.reference_type = 'event_registration' AND p.reference_id = er.id
                 LEFT JOIN events e ON er.event_id = e.id
                 WHERE ${whereClause}
                 ORDER BY p.created_at DESC
            `;

            const result = await db.findMany(sql, params, page, limit);

            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Get payment statistics
    async getPaymentStatistics(options = {}) {
        try {
            const { start_date, end_date, user_id } = options;

            let whereClause = '1=1';
            let params = [];

            if (start_date) {
                whereClause += ' AND created_at >= ?';
                params.push(start_date);
            }

            if (end_date) {
                whereClause += ' AND created_at <= ?';
                params.push(end_date);
            }

            if (user_id) {
                whereClause += ' AND user_id = ?';
                params.push(user_id);
            }

            const stats = await db.query(`
                SELECT 
                 COUNT(*) as total_payments,
                 SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
                 SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
                 SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
                 SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                 AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_payment_amount
                 FROM payments
                 WHERE ${whereClause}
            `, params);

            return {
                success: true,
                data: stats[0] || {}
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Refund payment
    async refundPayment(paymentId, reason = '') {
        try {
            const payment = await db.findOne('SELECT * FROM payments WHERE id = ?', [paymentId]);

            if (!payment) {
                return {
                    success: false,
                    message: 'Payment not found'
                };
            }

            if (payment.status !== 'completed') {
                return {
                    success: false,
                    message: 'Only completed payments can be refunded'
                };
            }

            // Update payment status
            await db.update(
                'payments',
                { 
                    status: 'refunded',
                    notes: `${payment.notes}\nRefunded: ${reason}`
                },
                'id = ?',
                [paymentId]
            );

            // Create notification
            await db.insert('notifications', {
                user_id: payment.user_id,
                title: 'Hoàn tiền',
                message: `Thanh toán ${this.formatCurrency(payment.amount)} đã được hoàn lại.`,
                type: 'payment',
                priority: 'high'
            });

            return {
                success: true,
                message: 'Payment refunded successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Utility functions
    sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        keys.forEach(key => {
            sorted[key] = obj[key];
        });
        return sorted;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}

// Create and export payment service instance
const paymentService = new PaymentService();

module.exports = paymentService;