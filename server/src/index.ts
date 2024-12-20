import { Hono } from 'hono'
import APIEndpoint from './api';
import AuthMiddleware from './middlewares/auth';

export interface Bindings extends CloudflareBindings {
  GROQ_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", AuthMiddleware);

app.route('/', APIEndpoint);

export default app