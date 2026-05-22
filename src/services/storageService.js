import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'hotel-media';

export const storageService = {
  /**
   * Sube un archivo al bucket hotel-media
   * @param {File} file - El archivo a subir
   * @param {string} folderPath - Ruta carpeta (ej: 'blue-bay/rooms')
   * @returns {Promise<string>} - URL pública del archivo
   */
  async uploadFile(file, folderPath) {
    if (!file) throw new Error("No file provided");

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`.replace(/\/+/g, '/'); // Clean double slashes

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * Elimina un archivo dada su URL pública (intenta parsear el path)
   * @param {string} publicUrl 
   */
  async deleteFile(publicUrl) {
    if (!publicUrl) return;

    // Extract path from URL
    // URL format: .../storage/v1/object/public/hotel-media/folder/file.jpg
    const urlParts = publicUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return; // Not a storage URL or different bucket
    
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  /**
   * Notifica a n8n sobre la subida de un nuevo archivo (Webhook opcional)
   */
  async notifyN8N(payload) {
      // Implementación futura si se requiere procesamiento de imagen
      // fetch('https://webhook.n8n...', { method: 'POST', body: JSON.stringify(payload) })
      console.log('N8N Notification Payload:', payload);
  }
};