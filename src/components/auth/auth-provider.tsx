"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type {
  AuthResponse,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  supabase: SupabaseClient | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResponse["data"]>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [{ supabase, setupError }] = useState<{
    supabase: SupabaseClient | null;
    setupError: string | null;
  }>(() => {
    try {
      return {
        supabase: createClient(),
        setupError: null,
      };
    } catch (clientError) {
      return {
        supabase: null,
        setupError:
          clientError instanceof Error
            ? clientError.message
            : "Não foi possível iniciar a autenticação.",
      };
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!setupError);
  const [error, setError] = useState<string | null>(setupError);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const getClient = useCallback(() => {
    if (!supabase) {
      throw new Error(error ?? "Supabase ainda não está pronto.");
    }

    return supabase;
  }, [error, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = getClient();
      const { error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const { data } = await client.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
    },
    [getClient],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const client = getClient();

      try {
        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (signUpError) {
          // Erro retornado pela API do Supabase (ex.: e-mail já cadastrado).
          console.error("[auth] signUp retornou erro da API:", signUpError);
          throw signUpError;
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }

        return data;
      } catch (signUpException) {
        // Erro de rede/transporte (ex.: "Failed to fetch" por URL errada).
        console.error("[auth] signUp falhou (rede/exceção):", signUpException);
        throw signUpException;
      }
    },
    [getClient],
  );

  const signOut = useCallback(async () => {
    const client = getClient();
    const { error: signOutError } = await client.auth.signOut();

    if (signOutError) {
      throw signOutError;
    }

    setSession(null);
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [getClient, router]);

  const value = useMemo(
    () => ({
      user,
      session,
      supabase,
      isLoading,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [error, isLoading, session, signIn, signOut, signUp, supabase, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
