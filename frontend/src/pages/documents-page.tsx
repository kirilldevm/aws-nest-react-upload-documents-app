import { useMemo, useState } from 'react';
import DocumentsListCard from '../components/documents-list-card';
import SearchDocumentsCard from '../components/search-documents-card';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../components/ui/field';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/auth-context';
import { useDeleteDocumentMutation } from '../hooks/use-delete-document-mutation';
import { useDocumentsQuery } from '../hooks/use-documents-query';
import { useDocumentsSse } from '../hooks/use-documents-sse';
import { useSearchDocumentsQuery } from '../hooks/use-search-documents-query';
import { useUploadDocumentMutation } from '../hooks/use-upload-document-mutation';

export default function DocumentsPage() {
  const { email } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const documentsQuery = useDocumentsQuery(email);
  const searchQuery = useSearchDocumentsQuery(
    email,
    submittedSearch,
    Boolean(submittedSearch),
  );
  useDocumentsSse(email);
  const uploadMutation = useUploadDocumentMutation(email);
  const deleteMutation = useDeleteDocumentMutation(email);

  const canUpload = useMemo(
    () => Boolean(selectedFile) && !uploadMutation.isPending,
    [selectedFile, uploadMutation.isPending],
  );

  const handleSubmit: React.ComponentProps<'form'>['onSubmit'] = async (
    event,
  ) => {
    event.preventDefault();
    setFormError('');

    if (!email) return;
    if (!selectedFile) {
      setFormError('Choose a file first');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        userEmail: email,
        file: selectedFile,
      });
      setSelectedFile(null);
      const input = document.getElementById(
        'upload-file',
      ) as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload document';
      setFormError(message);
    }
  };

  const onDelete = async (documentId: string) => {
    if (!email) return;
    await deleteMutation.mutateAsync(documentId);
  };

  const onSearchSubmit: React.ComponentProps<'form'>['onSubmit'] = (event) => {
    event.preventDefault();
    setSubmittedSearch(searchInput.trim());
  };

  return (
    <main className='mx-auto w-full max-w-5xl px-4 py-6'>
      <div className='grid gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Upload document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                <Field data-invalid={Boolean(formError)}>
                  <FieldLabel htmlFor='upload-file'>File</FieldLabel>
                  <Input
                    id='upload-file'
                    type='file'
                    accept='.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    onChange={(event) =>
                      setSelectedFile(event.currentTarget.files?.[0] ?? null)
                    }
                  />
                  <FieldDescription>
                    Allowed: .pdf, .docx. Max file size: 10MB.
                  </FieldDescription>
                  <FieldError
                    errors={formError ? [{ message: formError }] : undefined}
                  />
                </Field>
                <Button type='submit' disabled={!canUpload}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <SearchDocumentsCard
          searchInput={searchInput}
          submittedSearch={submittedSearch}
          isLoading={searchQuery.isLoading}
          isError={searchQuery.isError}
          results={searchQuery.data}
          onSearchInputChange={setSearchInput}
          onSubmit={onSearchSubmit}
        />

        <DocumentsListCard
          documents={documentsQuery.data}
          isLoading={documentsQuery.isLoading}
          isError={documentsQuery.isError}
          isDeletePending={deleteMutation.isPending}
          onDelete={onDelete}
        />
      </div>
    </main>
  );
}
