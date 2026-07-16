import { useEffect, useState } from 'react';
import { barbersApi } from '@/api';
import { decorateBarber, type DecoratedBarber } from '@/lib/demo';

interface State {
  barbers: DecoratedBarber[];
  loading: boolean;
  error: string | null;
}

export function useActiveBarbers(): State {
  const [state, setState] = useState<State>({ barbers: [], loading: true, error: null });

  useEffect(() => {
    let active = true;
    barbersApi
      .listActive()
      .then((list) => {
        if (active) setState({ barbers: list.map(decorateBarber), loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (active) {
          const error = e instanceof Error ? e.message : 'خطا در دریافت آرایشگران';
          setState({ barbers: [], loading: false, error });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
