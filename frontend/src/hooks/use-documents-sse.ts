import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api';
import { QUERY_KEYS } from '../config/query-keys';

type SsePayload = {
  documentId?: string;
  status?: string;
  errorMessage?: string;
};

export function useDocumentsSse(userEmail: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userEmail) return;

    const streamUrl = `${API_BASE_URL}/events/stream?email=${encodeURIComponent(
      userEmail,
    )}`;
    const eventSource = new EventSource(streamUrl);

    const refreshDocuments = () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.documents(userEmail),
      });
    };

    eventSource.addEventListener('connected', refreshDocuments);
    eventSource.addEventListener('document_status', (event) => {
      const message = event as MessageEvent<string>;
      const payload = safeParse(message.data);
      if (payload?.documentId) {
        refreshDocuments();
      }
    });
    eventSource.addEventListener('document_deleted', refreshDocuments);
    eventSource.onerror = () => {
      // Browser will auto-reconnect for SSE
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient, userEmail]);
}

function safeParse(raw: string): SsePayload | null {
  try {
    return JSON.parse(raw) as SsePayload;
  } catch {
    return null;
  }
}
