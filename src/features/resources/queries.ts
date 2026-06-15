import { supabase } from '@/lib/supabase';
import { PAGE_SIZE, type Resource, type ResourceFilters } from './types';

/**
 * Resource reads — the RN analogue of `/api/library` and `/api/resources` (§15).
 * Both views hit the same `resources` table; they differ only in scope:
 *   - Library: `author_id = me` (private + shared), with a visibility filter.
 *   - Public:  `is_shared_public = true` AND the 2-rating quality gate
 *              (`rating_count >= 2`) before a resource appears in public search.
 * Filters/sort/pagination mirror the API routes' query logic.
 */

type RawResource = {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  resource_type: Resource['resourceType'];
  board: string[] | null;
  grade: number[] | null;
  subject: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  download_count: number | null;
  is_pro_only: boolean | null;
  is_shared_public: boolean | null;
  is_ai_generated: boolean | null;
  created_at: string;
};

function mapResource(r: RawResource): Resource {
  return {
    id: r.id,
    authorId: r.author_id,
    title: r.title,
    description: r.description,
    resourceType: r.resource_type,
    board: r.board ?? [],
    grade: r.grade ?? [],
    subject: r.subject,
    ratingAvg: r.rating_avg ?? 0,
    ratingCount: r.rating_count ?? 0,
    downloadCount: r.download_count ?? 0,
    isProOnly: r.is_pro_only ?? false,
    isSharedPublic: r.is_shared_public ?? false,
    isAiGenerated: r.is_ai_generated ?? false,
    createdAt: r.created_at,
  };
}

const SELECT =
  'id, author_id, title, description, resource_type, board, grade, subject, rating_avg, rating_count, download_count, is_pro_only, is_shared_public, is_ai_generated, created_at';

export interface ResourcePageParams {
  mode: 'library' | 'public';
  userId: string;
  filters: ResourceFilters;
  page: number; // 0-based
}

export async function fetchResourcePage({ mode, userId, filters, page }: ResourcePageParams): Promise<Resource[]> {
  let query = supabase.from('resources').select(SELECT).is('deleted_at', null);

  if (mode === 'library') {
    query = query.eq('author_id', userId);
    if (filters.visibility === 'private') query = query.eq('is_shared_public', false);
    if (filters.visibility === 'shared') query = query.eq('is_shared_public', true);
  } else {
    // Public search: shared + the 2-rating quality gate (§8.4/§15).
    query = query.eq('is_shared_public', true).gte('rating_count', 2);
  }

  if (filters.resourceType) query = query.eq('resource_type', filters.resourceType);
  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.search.trim()) query = query.textSearch('search_tsvector', filters.search.trim(), { type: 'websearch' });

  switch (filters.sort) {
    case 'rating':
      query = query.order('rating_avg', { ascending: false });
      break;
    case 'downloads':
      query = query.order('download_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const from = page * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as RawResource[]).map(mapResource);
}

/** Atomic, owner-excluded download counter (§8.4). */
export async function incrementDownload(resourceId: string): Promise<void> {
  await supabase.rpc('increment_resource_download', { p_resource_id: resourceId });
}

export interface ResourceDetail extends Resource {
  fileUrl: string | null;
  fileFormat: string | null;
  authorName: string;
  myRating: number | null;
}

/** Full resource + author + the viewer's existing rating (§2.82). */
export async function fetchResourceDetail(resourceId: string, userId: string): Promise<ResourceDetail> {
  const [res, ratingRes] = await Promise.all([
    supabase
      .from('resources')
      .select(`${SELECT}, file_url, file_format, author:users!resources_author_id_fkey(display_name)`)
      .eq('id', resourceId)
      .maybeSingle(),
    supabase.from('resource_ratings').select('rating').eq('resource_id', resourceId).eq('user_id', userId).maybeSingle(),
  ]);
  if (res.error) throw res.error;
  if (!res.data) throw new Error('Resource not found');
  const r = res.data as RawResource & { file_url: string | null; file_format: string | null; author: { display_name: string | null } | { display_name: string | null }[] | null };
  const base = mapResource(r);
  const author = Array.isArray(r.author) ? r.author[0] : r.author;
  return {
    ...base,
    fileUrl: r.file_url,
    fileFormat: r.file_format,
    authorName: author?.display_name ?? 'Member',
    myRating: (ratingRes.data as { rating: number } | null)?.rating ?? null,
  };
}

/** Rate a resource 1–5 (+ optional comment). Drives the points/quality triggers (§8.4). */
export async function rateResource(resourceId: string, userId: string, rating: number, comment?: string): Promise<void> {
  const { error } = await supabase
    .from('resource_ratings')
    .upsert({ resource_id: resourceId, user_id: userId, rating, comment: comment?.trim() || null }, { onConflict: 'resource_id,user_id' });
  if (error) throw error;
}

export interface UploadResourceInput {
  title: string;
  description: string;
  resourceType: import('./types').ResourceType;
  subject: string;
  board: string[];
  grade: number[];
  isSharedPublic: boolean;
}

/** Create a resource row (§2.84). File upload to Storage happens separately. */
export async function createResource(userId: string, input: UploadResourceInput): Promise<string> {
  const { data, error } = await supabase
    .from('resources')
    .insert({
      author_id: userId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      resource_type: input.resourceType,
      subject: input.subject || null,
      board: input.board,
      grade: input.grade,
      is_shared_public: input.isSharedPublic,
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}
