'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyTasks,
  getMyDocuments,
  completeTask,
  uploadDocument,
  deleteDocument,
  ApiError,
} from '@/lib/api';

function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function DashboardClient({ employeeEmail }: { employeeEmail: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tasksQuery = useQuery({ queryKey: ['myTasks'], queryFn: () => getMyTasks() });
  const documentsQuery = useQuery({ queryKey: ['myDocuments'], queryFn: () => getMyDocuments() });

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myTasks'] }),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, taskId }: { file: File; taskId?: string }) => uploadDocument(file, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] });
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err) => {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed');
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myDocuments'] }),
  });

  function handleUpload(event: FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError('Choose a file first');
      return;
    }
    uploadMutation.mutate({ file, taskId: selectedTaskId || undefined });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">My Onboarding</h1>
      <p className="text-sm text-zinc-500">Logged in as {employeeEmail}</p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">My tasks</h2>
        {tasksQuery.isLoading && <p className="text-sm text-zinc-500">Loading...</p>}
        <ul className="flex flex-col gap-2">
          {tasksQuery.data?.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{task.title}</p>
                {task.description && <p className="text-zinc-500">{task.description}</p>}
                <span
                  className={task.status === 'COMPLETED' ? 'text-green-700' : 'text-amber-700'}
                >
                  {task.status}
                </span>
              </div>
              {task.status === 'PENDING' && (
                <button
                  onClick={() => completeMutation.mutate(task.id)}
                  disabled={completeMutation.isPending}
                  className="rounded bg-zinc-900 px-3 py-1.5 text-white disabled:opacity-50"
                >
                  Mark complete
                </button>
              )}
            </li>
          ))}
          {tasksQuery.data?.length === 0 && (
            <p className="text-sm text-zinc-500">No tasks assigned yet.</p>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Upload a document</h2>
        <form onSubmit={handleUpload} className="flex flex-col gap-3 sm:flex-row">
          <input
            ref={fileInputRef}
            type="file"
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">(not linked to a task)</option>
            {tasksQuery.data?.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {uploadError && <p className="text-sm text-red-700">{uploadError}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">My documents</h2>
        <ul className="flex flex-col gap-2">
          {documentsQuery.data?.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm"
            >
              <span>
                {doc.fileName} <span className="text-zinc-400">({formatBytes(doc.sizeBytes)})</span>
              </span>
              <button
                onClick={() => deleteDocMutation.mutate(doc.id)}
                disabled={deleteDocMutation.isPending}
                className="text-red-700 underline disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          ))}
          {documentsQuery.data?.length === 0 && (
            <p className="text-sm text-zinc-500">No documents uploaded yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
