import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import type { Bindings } from "..";

/**
 * Supabase service
 * @param {Context<{ Bindings: Bindings; Variables: any }> c - Context} c - Context
 * @returns {Supabase} Supabase service instance
 */
class Supabase {
  private supabase: SupabaseClient | null = null;

  constructor(c: Context<{ Bindings: Bindings; Variables: any }>) {
    this.supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  }

  /**
   * Get user from token
   * @param {string} token - User token
   * @returns {Promise<User | null>} User details
   */
  async getUser(token: string): Promise<User | null> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized");
      }
      const {
        data: { user },
      } = await this.supabase.auth.getUser(token);
      return user;
    } catch (error) {
      return null;
    }
  }
}

export default Supabase;
