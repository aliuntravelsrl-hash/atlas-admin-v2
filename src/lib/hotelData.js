// 🚨 [PURGA MOCKS v4.0] 
// Este archivo ha sido purgado de datos estáticos (MOCKS).
// Todos los datos deben ser consumidos directamente de Supabase.
// Se mantienen las exportaciones vacías para evitar errores de compilación en importaciones legacy.

export const hotelsData = {};
export const destinations = [];
export const getAllHotels = async () => {
  console.warn("⚠️ [DEPRECATED] getAllHotels usa datos estáticos purgados. Use supabase.from('hotels').select('*')");
  return [];
};
export const getHotelBySlug = async (slug) => {
  console.warn("⚠️ [DEPRECATED] getHotelBySlug usa datos estáticos purgados. Use supabase.from('hotels').select('*').eq('slug', slug)");
  return null;
};
export const hotelData = [];