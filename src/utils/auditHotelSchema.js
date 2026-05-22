
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Utility to audit the hotels_master schema and data completeness.
 * Verifies existence of columns and data population.
 */
export const auditHotelSchema = async () => {
  console.log('🔍 Starting Forensic Audit of hotels_master Schema...');
  
  const CRITICAL_COLUMNS = [
    'id', 'name', 'slug', 'description', 'long_description', 
    'address', 'phone', 'email', 'latitude', 'longitude', 
    'video_id', 'about_image', 'gallery_data', 'rooms_data', 
    'services_data', 'restaurants_data', 'page_structure', 
    'highlights', 'amenities', 'rating', 'publish', 'status', 
    'created_at', 'updated_at'
  ];

  try {
    // 1. Fetch one row to check keys (columns)
    const { data: sampleData, error: sampleError } = await supabase
      .from('hotels_master')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ CRITICAL: Could not fetch hotels_master.', sampleError);
      return { success: false, error: sampleError };
    }

    if (!sampleData || sampleData.length === 0) {
      console.warn('⚠️ Table is empty. Cannot verify columns dynamically via SELECT.');
    } else {
      const availableColumns = Object.keys(sampleData[0]);
      console.group('Column Existence Check');
      CRITICAL_COLUMNS.forEach(col => {
        if (availableColumns.includes(col)) {
          console.log(`✅ Column exists: ${col}`);
        } else {
          console.error(`❌ MISSING Column: ${col}`);
        }
      });
      console.groupEnd();
    }

    // 2. Fetch ALL data to check population
    const { data: allHotels, error: listError } = await supabase
      .from('hotels_master')
      .select('*');

    if (listError) throw listError;

    const report = allHotels.map(hotel => {
      const hotelReport = {
        id: hotel.id,
        name: hotel.name,
        missingFields: [],
        emptyFields: [],
        invalidJSON: []
      };

      CRITICAL_COLUMNS.forEach(col => {
        const val = hotel[col];
        
        // Check missing/empty
        if (val === undefined) {
          hotelReport.missingFields.push(col);
        } else if (val === null || val === '') {
          hotelReport.emptyFields.push(col);
        } else if (Array.isArray(val) && val.length === 0) {
           // Empty arrays are technically "empty" data but might be valid state
           hotelReport.emptyFields.push(col);
        }

        // Validate JSONB
        if (['gallery_data', 'rooms_data', 'services_data', 'restaurants_data', 'page_structure'].includes(col)) {
           if (val && typeof val !== 'object') {
               hotelReport.invalidJSON.push(col);
           }
        }
      });

      return hotelReport;
    });

    console.group('Data Population Report');
    console.table(report.map(r => ({
        Hotel: r.name,
        'Missing Cols': r.missingFields.length,
        'Empty Values': r.emptyFields.length,
        'Invalid JSON': r.invalidJSON.length
    })));
    console.groupEnd();

    return { success: true, report };

  } catch (err) {
    console.error('Audit failed:', err);
    return { success: false, error: err };
  }
};
