
/**
 * 4) VALIDACIÓN DE SALIDA (Data Guard)
 * Garantiza que el objeto hotel tenga la estructura mínima requerida para no romper el UI.
 */
export const validateHotelJSONBData = (hotel) => {
    // Alias to main function
    return validateHotelData(hotel);
};

export const validateHotelData = (hotel) => {
  if (!hotel) return null;

  // 1. Estructura Base
  const safeHotel = {
    ...hotel,
    name: hotel.name || 'Nombre no disponible',
    slug: hotel.slug || 'unknown-slug',
    description: hotel.description || '',
    stars: Number(hotel.stars) || 4,
    location: hotel.location || 'República Dominicana',
    
    // 2. Arrays JSONB (Garantizados por el Molde de Hierro, pero doble check aquí)
    gallery_data: Array.isArray(hotel.gallery_data) ? hotel.gallery_data : [],
    services_data: Array.isArray(hotel.services_data) ? hotel.services_data : [],
    restaurants_data: Array.isArray(hotel.restaurants_data) ? hotel.restaurants_data : [],
    rooms_data: Array.isArray(hotel.rooms_data) ? hotel.rooms_data : [],
    
    // 3. Multimedia - Mapeo inteligente desde about_image o gallery_data
    image_url: hotel.about_image || 
               (Array.isArray(hotel.gallery_data) && hotel.gallery_data.length > 0 ? hotel.gallery_data[0] : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'),
    video_id: hotel.video_id || '',
    video_url: hotel.video_url || ''
  };

  // Logging de validación para desarrollo
  if (import.meta.env.DEV && (!safeHotel.gallery_data.length || !safeHotel.services_data.length)) {
      // console.warn(`[validateHotelData] ⚠️ Hotel ${safeHotel.slug} tiene arrays vacíos.`);
  }

  return safeHotel;
};
