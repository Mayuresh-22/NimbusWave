import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import { Context } from 'hono';
import { Bindings } from '..';

class Supabase {
  private supabase: SupabaseClient | null = null;

  constructor(c: Context<{ Bindings: Bindings }>) {
    this.supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_ANON_KEY
    );
  }

  async getUser(token: string): Promise<User | null> {
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
}

export default Supabase;