import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../config/query-keys';
import { documentsService } from '../services/documents.service';

export function useDeleteDocumentMutation(userEmail: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      if (!userEmail) {
        throw new Error('userEmail is required');
      }
      return documentsService.deleteDocument(documentId, userEmail);
    },
    onSuccess: async () => {
      if (!userEmail) return;
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.documents(userEmail),
      });
    },
  });
}

