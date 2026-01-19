export const formatWhatsAppMessage = (cartItems, customerDetails, total, businessDetails) => {
    const itemsText = cartItems
        .map((item) => `- ${item.quantity}x ${item.name} (Rs. ${item.price * item.quantity})`)
        .join('\n');

    const upiLink = generateUPILink(businessDetails.upiId, businessDetails.name, total);

    let orderStyle = '';
    if (customerDetails.type === 'dining') {
        orderStyle = `Style: Dining (Table: ${customerDetails.tableNumber || 'N/A'})`;
    } else if (customerDetails.type === 'delivery') {
        orderStyle = `Style: Home Delivery\nAddress: ${customerDetails.address || 'N/A'}`;
    } else {
        orderStyle = 'Style: Takeaway';
    }

    const message = `Hello ${businessDetails.name}, I would like to place an order!

- CUSTOMER DETAILS -
Name: ${customerDetails.name}
Phone: ${customerDetails.phone}
${orderStyle}

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

export const formatTimeDisplay = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    if (!h || !m) return time24;

    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
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
    if (!openTime || !closeTime) return false;

    // Helper to convert HH:mm to minutes since midnight
    const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const start = toMinutes(openTime);
    const end = toMinutes(closeTime);

    // Standard business hours (e.g., 09:00 to 22:00)
    if (end > start) {
        return currentMinutes >= start && currentMinutes < end;
    }
    // Overnight business hours (e.g., 18:00 to 02:00)
    else {
        return currentMinutes >= start || currentMinutes < end;
    }
};

export const sanitize = (text) => {
    if (!text || typeof text !== 'string') return text;
    // Remove HTML tags and basic script-like patterns
    return text.replace(/<[^>]*>?/gm, '').replace(/[<>]/g, '');
};
