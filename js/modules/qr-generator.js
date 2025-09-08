// QR Code generator utility
import QRCode from 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm';

/**
 * Generate QR code as SVG string
 * @param {string} data - Data to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<string>} SVG string
 */
export async function generateQRCode(data, options = {}) {
  const defaultOptions = {
    width: 256,
    height: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    type: 'svg',
    quality: 0.92,
    errorCorrectionLevel: 'H'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const svgString = await QRCode.toString(data, mergedOptions);
    return svgString;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code as data URL
 * @param {string} data - Data to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Data URL
 */
export async function generateQRCodeDataURL(data, options = {}) {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    type: 'image/png',
    quality: 0.92,
    errorCorrectionLevel: 'H'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const dataUrl = await QRCode.toDataURL(data, mergedOptions);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw error;
  }
}

/**
 * Generate QR code and download it
 * @param {string} data - Data to encode in QR code
 * @param {string} filename - Download filename
 * @param {Object} options - QR code options
 */
export async function downloadQRCode(data, filename = 'qrcode.png', options = {}) {
  try {
    const dataUrl = await generateQRCodeDataURL(data, options);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code for loyalty program
 * @param {string} userId - User ID
 * @param {Object} userData - Additional user data
 * @returns {Promise<string>} SVG string
 */
export async function generateLoyaltyQRCode(userId, userData = {}) {
  const qrData = JSON.stringify({
    type: 'loyalty',
    userId: userId,
    timestamp: Date.now(),
    ...userData
  });
  
  return generateQRCode(qrData, {
    width: 200,
    height: 200,
    margin: 1,
    color: {
      dark: '#b71c1c', // Primary brand color
      light: '#ffffff'
    }
  });
}

/**
 * Generate QR code for product information
 * @param {string} productId - Product ID
 * @param {Object} productData - Additional product data
 * @returns {Promise<string>} SVG string
 */
export async function generateProductQRCode(productId, productData = {}) {
  const qrData = JSON.stringify({
    type: 'product',
    productId: productId,
    timestamp: Date.now(),
    ...productData
  });
  
  return generateQRCode(qrData, {
    width: 200,
    height: 200,
    margin: 1,
    color: {
      dark: '#2e7d32', // Secondary brand color
      light: '#ffffff'
    }
  });
}

/**
 * Parse QR code data
 * @param {string} qrData - QR code data string
 * @returns {Object} Parsed data
 */
export function parseQRCodeData(qrData) {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return { raw: qrData };
  }
}

/**
 * Validate QR code data
 * @param {Object} data - Parsed QR code data
 * @returns {boolean} True if valid
 */
export function validateQRCodeData(data) {
  if (!data.type || !data.timestamp) {
    return false;
  }
  
  // Check if QR code is expired (24 hours)
  const qrAge = Date.now() - data.timestamp;
  if (qrAge > 24 * 60 * 60 * 1000) {
    return false;
  }
  
  // Type-specific validation
  switch (data.type) {
    case 'loyalty':
      return !!data.userId;
    case 'product':
      return !!data.productId;
    default:
      return false;
  }
}

/**
 * Create QR code scanner
 * @param {HTMLElement} videoElement - Video element for camera feed
 * @param {Function} onResult - Callback for scan results
 * @returns {Object} Scanner instance with start/stop methods
 */
export function createQRScanner(videoElement, onResult) {
  let scanner = null;
  
  const startScanner = async () => {
    try {
      // Check if browser supports QR scanning
      if (!('BarcodeDetector' in window)) {
        throw new Error('QR scanning not supported in this browser');
      }
      
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      videoElement.srcObject = stream;
      await videoElement.play();
      
      // Create barcode detector
      const barcodeDetector = new BarcodeDetector({
        formats: ['qr_code']
      });
      
      // Start detection loop
      const detectFrame = async () => {
        if (!scanner) return;
        
        try {
          const barcodes = await barcodeDetector.detect(videoElement);
          
          if (barcodes.length > 0) {
            const qrData = parseQRCodeData(barcodes[0].rawValue);
            
            if (validateQRCodeData(qrData)) {
              onResult(qrData);
              stopScanner();
            }
          }
        } catch (error) {
          console.error('QR detection error:', error);
        }
        
        if (scanner) {
          requestAnimationFrame(detectFrame);
        }
      };
      
      detectFrame();
      
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      throw error;
    }
  };
  
  const stopScanner = () => {
    if (videoElement.srcObject) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    scanner = null;
  };
  
  return {
    start: startScanner,
    stop: stopScanner,
    isRunning: () => scanner !== null
  };
}

// Initialize QR scanner when needed
export function initializeQRScanner() {
  const scannerContainer = document.getElementById('qr-scanner');
  
  if (scannerContainer) {
    const video = document.createElement('video');
    video.style.width = '100%';
    video.style.height = '100%';
    scannerContainer.appendChild(video);
    
    return createQRScanner(video, (result) => {
      console.log('QR code scanned:', result);
      // Handle scan result based on type
      switch (result.type) {
        case 'loyalty':
          handleLoyaltyQR(result);
          break;
        case 'product':
          handleProductQR(result);
          break;
      }
    });
  }
}

// Handle loyalty QR code
function handleLoyaltyQR(data) {
  // Implement loyalty QR handling
  console.log('Loyalty QR scanned:', data);
}

// Handle product QR code
function handleProductQR(data) {
  // Implement product QR handling
  console.log('Product QR scanned:', data);
}

export default {
  generateQRCode,
  generateQRCodeDataURL,
  downloadQRCode,
  generateLoyaltyQRCode,
  generateProductQRCode,
  parseQRCodeData,
  validateQRCodeData,
  createQRScanner,
  initializeQRScanner
};