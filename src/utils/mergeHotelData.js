/**
 * Utility: mergeHotelData
 * Implements Supabase-First architecture priority logic.
 * 
 * @param {Object} supabaseData - Data fetched directly from Supabase (Priority 1)
 * @param {Object} localData - Data from local files (Priority 2 / Fallback)
 * @returns {Object} Merged hotel object
 */
export const mergeHotelData = (supabaseData, localData) => {
    // 1. Initial Validation
    if (!supabaseData && !localData) return null;
    
    // Start with empty base to avoid mutation
    const merged = {};

    // 2. Helper to decide value
    // Priority: supabaseData defined and not null > localData defined
    const getValue = (key, fallback = null) => {
        if (supabaseData && supabaseData[key] !== undefined && supabaseData[key] !== null) {
            // Check for empty strings if strict check needed? 
            // For now, if DB says "", we use "".
            return supabaseData[key];
        }
        if (localData && localData[key] !== undefined && localData[key] !== null) {
            return localData[key];
        }
        return fallback;
    };

    // 3. Helper for Array merging/fallback (No mixing items, complete replacement)
    const getArray = (key) => {
        const dbArray = supabaseData ? supabaseData[key] : undefined;
        if (Array.isArray(dbArray) && dbArray.length > 0) return dbArray;
        
        const localArray = localData ? localData[key] : undefined;
        if (Array.isArray(localArray) && localArray.length > 0) return localArray;
        
        return [];
    };

    // 4. Merge Logic - Section by Section
    
    // Core Identity
    merged.id = getValue('id');
    merged.slug = getValue('slug');
    merged.name = getValue('name');
    merged.publish = getValue('publish', false);
    
    // Hero & Basic Info
    merged.description = getValue('description');
    merged.long_description = getValue('long_description');
    merged.stars = getValue('stars') || getValue('rating') || 4;
    merged.rating = getValue('rating') || getValue('stars') || 4;
    merged.location = getValue('location') || getValue('zone');
    merged.address = getValue('address');
    merged.phone = getValue('phone');
    merged.email = getValue('email');
    
    // Media
    merged.video_id = getValue('video_id');
    merged.about_image = getValue('about_image');
    merged.image_url = getValue('image_url') || getValue('image'); // legacy

    // Complex JSONB Data (Supabase Priority)
    merged.gallery_data = getArray('gallery_data');
    merged.rooms_data = getArray('rooms_data');
    merged.services_data = getArray('services_data');
    merged.restaurants_data = getArray('restaurants_data');
    
    // Page Structure
    // Default structure if missing in both
    const defaultStructure = {
        sections: ["hero", "booking", "about", "services", "gastronomy", "rooms", "gallery", "location", "policies", "contact"]
    };
    
    const dbStructure = supabaseData?.page_structure;
    if (dbStructure && dbStructure.sections && Array.isArray(dbStructure.sections)) {
        merged.page_structure = dbStructure;
    } else if (localData?.page_structure) {
        merged.page_structure = localData.page_structure;
    } else {
        merged.page_structure = defaultStructure;
    }

    // Lists
    merged.highlights = getArray('highlights');
    merged.amenities = getArray('amenities');
    
    // Geolocation
    merged.latitude = getValue('latitude');
    merged.longitude = getValue('longitude');
    if (merged.latitude && merged.longitude) {
        merged.coordinates = { lat: merged.latitude, lng: merged.longitude };
    }

    // Metadata
    merged.source = supabaseData ? 'supabase' : 'local_fallback';
    merged.is_merged = true;

    // Log Warnings for empty critical sections
    if (merged.rooms_data.length === 0) console.warn(`[mergeHotelData] Warning: No rooms_data for ${merged.name}`);
    
    return merged;
};