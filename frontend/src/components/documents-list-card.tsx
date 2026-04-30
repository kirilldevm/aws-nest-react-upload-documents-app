import type { DocumentItem } from '../types/document';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type DocumentsListCardProps = {
  documents: DocumentItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isDeletePending: boolean;
  onDelete: (documentId: string) => void | Promise<void>;
};

export default function DocumentsListCard({
  documents,
  isLoading,
  isError,
  isDeletePending,
  onDelete,
}: DocumentsListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your documents</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <p>Loading...</p> : null}
        {isError ? (
          <p className='text-destructive'>Failed to load documents</p>
        ) : null}
        {!isLoading && !isError && !documents?.length ? (
          <p className='text-muted-foreground'>No documents yet.</p>
        ) : null}

        {documents?.length ? (
          <ul className='space-y-2'>
            {documents.map((doc) => (
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
                  disabled={isDeletePending}
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
  );
}
