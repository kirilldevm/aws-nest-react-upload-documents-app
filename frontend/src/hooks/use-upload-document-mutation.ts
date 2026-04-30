import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../config/query-keys';
import { documentsService } from '../services/documents.service';

type UploadInput = {
  userEmail: string;
  file: File;
};

export function useUploadDocumentMutation(userEmail: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userEmail: email, file }: UploadInput) => {
      const presign = await documentsService.createUploadPresign({
        userEmail: email,
        originalFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });

      const uploadResponse = await fetch(presign.presignedUrl, {
        method: 'PUT',
        headers: presign.headers,
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      return presign;
    },
    onSuccess: async () => {
      if (!userEmail) return;
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.documents(userEmail),
      });
    },
  });
}

