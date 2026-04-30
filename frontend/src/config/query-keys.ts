export const QUERY_KEYS = {
  documents: (userEmail: string) => ['documents', userEmail] as const,
};

