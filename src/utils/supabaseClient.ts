import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mipvojdhiyhziavuetgh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcHZvamRoaXloemlhdnVldGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzQwMDMsImV4cCI6MjA3MjYxMDAwM30.allQY9QR807_iNMvkNSPesZn2GD9By9MKuE5t7XCUa8';

export const supabase = createClient(supabaseUrl, supabaseKey);