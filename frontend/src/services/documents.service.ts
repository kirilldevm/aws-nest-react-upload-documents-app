import { api } from '../config/api';
import type { DocumentItem, SearchDocumentItem } from '../types/document';
import type {
  CreatePendingDocumentRequest,
  CreatePendingDocumentResponse,
  DocumentPresignResponse,
} from '../types/upload';

export class DocumentsService {
  async getDocuments(userEmail: string) {
    const { data } = await api.get<DocumentItem[]>('/documents', {
      params: { userEmail },
    });
    return data;
  }

  async createPendingDocument(payload: CreatePendingDocumentRequest) {
    const { data } = await api.post<CreatePendingDocumentResponse>(
      '/documents/pending',
      payload,
    );
    return data;
  }

  async getDocumentPresignUrl(documentId: string, userEmail: string) {
    const { data } = await api.post<DocumentPresignResponse>(
      `/documents/${documentId}/presign`,
      {},
      {
        params: { userEmail },
      },
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
