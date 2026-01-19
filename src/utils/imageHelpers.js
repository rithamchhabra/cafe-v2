export const getOptimizedImageUrl = (url, width = 'auto') => {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;

    // Split URL to inject transformations
    const parts = url.split('/upload/');
    if (parts.length < 2) return url;

    // Add transformations:
    // f_auto: Format auto (WebP/AVIF)
    // q_auto: Quality auto (good compression)
    // c_limit,w_{width}: Resize to width, checking limit to avoid upscaling
    // dpr_auto: Device Pixel Ratio auto
    const params = [`f_auto`, `q_auto`, `dpr_auto`];

    if (width !== 'auto') {
        params.push(`c_limit,w_${width}`);
    }

    return `${parts[0]}/upload/${params.join(',')}/${parts[1]}`;
};
