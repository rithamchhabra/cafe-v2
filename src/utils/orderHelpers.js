export const formatWhatsAppMessage = (cartItems, customerDetails, total, businessDetails) => {
    const itemsText = cartItems
        .map((item) => `- ${item.quantity}x ${item.name} (Rs. ${item.price * item.quantity})`)
        .join('\n');

    const upiLink = generateUPILink(businessDetails.upiId, businessDetails.name, total);

    const message = `Hello ${businessDetails.name}, I would like to place an order!

- CUSTOMER DETAILS -
Name: ${customerDetails.name}
Phone: ${customerDetails.phone}
${customerDetails.address ? `Address: ${customerDetails.address}` : 'Style: Takeaway'}

- ORDER SUMMARY -
${itemsText}

--------------------------
TOTAL AMOUNT: Rs. ${total}
--------------------------

- PAYMENT VIA UPI -
${upiLink}

Please confirm my order once you receive the payment. Thank you!`;

    return encodeURIComponent(message);
};

export const formatTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return '';

    // Clean string (remove AM/PM if browser sent it along)
    const cleanTime = timeStr.replace(/\s?[AP]M/i, '').trim();
    const parts = cleanTime.split(':');
    if (parts.length < 2) return cleanTime; // Not a valid time format

    const [hours, minutes] = parts;
    const h = parseInt(hours);
    if (isNaN(h)) return cleanTime;

    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;

    // Ensure minutes are 2 digits
    const m = (minutes || '00').substring(0, 2);

    return `${h12}${m !== '00' ? ':' + m : ''} ${ampm}`;
};

export const generateUPILink = (upiId, name, amount) => {
    // upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
};

export const getUPIQRCode = (upiId, name, amount) => {
    const upiUrl = generateUPILink(upiId, name, amount);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
};

export const isStoreOpen = (openTime, closeTime) => {
    if (!openTime || !closeTime) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHours, openMinutes] = openTime.split(':').map(Number);
    const [closeHours, closeMinutes] = closeTime.split(':').map(Number);

    const openTotalMinutes = openHours * 60 + openMinutes;
    let closeTotalMinutes = closeHours * 60 + closeMinutes;

    // Handle overnight closing (e.g., 6 PM to 2 AM)
    if (closeTotalMinutes <= openTotalMinutes) {
        // If close time is 00:00, it's effectively 24:00 for the range check
        if (closeTotalMinutes === 0) {
            closeTotalMinutes = 24 * 60;
        } else {
            // It's an overnight shift. 
            // Either we are after opening time today, or before closing time today.
            return currentTime >= openTotalMinutes || currentTime < closeTotalMinutes;
        }
    }

    return currentTime >= openTotalMinutes && currentTime < closeTotalMinutes;
};

export const sanitize = (text) => {
    if (!text || typeof text !== 'string') return text;
    // Remove HTML tags and basic script-like patterns
    return text.replace(/<[^>]*>?/gm, '').replace(/[<>]/g, '');
};
