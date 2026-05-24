import { supabase } from '@/lib/customSupabaseClient';

export const imageUploadService = {

  async uploadImage(file, hotelId, folderPath = 'gallery') {
    if (!file)    throw new Error('No se proporcionó ningún archivo.');
    if (!hotelId) throw new Error('El parámetro hotel_id es obligatorio.');
    if (file.size > 10 * 1024 * 1024) throw new Error('El archivo supera el límite de 10MB.');
    if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.');

    const ext      = file.name.split('.').pop().toLowerCase() || 'jpg';
    const filePath = `${hotelId}/gallery_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('hotel-images')
      .upload(filePath, file, { cacheControl: '31536000', upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('hotel-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async deleteImage(publicUrl) {
    if (!publicUrl) return;
    try {
      const marker = 'hotel-images/';
      if (publicUrl.includes(marker)) {
        const path = publicUrl.split(marker)[1];
        if (path) await supabase.storage.from('hotel-images').remove([path]);
      }
    } catch (e) {
      console.error('[ImageUploadService] Error eliminando:', e);
    }
  },

  async uploadImageToStorage(file, folderPath = 'gallery') {
    console.warn('[ImageUploadService] Deprecated: use uploadImage(file, hotelId)');
    return this.uploadImage(file, 'legacy', folderPath);
  }
};