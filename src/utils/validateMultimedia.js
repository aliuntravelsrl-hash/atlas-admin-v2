/**
 * Validation utility for Hotel Multimedia Data
 */

export const validateMultimediaStructure = (hotelData) => {
  const report = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!hotelData) return { isValid: false, errors: ['No data provided'] };

  // 1. Video Validation
  if (!hotelData.video_id) {
    report.warnings.push('Missing video_id');
  } else if (hotelData.video_id.length !== 11) {
     // YouTube IDs are typically 11 chars
     report.warnings.push(`Suspicious video_id length: ${hotelData.video_id}`);
  }

  // 2. Gallery Validation
  if (!Array.isArray(hotelData.gallery_data)) {
     report.errors.push('gallery_data is not an array');
     report.isValid = false;
  } else {
     if (hotelData.gallery_data.length < 5) report.warnings.push(`Low gallery count: ${hotelData.gallery_data.length}`);
     const hasInvalidItems = hotelData.gallery_data.some(img => !img.src || !img.title);
     if (hasInvalidItems) report.errors.push('Some gallery items missing src or title');
  }

  // 3. Restaurants Validation
  if (Array.isArray(hotelData.restaurants_data)) {
      const missingFields = hotelData.restaurants_data.some(r => !r.name || !r.hours);
      if (missingFields) report.warnings.push('Some restaurants missing core fields (name/hours)');
  }

  return report;
};