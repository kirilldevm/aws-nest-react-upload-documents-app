import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { loginSchema, type LoginSchemaValues } from '../schemas/auth/login.schema';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();

  const form = useForm<LoginSchemaValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to='/documents' replace />;
  }

  const onSubmit = (values: LoginSchemaValues) => {
    login(values.email.trim().toLowerCase());
  };

  return (
    <main className='mx-auto mt-16 w-full max-w-md px-4'>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your email to continue to your documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  id='email'
                  type='email'
                  placeholder='you@example.com'
                  autoComplete='email'
                  aria-invalid={!!form.formState.errors.email}
                  {...form.register('email')}
                />
                <FieldDescription>
                  We store it in localStorage for auth emulation.
                </FieldDescription>
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                Continue
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
