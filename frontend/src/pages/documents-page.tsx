import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { useUploadDocumentMutation } from '../hooks/use-upload-document-mutation';

export default function DocumentsPage() {
  const { email } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const documentsQuery = useDocumentsQuery(email);
  useDocumentsSse(email);
  const uploadMutation = useUploadDocumentMutation(email);
  const deleteMutation = useDeleteDocumentMutation(email);

  const canUpload = useMemo(
    () => Boolean(selectedFile) && !uploadMutation.isPending,
    [selectedFile, uploadMutation.isPending],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!email) return;
    if (!selectedFile) {
      setFormError('Choose a file first');
      return;
    }

    try {
      await uploadMutation.mutateAsync({ userEmail: email, file: selectedFile });
      setSelectedFile(null);
      const input = document.getElementById('upload-file') as HTMLInputElement | null;
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
                  <FieldError errors={formError ? [{ message: formError }] : undefined} />
                </Field>
                <Button type='submit' disabled={!canUpload}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documentsQuery.isLoading ? <p>Loading...</p> : null}
            {documentsQuery.isError ? (
              <p className='text-destructive'>Failed to load documents</p>
            ) : null}
            {!documentsQuery.isLoading &&
            !documentsQuery.isError &&
            !documentsQuery.data?.length ? (
              <p className='text-muted-foreground'>No documents yet.</p>
            ) : null}

            {documentsQuery.data?.length ? (
              <ul className='space-y-2'>
                {documentsQuery.data.map((doc) => (
                  <li
                    key={doc.id}
                    className='flex items-center justify-between border border-border p-2'
                  >
                    <div>
                      <p className='font-medium'>{doc.userFilename}</p>
                      <p className='text-xs text-muted-foreground'>
                        Status: {doc.status}
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      disabled={deleteMutation.isPending}
                      onClick={() => onDelete(doc.id)}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
