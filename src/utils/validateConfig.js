import { supabase } from '@/lib/customSupabaseClient';

export const validateConfiguration = async () => {
  const report = {
    env: {},
    connection: {},
    errors: []
  };

  console.group("🔍 Configuration Validation Diagnosis");

  // 1. Check Environment Variables
  const n8nUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  report.env.VITE_N8N_WEBHOOK_URL = n8nUrl ? "✅ Present" : "❌ Missing";
  report.env.VITE_SUPABASE_URL = supabaseUrl ? "✅ Present" : "❌ Missing";
  report.env.VITE_SUPABASE_ANON_KEY = supabaseKey ? "✅ Present" : "❌ Missing";

  console.log("Environment Variables:", report.env);

  if (!n8nUrl) report.errors.push("Missing VITE_N8N_WEBHOOK_URL");
  if (!supabaseUrl) report.errors.push("Missing VITE_SUPABASE_URL");
  if (!supabaseKey) report.errors.push("Missing VITE_SUPABASE_ANON_KEY");

  // 2. Validate N8N URL Format
  if (n8nUrl) {
    try {
      new URL(n8nUrl);
      console.log("✅ N8N URL is a valid URL format.");
    } catch (e) {
      console.error("❌ N8N URL is malformed:", n8nUrl);
      report.errors.push("Malformed VITE_N8N_WEBHOOK_URL");
    }
  }

  // 3. Test Supabase Connection (General)
  try {
    const { error } = await supabase.from('hotels').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log("✅ Supabase Connection Successful (Hotels table accessible)");
    report.connection.supabase = "Connected";
  } catch (error) {
    console.error("❌ Supabase Connection Failed:", error.message);
    report.connection.supabase = `Failed: ${error.message}`;
    report.errors.push(`Supabase Error: ${error.message}`);
  }

  // 4. Test Knowledge Base Access (RLS Check)
  try {
    const { error } = await supabase.from('knowledge_base').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn("⚠️ Knowledge Base table not accessible or missing RLS policy:", error.message);
      report.connection.knowledgeBase = `Error: ${error.message}`;
      report.errors.push(`Knowledge Base Error: ${error.message}`);
    } else {
      console.log("✅ Knowledge Base table is accessible");
      report.connection.knowledgeBase = "Accessible";
    }
  } catch (error) {
    console.error("❌ Knowledge Base Check Failed:", error);
  }

  console.groupEnd();
  return report;
};