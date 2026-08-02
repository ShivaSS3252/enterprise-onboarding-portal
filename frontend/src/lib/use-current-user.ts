import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe, ApiError } from './api';
import { getToken } from './auth';
import { useAppDispatch } from '@/store/hooks';
import { setUser, clearUser } from '@/store/slices/auth-slice';

// TanStack Query owns the server round-trip (loading/error/caching/refetch);
// Redux owns the resulting "who is the current user" client state that the
// rest of the app (e.g. a Navbar) reads synchronously via useSelector.
export function useCurrentUser() {
  const dispatch = useAppDispatch();

  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: getMe,
    enabled: !!getToken(), // don't even attempt the request with no token stored
    retry: false, // a 401 here means "not logged in", not "transient failure" — retrying is pointless
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setUser(query.data));
    } else if (query.isError) {
      dispatch(clearUser());
    }
  }, [query.data, query.isError, dispatch]);

  return query;
}

export { ApiError };
