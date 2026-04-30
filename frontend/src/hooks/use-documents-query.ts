import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../config/query-keys';
import { documentsService } from '../services/documents.service';

export function useDocumentsQuery(userEmail: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.documents(userEmail ?? ''),
    queryFn: () => documentsService.getDocuments(userEmail as string),
    enabled: Boolean(userEmail),
  });
}

