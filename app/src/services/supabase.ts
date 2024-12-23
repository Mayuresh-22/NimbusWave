import { AuthError, createClient, Session, SupabaseClient, User, WeakPassword } from '@supabase/supabase-js'
import store from '../store/store';
import { setIsAuthenticated, setUser } from '../store/userSlice';

interface MetaData {
  [key: string]: string;
}


class Supabase {
  private supabase: SupabaseClient | null = null;
  authChange: boolean = false;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string
    );
  }

  async getUser(): Promise<User | null> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }
      const { data: { user } } = await this.supabase.auth.getUser()
      return user;
    } catch (error) {
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<{
    user: User;
    session: Session;
    weakPassword?: WeakPassword;
  } | AuthError | null> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        return error;
      }
      store.dispatch(setUser(data?.user));
      store.dispatch(setIsAuthenticated(data?.user !== null));
      return data;
    } catch (error) {
      return null;
    }
  }

  async signUp(email: string, password: string, metaData: MetaData): Promise<{
    user: User | null;
    session: Session | null;
  } | AuthError | null> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metaData
        }
      });
      if (error) {
        return error;
      }
      store.dispatch(setUser(data?.user));
      store.dispatch(setIsAuthenticated(data?.user !== null));
      return data;
    } catch (error) {
      return null;
    }
  }

  async signOut(): Promise<boolean> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        throw error;
      }
      store.dispatch(setUser(null));
      store.dispatch(setIsAuthenticated(false));
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteUser(uid: string): Promise<boolean> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }
      const { error } = await this.supabase.auth.admin.deleteUser(uid);
      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }
      const session = await this.supabase.auth.getSession();
      if (!session) {
        throw new Error("No session found");
      }
      return session.data.session;
    } catch (error) {
      return null;
    }
  }
}

export default new Supabase();