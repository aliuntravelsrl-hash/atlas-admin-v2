import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const imageUploadService = {
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
  }
};

async function testFullUploadFlow() {
  const hotelId = '9e9d5002-cb26-44f9-9fbe-bead2c40faef'; // Serenade All Suites
  console.log(`Iniciando flujo de prueba para hotel ${hotelId}...`);

  try {
    // 1. Fetch hotelData
    const { data: hotelData, error: fetchError } = await supabase
      .from('hotels_master')
      .select('gallery_data, slug, about_image')
      .eq('id', hotelId)
      .single();

    if (fetchError) throw new Error(`Hotel no encontrado: ${fetchError.message}`);
    console.log("Hotel recuperado:", hotelData.slug);

    const currentGallery = Array.isArray(hotelData.gallery_data)
      ? hotelData.gallery_data : [];

    // Buffer de imagen JPEG ficticio mínimo
    const testImageBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
      0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0xff, 0xd9
    ]);

    const fakeFile = testImageBuffer;
    fakeFile.name = 'test_image.jpg';
    fakeFile.size = testImageBuffer.length;
    fakeFile.type = 'image/jpeg';

    // 3. Subir imagen
    console.log("Subiendo imagen de prueba a storage...");
    const url = await imageUploadService.uploadImage(fakeFile, hotelId, 'gallery');
    console.log("Imagen subida con éxito. URL:", url);

    const newEntries = [{
      url,
      scope: 'gallery',
      sort_order: currentGallery.length,
      title: `Galería ${currentGallery.length + 1}: ${hotelData.slug}`,
    }];

    // 4. Actualizar tabla hotels_master
    const updatedGallery = [...currentGallery, ...newEntries];
    const noAboutImage   = !hotelData.about_image || hotelData.about_image === '';

    console.log("Actualizando hotels_master con la nueva galería...");
    const { error: updateError } = await supabase
      .from('hotels_master')
      .update({
        gallery_data: updatedGallery,
        ...(noAboutImage ? { about_image: newEntries[0].url } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', hotelId)
      .select();

    if (updateError) throw new Error(`Error guardando en BD: ${updateError.message}`);

    console.log("✅ FLUJO COMPLETO EXITOSO. Galería actualizada.");
  } catch (err) {
    console.error("❌ ERROR EN EL FLUJO:", err.message, err);
  }
}

testFullUploadFlow();
