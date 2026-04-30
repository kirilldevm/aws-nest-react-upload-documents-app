import { Button } from './ui/button';
import { useAuth } from '../contexts/auth-context';

export default function Header() {
  const { email, logout } = useAuth();

  return (
    <header className='border-b border-border bg-background'>
      <div className='mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4'>
        <div>
          <p className='text-sm font-medium'>Documents App</p>
          {email ? (
            <p className='text-xs text-muted-foreground'>{email}</p>
          ) : null}
        </div>
        <Button type='button' variant='outline' size='sm' onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

