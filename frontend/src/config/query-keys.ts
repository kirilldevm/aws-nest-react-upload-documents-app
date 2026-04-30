export const QUERY_KEYS = {
  documents: (userEmail: string) => ['documents', userEmail] as const,
  searchDocuments: (userEmail: string, query: string) =>
    ['documents-search', userEmail, query] as const,
};

