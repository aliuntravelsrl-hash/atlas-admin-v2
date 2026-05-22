
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { ErrorHandler } from '@/utils/ErrorHandler';

export const useKnowledgeBase = (query = '') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchKnowledgeBase = async () => {
      setLoading(true);
      setError(null);

      try {
        const sanitizedQuery = typeof query === 'string' ? query.trim() : '';
        
        // Query the correct table 'kb_documents' instead of 'knowledge_base'
        let queryBuilder = supabase
          .from('kb_documents')
          .select('id, content_text, content_json, entity_key, entity_type, updated_at, region_tag');

        // If there is a search query, use ilike for text search on content_text
        if (sanitizedQuery) {
          queryBuilder = queryBuilder.ilike('content_text', `%${sanitizedQuery}%`);
        }

        // Limit results to prevent over-fetching
        const { data: results, error: fetchError } = await queryBuilder
          .limit(10)
          .order('updated_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (isMounted) {
          // Map results to maintain compatibility with components expecting 'content' and 'metadata'
          const mappedResults = results ? results.map(item => ({
              id: item.id,
              content: item.content_text, // Map content_text to content for UI compatibility
              metadata: item.content_json, // Map content_json to metadata for UI compatibility
              entity_key: item.entity_key,
              entity_type: item.entity_type,
              updated_at: item.updated_at,
              region_tag: item.region_tag
          })) : [];
          setData(mappedResults);
        }
      } catch (err) {
        // Log error centrally
        ErrorHandler.captureError(err, {
          component: 'useKnowledgeBase',
          action: 'fetch',
          metadata: { query }
        });

        if (isMounted) {
          console.error('Error fetching knowledge base:', err);
          setError(err.message || 'Failed to fetch knowledge base data');
          // Return empty array on error to prevent UI crashes
          setData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchKnowledgeBase();

    return () => {
      isMounted = false;
    };
  }, [query]);

  return { data, loading, error };
};
