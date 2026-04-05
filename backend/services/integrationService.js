/**
 * Integration Service
 * Third-party integrations (Google Calendar, Zalo, etc.)
 */

const axios = require('axios');
const { google } = require('googleapis');
const logger = require('./loggerService');

class IntegrationService {
  /**
   * Google Calendar Integration
   */
  static async syncToGoogleCalendar(event, userCredentials) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials(userCredentials);

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const calendarEvent = {
        summary: event.name,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start_time,
          timeZone: 'Asia/Ho_Chi_Minh'
        },
        end: {
          dateTime: event.end_time,
          timeZone: 'Asia/Ho_Chi_Minh'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent
      });

      logger.info(`Event synced to Google Calendar: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Error syncing to Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Zalo OA Integration - Send message
   */
  static async sendZaloMessage(userId, message) {
    try {
      const response = await axios.post(
        'https://openapi.zalo.me/v2.0/oa/message',
        {
          recipient: {
            user_id: userId
          },
          message: {
            text: message
          }
        },
        {
          headers: {
            'access_token': process.env.ZALO_ACCESS_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Zalo message sent to user ${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending Zalo message:', error);
      throw error;
    }
  }

  /**
   * Zalo OA Integration - Send notification
   */
  static async sendZaloNotification(userId, templateId, templateData) {
    try {
      const response = await axios.post(
        'https://openapi.zalo.me/v2.0/oa/message/template',
        {
          recipient: {
            user_id: userId
          },
          template_id: templateId,
          template_data: templateData
        },
        {
          headers: {
            'access_token': process.env.ZALO_ACCESS_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Zalo notification sent to user ${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending Zalo notification:', error);
      throw error;
    }
  }

  /**
   * Facebook Integration - Post to page
   */
  static async postToFacebookPage(message, imageUrl = null) {
    try {
      const params = {
        message: message,
        access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN
      };

      if (imageUrl) {
        params.url = imageUrl;
      }

      const endpoint = imageUrl 
        ? `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}/photos`
        : `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}/feed`;

      const response = await axios.post(endpoint, params);

      logger.info(`Posted to Facebook page: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Error posting to Facebook:', error);
      throw error;
    }
  }

  /**
   * SMS Integration - Send SMS via provider
   */
  static async sendSMS(phoneNumber, message) {
    try {
      // Example using a generic SMS provider
      const response = await axios.post(
        process.env.SMS_PROVIDER_URL || 'https://api.sms-provider.com/send',
        {
          to: phoneNumber,
          message: message,
          from: process.env.SMS_SENDER_NAME || 'CLB Vo HUTECH'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`SMS sent to ${phoneNumber}`);
      return response.data;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * VNPay Payment Integration - Create payment URL
   */
  static createVNPayPaymentUrl(orderId, amount, orderInfo, ipAddr) {
    const crypto = require('crypto');
    const querystring = require('querystring');

    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return';
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_SECRET_KEY;

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const expireDate = new Date(date.getTime() + 15 * 60000).toISOString().replace(/[-:T.]/g, '').slice(0, 14);

    let vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: amount * 100,
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr,
      vnp_Locale: 'vn',
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: orderId,
      vnp_ExpireDate: expireDate
    };

    // Sort params
    vnpParams = Object.keys(vnpParams)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnpParams[key];
        return acc;
      }, {});

    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams.vnp_SecureHash = signed;

    const paymentUrl = vnpUrl + '?' + querystring.stringify(vnpParams, { encode: false });

    return paymentUrl;
  }

  /**
   * VNPay Payment Integration - Verify return URL
   */
  static verifyVNPayReturn(vnpParams) {
    const crypto = require('crypto');
    const querystring = require('querystring');

    const secureHash = vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Sort params
    const sortedParams = Object.keys(vnpParams)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnpParams[key];
        return acc;
      }, {});

    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', process.env.VNPAY_SECRET_KEY);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  /**
   * MoMo Payment Integration - Create payment
   */
  static async createMoMoPayment(orderId, amount, orderInfo) {
    try {
      const crypto = require('crypto');

      const partnerCode = process.env.MOMO_PARTNER_CODE;
      const accessKey = process.env.MOMO_ACCESS_KEY;
      const secretKey = process.env.MOMO_SECRET_KEY;
      const redirectUrl = process.env.MOMO_REDIRECT_URL;
      const ipnUrl = process.env.MOMO_IPN_URL;
      const requestType = 'captureWallet';
      const extraData = '';

      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${orderId}&requestType=${requestType}`;

      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

      const requestBody = {
        partnerCode,
        accessKey,
        requestId: orderId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: 'vi'
      };

      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/create',
        requestBody
      );

      logger.info(`MoMo payment created: ${orderId}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating MoMo payment:', error);
      throw error;
    }
  }

  /**
   * Google Drive Integration - Upload file
   */
  static async uploadToGoogleDrive(filePath, fileName, mimeType, userCredentials) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials(userCredentials);

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const fileMetadata = {
        name: fileName
      };

      const media = {
        mimeType: mimeType,
        body: require('fs').createReadStream(filePath)
      };

      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      logger.info(`File uploaded to Google Drive: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Error uploading to Google Drive:', error);
      throw error;
    }
  }
}

module.exports = IntegrationService;
