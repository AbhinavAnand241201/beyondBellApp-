import { getEventType, type EventBlueprint, type EventInput, type ThemeSuggestion } from './types';

/**
 * Demo blueprint + theme suggestions — power the empty-state preview and the
 * no-backend demo. Replace with real `generateBlueprint` / `suggestThemes`
 * output once the backend is connected.
 */

export const SAMPLE_THEMES: ThemeSuggestion[] = [
  {
    name: 'Roots & Wings',
    tagline: 'Grounded in values, reaching for the sky',
    palette: ['#F5A400', '#1D6B47', '#FFFFFF'],
    concept: 'Celebrates tradition and ambition together — perfect for an Annual Day spanning juniors and seniors.',
  },
  {
    name: 'Kaleidoscope',
    tagline: 'Every child a colour, together a masterpiece',
    palette: ['#E8554E', '#F5A400', '#3B7DD8'],
    concept: 'A vibrant, inclusive theme highlighting diversity of talent across grades and houses.',
  },
  {
    name: 'Beyond the Bell',
    tagline: 'Where learning becomes living',
    palette: ['#111111', '#F5A400', '#E8E4DC'],
    concept: 'A sophisticated theme for senior-led showcases that connects classroom learning to real-world expression.',
  },
];

export function demoBlueprint(input: EventInput): EventBlueprint {
  const ev = getEventType(input.eventTypeId);
  const name = ev?.label ?? 'School Event';
  const theme = input.theme.trim() || SAMPLE_THEMES[0]?.name || 'Roots & Wings';

  return {
    brief: {
      purpose: `To host a memorable ${name} that showcases student talent and strengthens the school community.`,
      theme,
      audience: input.audience,
      highlights: ['Student-led performances', 'Chief guest felicitation', 'House participation', 'Parent showcase'],
      successMetrics: ['90%+ student participation', 'On-time programme flow', 'Positive parent feedback'],
    },
    programme: {
      totalDuration: '2 hours',
      items: [
        { time: '5:00 PM', activity: 'Guests seated · School prayer', responsible: 'Hospitality team' },
        { time: '5:10 PM', activity: 'Welcome address (student)', responsible: 'Head Girl' },
        { time: '5:20 PM', activity: 'Chief guest felicitation', responsible: 'Principal' },
        { time: '5:30 PM', activity: 'Cultural performances (junior)', responsible: 'Cultural committee' },
        { time: '6:10 PM', activity: 'Prize distribution', responsible: 'Coordinator' },
        { time: '6:40 PM', activity: 'Senior showcase', responsible: 'Cultural committee' },
        { time: '7:10 PM', activity: 'Vote of thanks (student) · National anthem', responsible: 'Head Boy' },
      ],
    },
    roles: {
      committees: [
        { name: 'Core team', lead: 'Event Coordinator', scope: 'Overall planning, approvals, timeline' },
        { name: 'Stage & Programme', lead: 'Cultural Teacher', scope: 'Performances, running order, anchoring' },
        { name: 'Decoration', lead: 'Art Teacher', scope: 'Stage backdrop, venue décor, theme execution' },
        { name: 'Technical (A/V)', lead: 'IT Teacher', scope: 'Sound, lighting, projection, recording' },
        { name: 'Hospitality', lead: 'Admin Staff', scope: 'Guest seating, refreshments, ushering' },
        { name: 'Documentation', lead: 'Media Club Teacher', scope: 'Photography, social media, report' },
      ],
      studentRoles: [
        { title: 'Master of Ceremonies', gradeRange: 'Class 9–11', responsibilities: ['Anchor the programme', 'Introduce each item', 'Manage transitions'], reportsTo: 'Stage committee lead' },
        { title: 'Backstage manager', gradeRange: 'Class 10–12', responsibilities: ['Cue performers', 'Manage props', 'Keep timing'], reportsTo: 'Stage committee lead' },
        { title: 'Hospitality volunteers', gradeRange: 'Class 8–10', responsibilities: ['Greet guests', 'Guide seating', 'Serve refreshments'], reportsTo: 'Hospitality lead' },
      ],
      staffRoles: [
        { title: 'Cultural Teacher', responsibilities: ['Curate performances', 'Run rehearsals'] },
        { title: 'IT Teacher', responsibilities: ['Test A/V the day before', 'Operate console during event'] },
      ],
    },
    rehearsal: [
      { label: '4 weeks before', focus: 'Auditions and item selection' },
      { label: '2 weeks before', focus: 'Group rehearsals + script read-through' },
      { label: '1 week before', focus: 'Full run-through with timing' },
      { label: '2 days before', focus: 'Dress rehearsal on stage with A/V' },
    ],
    budget: {
      groups: [
        { name: 'Venue / Infrastructure', items: [{ item: 'Stage & seating setup', range: '₹8,000–12,000' }] },
        { name: 'Decoration', items: [{ item: 'Backdrop & theme décor', range: '₹6,000–10,000' }] },
        { name: 'Audio / Visual', items: [{ item: 'Sound & lighting rental', range: '₹8,000–15,000' }] },
        { name: 'Prizes / Certificates', items: [{ item: 'Trophies, medals, certificates', range: '₹5,000–8,000' }] },
        { name: 'Refreshments', items: [{ item: 'Guest & volunteer refreshments', range: '₹4,000–7,000' }] },
        { name: 'Miscellaneous', items: [{ item: 'Stationery, printing, transport', range: '₹2,000–4,000' }] },
      ],
      contingency: '10% of total',
      total: input.budgetRange,
    },
    comms: [
      { what: 'Save-the-date', audience: 'Parents', channel: 'WhatsApp broadcast', when: '3 weeks before', draft: 'Dear parents, mark your calendars for our Annual Day on [date]. Details to follow.' },
      { what: 'Formal invitation', audience: 'Parents + Guests', channel: 'Physical circular', when: '1 week before', draft: 'You are cordially invited to [School]’s Annual Day...' },
      { what: 'Reporting time for performers', audience: 'Students', channel: 'Class notice', when: '2 days before', draft: 'All performers report by 3:30 PM in school uniform.' },
    ],
    checklist: [
      { phase: '4 weeks before', items: [{ item: 'Get management approval on theme & budget', responsible: 'Coordinator', deadline: 'Week 1' }, { item: 'Form committees', responsible: 'Coordinator', deadline: 'Week 1' }] },
      { phase: '2 weeks before', items: [{ item: 'Finalise programme order', responsible: 'Stage lead', deadline: 'Week 3' }, { item: 'Confirm chief guest', responsible: 'Principal', deadline: 'Week 3' }] },
      { phase: '2 days before', items: [{ item: 'Dress rehearsal', responsible: 'Stage lead', deadline: 'Day -2' }, { item: 'A/V test', responsible: 'IT Teacher', deadline: 'Day -2' }] },
      { phase: 'Day of', items: [{ item: 'Venue setup complete by 3 PM', responsible: 'Decoration lead', deadline: 'Event day' }, { item: 'Guest registration desk ready', responsible: 'Hospitality', deadline: 'Event day' }] },
      { phase: 'Post-event', items: [{ item: 'Thank-you notes to guests & volunteers', responsible: 'Coordinator', deadline: 'Day +2' }, { item: 'Venue cleanup & equipment return', responsible: 'All committees', deadline: 'Day +1' }] },
    ],
    scripts: {
      mc: [
        'Good evening, respected Principal, teachers, parents, and my dear friends.',
        'It gives me immense pleasure to welcome you to our Annual Day celebration.',
        'May I now invite [Name] to deliver the welcome address.',
        '(after each item) That was a wonderful performance — let’s give them a big round of applause!',
      ],
      welcomeAddress: ['Greet dignitaries and guests', 'Briefly state the theme and its meaning', 'Thank parents for their support', 'Set the tone for the evening'],
      voteOfThanks: ['Thank the chief guest by name', 'Thank the principal and teachers', 'Thank the committees and volunteers', 'Thank the audience for attending'],
    },
  };
}

export const SAMPLE_INPUT: EventInput = {
  eventTypeId: 'annual_day',
  audience: 'Students + Parents',
  attendance: '300–500',
  venue: 'School auditorium',
  date: '',
  budgetRange: '₹20–50K',
  grades: [6, 7, 8, 9, 10],
  theme: '',
  specialRequirements: 'Chief guest expected',
  leadTime: '1 month',
};
