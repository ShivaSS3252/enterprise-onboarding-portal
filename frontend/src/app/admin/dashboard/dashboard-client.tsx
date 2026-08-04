'use client';

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTasks, getAllUsers, createTask, deleteTask, ApiError } from '@/lib/api';

export function DashboardClient({ adminEmail }: { adminEmail: string }) {
  const queryClient = useQueryClient();

  // Same queryKey + queryFn as the server prefetch in page.tsx — TanStack Query
  // matches this up against the hydrated cache, so this renders instantly with
  // the server-fetched data instead of showing a loading state on first paint.
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: () => getAllTasks() });
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => getAllUsers() });

  const [title, setTitle] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      // Invalidate rather than manually splicing the new task into local state —
      // lets TanStack Query re-fetch the authoritative list from the server.
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTitle('');
      setAssignedToId('');
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create task');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  function handleCreateTask(event: FormEvent) {
    event.preventDefault();
    if (!assignedToId) {
      setFormError('Select an employee to assign this task to');
      return;
    }
    createMutation.mutate({ title, assignedToId });
  }

  const employees = (usersQuery.data ?? []).filter((u) => u.role === 'EMPLOYEE');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-sm text-zinc-500">Logged in as {adminEmail}</p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Create onboarding task</h2>
        <form onSubmit={handleCreateTask} className="flex flex-col gap-3 sm:flex-row">
          <input
            required
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <select
            required
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Assign to...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create task'}
          </button>
        </form>
        {formError && <p className="text-sm text-red-700">{formError}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">All onboarding tasks</h2>
        {tasksQuery.isLoading && <p className="text-sm text-zinc-500">Loading...</p>}
        {tasksQuery.isError && <p className="text-sm text-red-700">Failed to load tasks</p>}
        <ul className="flex flex-col gap-2">
          {tasksQuery.data?.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-zinc-500">
                  Assigned to {task.assignedTo.firstName} {task.assignedTo.lastName} ·{' '}
                  <span className={task.status === 'COMPLETED' ? 'text-green-700' : 'text-amber-700'}>
                    {task.status}
                  </span>
                </p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(task.id)}
                disabled={deleteMutation.isPending}
                className="text-red-700 underline disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          ))}
          {tasksQuery.data?.length === 0 && (
            <p className="text-sm text-zinc-500">No tasks created yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
