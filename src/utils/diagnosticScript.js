
import { supabase } from '@/lib/customSupabaseClient';

export const runFullDiagnostics = async () => {
  console.log('🏁 Starting Full System Diagnostics...');
  
  const results = {
    timestamp: new Date().toISOString(),
    envVars: {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      anonKeyConfigured: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
    },
    supabaseConnected: false,
    hotelsCount: 0,
    hotelsData: [],
    knowledgeBaseCount: 0,
    knowledgeBaseData: [],
    errors: []
  };

  try {
    // 1. Check Environment
    console.log('1️⃣ Checking Environment Variables...');
    if (results.envVars.supabaseUrl && results.envVars.anonKeyConfigured) {
      console.log('   ✓ Environment variables present');
    } else {
      console.error('   ✗ Missing environment variables');
      results.errors.push('Missing environment variables');
    }

    // 2. Test Hotels Query
    console.log('2️⃣ Testing Hotels Table Connection...');
    const { count: hotelsCount, error: countError } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('   ✗ Hotels Count Error:', countError);
      results.errors.push(`Hotels Count Error: ${countError.message}`);
    } else {
      console.log(`   ✓ Hotels Table Accessible (Count: ${hotelsCount})`);
      results.hotelsCount = hotelsCount;
    }

    const { data: hotelsData, error: dataError } = await supabase
      .from('hotels')
      .select('id, name, slug, is_active')
      .limit(5);

    if (dataError) {
      console.error('   ✗ Hotels Data Error:', dataError);
      results.errors.push(`Hotels Data Error: ${dataError.message}`);
    } else {
      console.log('   ✓ Hotels Data Sample Retrieved:', hotelsData?.length);
      results.hotelsData = hotelsData;
    }

    // 3. Test Knowledge Base
    console.log('3️⃣ Testing Knowledge Base (kb_documents)...');
    const { count: kbCount, error: kbCountError } = await supabase
      .from('kb_documents')
      .select('*', { count: 'exact', head: true });

    if (kbCountError) {
      console.warn('   ⚠️ Knowledge Base Count Error:', kbCountError);
      results.errors.push(`Knowledge Base Error: ${kbCountError.message}`);
    } else {
      console.log(`   ✓ Knowledge Base Accessible (Count: ${kbCount})`);
      results.knowledgeBaseCount = kbCount;
    }

    const { data: kbData, error: kbDataError } = await supabase
      .from('kb_documents')
      .select('id, content_text')
      .limit(5);
    
    if (!kbDataError) {
       results.knowledgeBaseData = kbData;
    }

    // Conclusion
    if (results.errors.length === 0) {
      results.supabaseConnected = true;
      console.log('✅ DIAGNOSTICS COMPLETE: SYSTEM HEALTHY');
    } else {
      console.log('⚠️ DIAGNOSTICS COMPLETE: ISSUES DETECTED');
    }

  } catch (err) {
    console.error('💥 CRITICAL DIAGNOSTIC FAILURE:', err);
    results.errors.push(`Critical Failure: ${err.message}`);
  }

  return results;
};
