import { useAuth } from '../contexts/auth-context';

export default function DocumentsPage() {
  const { email, logout } = useAuth();

  return (
    <main>
      <h1>Documents</h1>
      <p>Signed in as: {email}</p>
      <p>Upload/list/search UI will be added next.</p>
      <button type='button' onClick={logout}>
        Logout
      </button>
    </main>
  );
}
