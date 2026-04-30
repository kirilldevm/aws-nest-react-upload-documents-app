import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../config/query-keys';
import { documentsService } from '../services/documents.service';

export function useSearchDocumentsQuery(
  userEmail: string | null,
  query: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: QUERY_KEYS.searchDocuments(userEmail ?? '', query),
    queryFn: () => documentsService.searchDocuments(userEmail as string, query),
    enabled: Boolean(userEmail) && enabled && query.trim().length > 0,
  });
}

