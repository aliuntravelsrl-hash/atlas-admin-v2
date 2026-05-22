import { supabase } from '@/lib/customSupabaseClient';

/**
 * Servicio para la gestión de imágenes.
 * ACTUALIZADO: Integra subida directa a n8n Workflow D (Production).
 */
export const imageUploadService = {
  /**
   * Convierte un archivo a Base64
   */
  toBase64: (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  }),

  /**
   * Sube una imagen mediante Webhook n8n (Workflow D).
   * Endpoint: https://n8n-n8n.xaruuo.easypanel.host/webhook/admin/media-upload
   * 
   * @param {File} file - Archivo de imagen
   * @param {string} hotelId - ID del hotel (slug o uuid)
   * @param {string} folderPath - Carpeta destino (opcional, para referencia)
   * @returns {Promise<string>} URL pública de la imagen retornada por n8n
   */
  async uploadImage(file, hotelId, folderPath = 'general') {
    if (!file) throw new Error("No se proporcionó ningún archivo.");
    if (!hotelId) throw new Error("El parameter hotel_id es obligatorio para la subida.");

    console.log(`[ImageUploadService] 🚀 Iniciando subida n8n para hotel: ${hotelId}`);

    // Convertir a Base64
    const base64String = await this.toBase64(file);

    // Payload plano para n8n
    const payload = {
      hotel_id: hotelId,
      file: base64String,
      filename: file.name,
      type: file.type,
      folder: folderPath,
      source: 'admin_panel'
    };

    const ENDPOINT = "https://n8n-n8n.xaruuo.easypanel.host/webhook/admin/media-upload";
    
    console.log(`[ImageUploadService] 📡 Enviando a: ${ENDPOINT}`);
    console.log(`[ImageUploadService] 📦 Payload check (hotel_id): ${payload.hotel_id}`);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error n8n: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Asumimos que n8n retorna { url: "..." } o { data: { url: "..." } }
      const publicUrl = result.url || result.data?.url || result.publicUrl;

      if (!publicUrl) {
         console.warn("[ImageUploadService] ⚠️ n8n no retornó una URL explícita. Respuesta:", result);
         // Fallback si el workflow solo confirma éxito pero no devuelve URL (depende de la implementación n8n)
         // Retornamos null o lanzamos error según necesidad.
         // Intentaremos leer cualquier campo que parezca una URL
         const possibleUrl = Object.values(result).find(v => typeof v === 'string' && v.startsWith('http'));
         if (possibleUrl) return possibleUrl;
         
         throw new Error("La subida fue exitosa pero no se recibió la URL de la imagen.");
      }

      console.log(`[ImageUploadService] ✅ Imagen subida exitosamente: ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      console.error('[ImageUploadService] ❌ Error subiendo a n8n:', error);
      throw error;
    }
  },

  /**
   * Método legacy o alternativo para Supabase directo si n8n falla o para archivos muy grandes.
   * Se mantiene por compatibilidad, pero uploadImage es el preferido.
   */
  async uploadImageToStorage(file, folderPath = 'general') {
      // Redirige a la nueva lógica si se proporciona hotelId de alguna forma, 
      // pero como este método firma antigua no tiene hotelId, mantenemos lógica vieja o lanzamos warning.
      console.warn("[ImageUploadService] Deprecated: uploadImageToStorage llamado. Use uploadImage(file, hotelId) para integración n8n.");
      
      // Fallback a Supabase directo (lógica original)
      const { v4: uuidv4 } = await import('uuid');
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const cleanPath = `${folderPath}/${fileName}`.replace(/\/+/g, '/');

      const { error } = await supabase.storage.from('hotel-media').upload(cleanPath, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('hotel-media').getPublicUrl(cleanPath);
      return data.publicUrl;
  },

  async deleteImage(publicUrl) {
    // La eliminación sigue siendo directa a Supabase o vía n8n si existiera endpoint.
    // Por ahora mantenemos limpieza directa para evitar complejidad en n8n.
    if (!publicUrl) return;
    try {
        const bucketUrl = 'hotel-media/';
        if (publicUrl.includes(bucketUrl)) {
            const path = publicUrl.split(bucketUrl)[1];
            if (path) {
                console.log(`[ImageUploadService] 🗑️ Eliminando de Supabase: ${path}`);
                await supabase.storage.from('hotel-media').remove([path]);
            }
        }
    } catch (e) {
        console.error('Error delete:', e);
    }
  }
};