/**
 * Utility to validate a Hotel Object against the Supabase-First Schema.
 * Used in Admin Dashboard and Data Migration tools.
 */
export const validateHotelSchema = (hotel) => {
    const errors = [];
    const warnings = [];

    if (!hotel) return { valid: false, errors: ["Hotel object is null"], warnings };

    // 1. Critical Identity
    if (!hotel.id) errors.push("Missing ID");
    if (!hotel.name) errors.push("Missing Name");
    if (!hotel.slug) errors.push("Missing Slug");

    // 2. Content
    if (!hotel.description) warnings.push("Missing short description");
    if (!hotel.long_description) warnings.push("Missing long description");

    // 3. JSONB Checks
    const checkArray = (field) => {
        if (!hotel[field]) {
            warnings.push(`Missing ${field} (using default empty array)`);
        } else if (!Array.isArray(hotel[field])) {
            errors.push(`Invalid type for ${field}: expected Array, got ${typeof hotel[field]}`);
        } else if (hotel[field].length === 0) {
            warnings.push(`Empty ${field}`);
        }
    };

    checkArray('gallery_data');
    checkArray('rooms_data');
    checkArray('services_data');
    checkArray('restaurants_data');

    // 4. Page Structure
    if (!hotel.page_structure || !Array.isArray(hotel.page_structure.sections)) {
        warnings.push("Invalid or missing page_structure.sections");
    }

    // 5. Numeric
    if (typeof hotel.stars !== 'number' && typeof hotel.rating !== 'number') {
        warnings.push("Missing valid numeric rating/stars");
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))
    };
};