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
    if (!timeStr) return '';
    const str = String(timeStr).trim();
    if (!str) return '';

    // Extract hours and minutes regardless of AM/PM in string
    const match = str.match(/(\d{1,2})[\s:]+(\d{1,2})/);
    if (!match) return str;

    let h = parseInt(match[1]);
    const m = match[2].padStart(2, '0');

    // Handle case where it might already be AM/PM but needs standardization
    const isPM = str.toLowerCase().includes('pm');
    const isAM = str.toLowerCase().includes('am');

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;

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

    const parseToMinutes = (str) => {
        const s = String(str).trim();
        const match = s.match(/(\d{1,2})[\s:]+(\d{1,2})/);
        if (!match) return 0;

        let h = parseInt(match[1]);
        const m = parseInt(match[2]);

        const isPM = s.toLowerCase().includes('pm');
        const isAM = s.toLowerCase().includes('am');

        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;

        return h * 60 + m;
    };

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const openTotalMinutes = parseToMinutes(openTime);
    let closeTotalMinutes = parseToMinutes(closeTime);

    // Handle overnight closing (e.g., 6 PM to 2 AM)
    if (closeTotalMinutes <= openTotalMinutes) {
        if (closeTotalMinutes === 0) {
            closeTotalMinutes = 24 * 60;
        } else {
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
