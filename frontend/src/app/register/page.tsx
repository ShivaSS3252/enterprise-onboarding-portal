'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, ApiError } from '@/lib/api';
import { saveToken } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Registration always creates an EMPLOYEE account (enforced server-side,
      // see backend AuthService.register) — there is no role field here at all.
      const { accessToken } = await register(form);
      saveToken(accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold">Register</h1>

        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <label className="flex flex-col gap-1 text-sm">
          First name
          <input
            required
            value={form.firstName}
            onChange={updateField('firstName')}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Last name
          <input
            required
            value={form.lastName}
            onChange={updateField('lastName')}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={updateField('email')}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={updateField('password')}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-zinc-900 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
