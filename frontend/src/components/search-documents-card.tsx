import type { SearchDocumentItem } from '../types/document';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

type SearchDocumentsCardProps = {
  searchInput: string;
  submittedSearch: string;
  isLoading: boolean;
  isError: boolean;
  results: SearchDocumentItem[] | undefined;
  onSearchInputChange: (value: string) => void;
  onSubmit: React.ComponentProps<'form'>['onSubmit'];
};

export default function SearchDocumentsCard({
  searchInput,
  submittedSearch,
  isLoading,
  isError,
  results,
  onSearchInputChange,
  onSubmit,
}: SearchDocumentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search documents</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className='space-y-2'>
          <Input
            type='text'
            placeholder='Search with typo tolerance...'
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.currentTarget.value)}
          />
          <Button type='submit' variant='outline'>
            Search
          </Button>
        </form>

        {isLoading ? <p className='mt-3'>Searching...</p> : null}
        {isError ? (
          <p className='mt-3 text-destructive'>Search failed</p>
        ) : null}
        {submittedSearch && !isLoading && !isError && !results?.length ? (
          <p className='mt-3 text-muted-foreground'>No matches found.</p>
        ) : null}

        {results?.length ? (
          <ul className='mt-3 space-y-2'>
            {results.map((item) => (
              <li key={item.documentId} className='border border-border p-2'>
                <p className='font-medium'>
                  {item.filename ?? item.documentId}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Status: {item.status ?? 'unknown'}
                </p>
                {item.highlights.length ? (
                  <div className='mt-1 space-y-1'>
                    {item.highlights.map((snippet, index) => (
                      <p
                        key={`${item.documentId}-${index}`}
                        className='text-xs text-muted-foreground'
                        dangerouslySetInnerHTML={{ __html: snippet }}
                      />
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
