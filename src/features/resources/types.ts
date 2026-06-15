export type ResourceType =
  | 'lesson_plan'
  | 'assessment'
  | 'worksheet'
  | 'rubric'
  | 'parent_comm'
  | 'event_blueprint'
  | 'policy_sop'
  | 'presentation'
  | 'other';

export interface Resource {
  id: string;
  authorId: string;
  title: string;
  description: string | null;
  resourceType: ResourceType;
  board: string[];
  grade: number[];
  subject: string | null;
  ratingAvg: number;
  ratingCount: number;
  downloadCount: number;
  isProOnly: boolean;
  isSharedPublic: boolean;
  isAiGenerated: boolean;
  createdAt: string;
}

export type ResourceSort = 'recent' | 'rating' | 'downloads';
export type Visibility = 'all' | 'private' | 'shared';

export interface ResourceFilters {
  search: string;
  resourceType: ResourceType | null;
  subject: string | null;
  sort: ResourceSort;
  /** Library only — private vs shared vs all. */
  visibility: Visibility;
}

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  lesson_plan: 'Lesson plan',
  assessment: 'Assessment',
  worksheet: 'Worksheet',
  rubric: 'Rubric',
  parent_comm: 'Parent comm',
  event_blueprint: 'Event pack',
  policy_sop: 'Policy / SOP',
  presentation: 'Presentation',
  other: 'Other',
};

export const PAGE_SIZE = 20;

export function emptyFilters(): ResourceFilters {
  return { search: '', resourceType: null, subject: null, sort: 'recent', visibility: 'all' };
}
