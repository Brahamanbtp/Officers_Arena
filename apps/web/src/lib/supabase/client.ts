// Supabase client helper with zero-dependency typing fallback

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-supabase-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export interface SupabaseClient {
  auth: {
    onAuthStateChange: (callback: (event: any, session: any) => void) => {
      data: { subscription: { unsubscribe: () => void } };
    };
    getUser: () => Promise<{ data: { user: any | null }; error: any }>;
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<{ data: { user: any | null }; error: any }>;
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { user: any | null }; error: any }>;
  };
  from: (table: string) => {
    select: (columns?: string) => any;
    upsert: (values: any[], options?: any) => Promise<{ data: any; error: any }>;
    insert: (values: any[]) => Promise<{ data: any; error: any }>;
    update: (values: any) => any;
  };
}

export const supabase: SupabaseClient = {
  auth: {
    onAuthStateChange: (_callback: (event: any, session: any) => void) => {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },
    getUser: async () => ({ data: { user: null }, error: null }),
    signUp: async ({ email }) => ({ data: { user: { id: `user_${Date.now()}`, email } }, error: null }),
    signInWithPassword: async ({ email }) => ({ data: { user: { id: `user_${Date.now()}`, email } }, error: null })
  },
  from: (_table: string) => {
    const chainable = {
      select: () => chainable,
      eq: () => chainable,
      single: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      insert: async () => ({ data: null, error: null }),
      update: () => chainable
    };
    return chainable;
  }
};
