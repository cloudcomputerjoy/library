import QRCode from 'qrcode';

/**
 * QR Code Generation Utility
 * Generates random QR codes for books
 */

/**
 * Generate a random book QR code identifier
 * Format: BK-{timestamp}-{random}
 * @returns {string} Unique QR code ID
 */
export const generateQRCodeId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${timestamp}-${random}`;
};

/**
 * Generate multiple QR code IDs
 * @param {number} count - Number of QR codes to generate
 * @returns {Array<string>} Array of unique QR code IDs
 */
export const generateBatchQRCodeIds = (count) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateQRCodeId());
  }
  return codes;
};

/**
 * Create QR code image as data URL
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<string>} QR code as data URL
 */
export const generateQRCodeImage = async (data) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code canvas
 * @param {string} data - Data to encode in QR code
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @returns {Promise<void>}
 */
export const generateQRCodeOnCanvas = async (data, canvas) => {
  try {
    await QRCode.toCanvas(canvas, data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });
  } catch (error) {
    console.error('Error rendering QR code to canvas:', error);
    throw error;
  }
};

/**
 * Batch download QR codes as PDF
 * @param {Array<Object>} qrCodes - Array of {id, imageUrl}
 * @param {string} bookTitle - Book title for PDF
 * @returns {Promise<Blob>} PDF blob
 */
export const generateQRCodePDF = async (qrCodes, bookTitle) => {
  // Note: This requires jspdf and html2canvas libraries
  // For now, we'll create a basic implementation
  try {
    const qrCodesList = qrCodes.map(qr => `
      <div style="margin: 10px; text-align: center;">
        <img src="${qr.imageUrl}" alt="${qr.id}" style="width: 150px; height: 150px;" />
        <p>${qr.id}</p>
      </div>
    `).join('');

    const html = `
      <html>
        <head>
          <title>${bookTitle} - QR Codes</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .qr-container { display: flex; flex-wrap: wrap; }
            .qr-item { margin: 10px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${bookTitle} - QR Codes</h1>
          <div class="qr-container">${qrCodesList}</div>
        </body>
      </html>
    `;

    return new Blob([html], { type: 'text/html' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const qrCodeServiceMethods = {
  generateQRCodeId,
  generateBatchQRCodeIds,
  generateQRCodeImage,
  generateQRCodeOnCanvas,
  generateQRCodePDF,
};

export default qrCodeServiceMethods;
