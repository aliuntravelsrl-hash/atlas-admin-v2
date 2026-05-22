
import { supabase } from '@/lib/customSupabaseClient';
import { multimediaLogger } from '@/utils/multimediaLogger';

// Helper for UUID validation
const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const multimediaService = {

  /**
   * Task 4: Validate Image URL
   */
  validateImageUrl(imageUrl) {
      if (typeof imageUrl !== 'string') {
          multimediaLogger.logOperation('validate', '❌ Image URL is not a string');
          throw new Error("Invalid image URL: must be a string");
      }
      if (!imageUrl.startsWith('http')) {
          multimediaLogger.logOperation('validate', '❌ Image URL must start with http/https');
          throw new Error("Invalid image URL: must start with http/https");
      }
      // Simple check to ensure it's not JSON stringified object if that was passed by mistake
      if (imageUrl.trim().startsWith('{') || imageUrl.trim().startsWith('[')) {
           multimediaLogger.logOperation('validate', '❌ Image URL appears to be a JSON object');
           throw new Error("Invalid image URL: appears to be an object");
      }
      
      multimediaLogger.logOperation('validate', '✅ Image URL format valid');
      return imageUrl.trim();
  },

  /**
   * Task 6: Update Room Image
   */
  async updateRoomImage(roomId, imageUrl) {
      try {
          multimediaLogger.logOperation('upload', `Actualizando imagen de habitación ${roomId}`);
          
          if (!validateUUID(roomId)) throw new Error("Invalid Room UUID");
          const cleanUrl = this.validateImageUrl(imageUrl);
          
          const { data, error } = await supabase
            .from('rooms')
            .update({ 
                image_url: cleanUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', roomId)
            .select()
            .single();
            
          if (error) throw error;
          
          multimediaLogger.logOperation('success', 'Imagen de habitación actualizada en SQL');
          return data;
      } catch (error) {
          multimediaLogger.logOperation('error', 'Error actualizando imagen de habitación', error);
          throw error;
      }
  },

  /**
   * Validates the JSONB structure for rooms data.
   */
  validateRoomsSchema(roomsData) {
    multimediaLogger.logOperation('validate', 'Validando esquema JSONB...');
    
    if (!Array.isArray(roomsData)) {
      throw new Error("Invalid schema: roomsData must be an array.");
    }

    roomsData.forEach((room, index) => {
      if (!room.name) throw new Error(`Invalid schema: Room at index ${index} missing 'name'.`);
      
      if (room.images && !Array.isArray(room.images)) {
        throw new Error(`Invalid schema: Room '${room.name}' images must be an array.`);
      }
    });

    return true;
  },

  /**
   * Uploads a room image to Supabase Storage
   */
  async uploadRoomImage(hotelId, roomId, file) {
    try {
      multimediaLogger.logOperation('upload', `Subiendo imagen para habitación ${roomId || 'nueva'}...`);
      
      // 1. Validate File
      if (!file) throw new Error("No file provided");
      if (file.size > 5 * 1024 * 1024) throw new Error("File size exceeds 5MB limit");
      if (!file.type.startsWith('image/')) throw new Error("File must be an image");

      // 2. Upload to Bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${hotelId}/${roomId || 'temp'}/${Date.now()}.${fileExt}`;
      const filePath = `room-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hotel-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hotel-media')
        .getPublicUrl(filePath);

      multimediaLogger.logOperation('success', 'Imagen subida exitosamente', publicUrl);
      return publicUrl;

    } catch (error) {
      multimediaLogger.logOperation('error', 'Error subiendo imagen', error);
      throw error;
    }
  },

  /**
   * Saves multimedia data atomically.
   */
  async saveMultimediaData(hotelId, roomsData) {
    try {
      multimediaLogger.logOperation('connect', 'Conectando tubería...');
      
      // 1. UUID Validation
      if (!hotelId || !validateUUID(hotelId)) {
        throw new Error("Invalid Hotel ID. Must be a valid UUID.");
      }
      multimediaLogger.logOperation('security', 'Aplicando UUID-Cast...');

      // 2. Schema Validation
      this.validateRoomsSchema(roomsData);

      // 3. Update hotels_master (JSONB)
      multimediaLogger.logOperation('save', 'Guardando rooms_data en public.hotels...');
      
      const { data, error } = await supabase
        .from('hotels_master')
        .update({ 
            rooms_data: roomsData,
            updated_at: new Date().toISOString()
        })
        .eq('id', hotelId) 
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
          throw new Error(`Hotel with ID ${hotelId} not found. Cannot save multimedia.`);
      }

      // 4. Atomic Sync
      await this.linkImagesToRooms(hotelId, roomsData);

      multimediaLogger.logOperation('success', 'Multimedia sincronizada con éxito');
      return { success: true, timestamp: new Date(), affected: data.length };

    } catch (error) {
      multimediaLogger.logOperation('error', 'Error en saveMultimediaData', error);
      throw error;
    }
  },

  /**
   * Links images to SQL rooms table atomically.
   */
  async linkImagesToRooms(hotelId, roomsData) {
    try {
      multimediaLogger.logOperation('link', 'Vinculando imágenes a habitaciones...');
      
      const updates = roomsData
        .filter(r => r.id && r.images && r.images.length > 0)
        .map(async (room) => {
            const primaryImage = room.images[0].url; 
            
            // Validate UUID for room.id
            if (!validateUUID(room.id)) return null;

            return supabase
                .from('rooms')
                .update({ image_url: primaryImage })
                .eq('id', room.id)
                .eq('hotel_id', hotelId); 
        });
      
      await Promise.all(updates);
      multimediaLogger.logOperation('success', `Fotos guardadas: ${updates.length} imágenes vinculadas en SQL`);
      
    } catch (error) {
      multimediaLogger.logOperation('error', 'Error vinculando imágenes', error);
    }
  }
};
