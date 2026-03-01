/**
 * Format a number as Vietnamese Dong (VND)
 * @param amount - The amount to format
 * @returns Formatted string with dot separator and ₫ symbol (e.g., "1.000.000 ₫")
 */
export const formatVND = (amount: number): string => {
    // Round to nearest integer (VND has no decimals)
    const rounded = Math.round(amount);
    
    // Format with dot as thousand separator
    const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formatted} ₫`;
};

/**
 * Format a large VND amount in compact form (K for thousands, M for millions)
 * @param amount - The amount to format
 * @returns Compact formatted string (e.g., "150M ₫")
 */
export const formatVNDCompact = (amount: number): string => {
    const rounded = Math.round(amount);
    
    if (rounded >= 1000000000) {
        return `${(rounded / 1000000000).toFixed(1)}B ₫`;
    } else if (rounded >= 1000000) {
        return `${(rounded / 1000000).toFixed(1)}M ₫`;
    } else if (rounded >= 1000) {
        return `${(rounded / 1000).toFixed(1)}K ₫`;
    }
    
    return `${rounded} ₫`;
};
