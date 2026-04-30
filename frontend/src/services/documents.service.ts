import { api } from '../config/api';
import type { DocumentItem, SearchDocumentItem } from '../types/document';
import type {
  CreateUploadPresignRequest,
  CreateUploadPresignResponse,
} from '../types/upload';

export class DocumentsService {
  async getDocuments(userEmail: string) {
    const { data } = await api.get<DocumentItem[]>('/documents', {
      params: { userEmail },
    });
    return data;
  }

  async createUploadPresign(payload: CreateUploadPresignRequest) {
    const { data } = await api.post<CreateUploadPresignResponse>(
      '/uploads/presign',
      payload,
    );
    return data;
  }

  async deleteDocument(documentId: string, userEmail: string) {
    const { data } = await api.delete<{ ok: boolean }>(
      `/documents/${documentId}`,
      {
        params: { userEmail },
      },
    );
    return data;
  }

  async searchDocuments(userEmail: string, query: string) {
    const { data } = await api.get<SearchDocumentItem[]>('/documents/search', {
      params: { userEmail, q: query },
    });
    return data;
  }
}

export const documentsService = new DocumentsService();

