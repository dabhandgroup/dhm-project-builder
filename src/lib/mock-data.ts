// Mock data for UI design — no Supabase needed

export const mockProfiles = [
  {
    id: "user-1",
    full_name: "Danny Hughes",
    email: "danny@dabhandmarketing.com",
    avatar_url: null,
    role: "admin" as const,
    must_change_password: false,
    created_at: "2025-06-01T09:00:00Z",
  },
  {
    id: "user-2",
    full_name: "Sarah Mitchell",
    email: "sarah@dabhandmarketing.com",
    avatar_url: null,
    role: "member" as const,
    must_change_password: false,
    created_at: "2025-07-15T10:00:00Z",
  },
  {
    id: "user-3",
    full_name: "Jake Prescott",
    email: "jake@dabhandmarketing.com",
    avatar_url: null,
    role: "member" as const,
    must_change_password: true,
    created_at: "2026-01-10T11:30:00Z",
  },
];

export const mockClients = [
  {
    id: "client-1",
    name: "James Richardson",
    email: "james@richardsonlegal.co.uk",
    phone: "0161 234 5678",
    company: "Richardson Legal",
    address: "45 King Street, Manchester, M2 4LQ",
    created_at: "2025-08-10T09:00:00Z",
  },
  {
    id: "client-2",
    name: "Mark Thompson",
    email: "mark@thompsonplumbing.co.uk",
    phone: "07700 123456",
    company: "Thompson Plumbing & Heating",
    address: "12 Industrial Way, Salford, M5 3BT",
    created_at: "2025-09-15T10:00:00Z",
  },
  {
    id: "client-3",
    name: "Lisa Greenwood",
    email: "lisa@greenwoodelectrical.co.uk",
    phone: "0161 987 6543",
    company: "Greenwood Electrical Services",
    address: "78 London Road, Stockport, SK7 1PD",
    created_at: "2025-10-20T14:30:00Z",
  },
  {
    id: "client-4",
    name: "David Chen",
    email: "david@manchesterdental.co.uk",
    phone: "0161 456 7890",
    company: "Manchester Dental Care",
    address: "22 Deansgate, Manchester, M3 1RH",
    created_at: "2025-11-05T08:00:00Z",
  },
  {
    id: "client-5",
    name: "Claire Watson",
    email: "claire@watsonroofing.co.uk",
    phone: "07891 234567",
    company: "Watson Roofing Solutions",
    address: "5 Oak Lane, Bolton, BL1 2QR",
    created_at: "2026-01-12T11:00:00Z",
  },
];

export const mockProjects = [
  {
    id: "proj-1",
    title: "Richardson Legal — Full Rebuild",
    domain_name: "richardsonlegal.co.uk",
    status: "revisions" as const,
    is_rebuild: true,
    client_id: "client-1",
    one_off_revenue: 1200,
    recurring_revenue: 199,
    ai_model: "orchids",
    preview_url: "https://richardsonlegal.dabhandmarketing.com",
    brief: "Full website rebuild for a Manchester-based law firm specialising in family law and conveyancing. Current site is outdated WordPress from 2018. Client wants modern, professional look with trust signals, testimonials section, individual solicitor profile pages, and an online enquiry form. Must include areas of practice pages for: Family Law, Conveyancing, Wills & Probate, Employment Law.",
    brief_summary: "Manchester family law firm needs modern rebuild: practice area pages, solicitor profiles, testimonials, enquiry forms. Replacing outdated 2018 WordPress site.",
    pages_required: "Home, About Us, Family Law, Conveyancing, Wills & Probate, Employment Law, Our Team, Testimonials, Contact, Blog",
    contact_info: { phone: "0161 234 5678", email: "james@richardsonlegal.co.uk", address: "45 King Street, Manchester, M2 4LQ" },
    google_maps_embed: "",
    additional_notes: "Client has existing logo and brand colours (navy #1B365D and gold #C5A572). Wants to keep these. Has 15+ Google reviews to showcase.",
    sitemap_url: "https://richardsonlegal.co.uk/sitemap.xml",
    target_locations: ["Manchester", "Salford", "Stockport", "Altrincham", "Didsbury"],
    created_at: "2025-10-01T09:00:00Z",
    created_by: "user-1",
  },
  {
    id: "proj-2",
    title: "Thompson Plumbing — New Website",
    domain_name: "thompsonplumbing.co.uk",
    status: "initial_draft" as const,
    is_rebuild: false,
    client_id: "client-2",
    one_off_revenue: 800,
    recurring_revenue: 199,
    ai_model: "orchids",
    preview_url: "https://thompsonplumbing.dabhandmarketing.com",
    brief: "New website for local plumbing and heating business. They've never had a website before, relying on word of mouth and Facebook. Need service pages for: emergency plumbing, boiler installation/repair, bathroom fitting, central heating, and drain unblocking. Must have click-to-call prominent on every page.",
    brief_summary: "First website for plumber — service pages, emergency contact CTAs, click-to-call, Facebook reviews integration.",
    pages_required: "Home, Emergency Plumbing, Boiler Services, Bathroom Fitting, Central Heating, Drain Unblocking, About, Contact",
    contact_info: { phone: "07700 123456", email: "mark@thompsonplumbing.co.uk", address: "12 Industrial Way, Salford, M5 3BT" },
    google_maps_embed: "",
    additional_notes: "No existing branding. Happy for us to create logo. Prefers blue and white colour scheme. Wants Gas Safe and Checkatrade badges visible.",
    sitemap_url: "",
    target_locations: ["Salford", "Manchester", "Eccles", "Swinton", "Worsley"],
    created_at: "2025-11-15T14:00:00Z",
    created_by: "user-1",
  },
  {
    id: "proj-3",
    title: "Greenwood Electrical — Rebuild",
    domain_name: "greenwoodelectrical.co.uk",
    status: "complete" as const,
    is_rebuild: true,
    client_id: "client-3",
    one_off_revenue: 950,
    recurring_revenue: 199,
    ai_model: "claude",
    preview_url: "https://greenwoodelectrical.dabhandmarketing.com",
    brief: "Rebuild of electrician website. Old Wix site doesn't rank at all. Need strong SEO focus with service pages for each offering. Client does both domestic and commercial work.",
    brief_summary: "Electrician site rebuild from Wix. SEO-focused with domestic and commercial service pages.",
    pages_required: "Home, Domestic Services, Commercial Services, Testing & Inspection, EV Charger Installation, Rewiring, About, Reviews, Contact",
    contact_info: { phone: "0161 987 6543", email: "lisa@greenwoodelectrical.co.uk", address: "78 London Road, Stockport, SK7 1PD" },
    google_maps_embed: "",
    additional_notes: "Completed and live. Client very happy with results. Ranking page 1 for 'electrician stockport' within 4 weeks.",
    sitemap_url: "https://greenwoodelectrical.co.uk/sitemap.xml",
    target_locations: ["Stockport", "Cheadle", "Bramhall", "Hazel Grove", "Poynton"],
    created_at: "2025-09-01T11:00:00Z",
    created_by: "user-2",
  },
  {
    id: "proj-4",
    title: "Manchester Dental Care — New Website",
    domain_name: "manchesterdental.co.uk",
    status: "revisions" as const,
    is_rebuild: false,
    client_id: "client-4",
    one_off_revenue: 1500,
    recurring_revenue: 249,
    ai_model: "orchids",
    preview_url: "https://manchesterdental.dabhandmarketing.com",
    brief: "Premium dental practice website. Needs to convey trust and professionalism. Services include NHS dentistry, cosmetic dentistry, Invisalign, dental implants, teeth whitening, and emergency dental care. Must have online booking integration and team profile section.",
    brief_summary: "Premium dental practice site: NHS + cosmetic services, online booking, team profiles, trust-focused design.",
    pages_required: "Home, NHS Dentistry, Cosmetic Dentistry, Invisalign, Implants, Teeth Whitening, Emergency, Our Team, Patient Info, Book Online, Contact",
    contact_info: { phone: "0161 456 7890", email: "david@manchesterdental.co.uk", address: "22 Deansgate, Manchester, M3 1RH" },
    google_maps_embed: "",
    additional_notes: "High-value client willing to pay premium for quality. Has professional photography already. Wants video on homepage.",
    sitemap_url: "",
    target_locations: ["Manchester", "Manchester City Centre", "Deansgate", "Salford", "Castlefield"],
    created_at: "2026-01-20T10:00:00Z",
    created_by: "user-1",
  },
  {
    id: "proj-5",
    title: "Watson Roofing — New Website",
    domain_name: "watsonroofing.co.uk",
    status: "draft" as const,
    is_rebuild: false,
    client_id: "client-5",
    one_off_revenue: 750,
    recurring_revenue: 199,
    ai_model: "orchids",
    preview_url: "",
    brief: "New roofing company website. Services: roof repairs, new roofs, flat roofing, fascias & soffits, guttering, chimney work.",
    brief_summary: "Roofer needs new site with full service pages and local SEO.",
    pages_required: "Home, Roof Repairs, New Roofs, Flat Roofing, Fascias & Soffits, Guttering, Chimney Work, About, Contact",
    contact_info: { phone: "07891 234567", email: "claire@watsonroofing.co.uk", address: "5 Oak Lane, Bolton, BL1 2QR" },
    google_maps_embed: "",
    additional_notes: "Draft stage - initial call done, brief captured via voice memo.",
    sitemap_url: "",
    target_locations: ["Bolton", "Wigan", "Bury", "Farnworth", "Horwich"],
    created_at: "2026-02-28T16:00:00Z",
    created_by: "user-1",
  },
  {
    id: "proj-6",
    title: "Elite Garage Doors — Rebuild",
    domain_name: "elitegaragedoors.co.uk",
    status: "initial_draft" as const,
    is_rebuild: true,
    client_id: "client-1",
    one_off_revenue: 900,
    recurring_revenue: 199,
    ai_model: "orchids",
    preview_url: "https://elitegaragedoors.dabhandmarketing.com",
    brief: "Garage door company needs a modern website. Current GoDaddy builder site looks terrible. Services: roller garage doors, sectional doors, side-hinged doors, up-and-over doors, electric door openers, repairs.",
    brief_summary: "Garage door company rebuild from GoDaddy. Full service pages with SEO.",
    pages_required: "Home, Roller Doors, Sectional Doors, Side-Hinged, Up-and-Over, Electric Openers, Repairs, Gallery, Contact",
    contact_info: { phone: "0161 234 5678", email: "james@richardsonlegal.co.uk", address: "45 King Street, Manchester" },
    google_maps_embed: "",
    additional_notes: "",
    sitemap_url: "",
    target_locations: ["Manchester", "Trafford", "Sale", "Urmston", "Stretford"],
    created_at: "2026-03-01T09:00:00Z",
    created_by: "user-1",
  },
];

export const mockVoiceMemos = [
  {
    id: "memo-1",
    transcription: "Just had a call with James from Richardson Legal. He wants to keep the navy and gold branding. The main thing he stressed is that he wants every page to have a clear call to action - either phone number or enquiry form. He also mentioned they're launching a new immigration law service next quarter so we might need to add that page later.",
    summary: "Richardson Legal call recap: Keep navy/gold branding, strong CTAs on every page, new immigration law service coming next quarter.",
    source_field: "brief",
    project_id: "proj-1",
    created_by: "user-1",
    created_at: "2025-10-01T09:30:00Z",
  },
  {
    id: "memo-2",
    transcription: "Thompson Plumbing meeting notes. Mark doesn't have any branding at all, no logo, nothing. He said he wants it to look professional but not corporate. His main competitors are Pimlico Plumbers and local guys on Checkatrade. He gets most of his work from emergency calls so that needs to be front and centre. Gas Safe number is 543210.",
    summary: "Thompson Plumbing: No existing branding, wants professional not corporate look, emergency calls are primary lead source, Gas Safe #543210.",
    source_field: "brief",
    project_id: "proj-2",
    created_by: "user-1",
    created_at: "2025-11-15T14:30:00Z",
  },
  {
    id: "memo-3",
    transcription: "Quick note about the dental site. David wants a video header on the homepage showing the practice. He's going to send over the footage from the photographer they hired. The Invisalign page needs to have before and after photos. Also needs CQC registered badge somewhere visible.",
    summary: "Dental site: Video header needed, Invisalign before/after photos, CQC badge required.",
    source_field: "additional_notes",
    project_id: "proj-4",
    created_by: "user-1",
    created_at: "2026-01-20T10:30:00Z",
  },
  {
    id: "memo-4",
    transcription: "General thought - we should create a standard template for service business websites that we can quickly customise. Most of our clients need the same structure: hero section, services grid, testimonials, about section, contact form. Could save us hours on each project.",
    summary: "Idea: Create standard service business template for faster delivery.",
    source_field: null,
    project_id: null,
    created_by: "user-1",
    created_at: "2026-02-15T16:00:00Z",
  },
];

export const mockAudits = [
  {
    id: "audit-1",
    current_url: "https://old.richardsonlegal.co.uk",
    new_url: "https://richardsonlegal.dabhandmarketing.com",
    status: "complete",
    pagespeed_before: {
      performanceScore: 34,
      largestContentfulPaint: 8200,
      cumulativeLayoutShift: 0.45,
      speedIndex: 7100,
    },
    pagespeed_after: {
      performanceScore: 94,
      largestContentfulPaint: 1200,
      cumulativeLayoutShift: 0.02,
      speedIndex: 1400,
    },
    created_at: "2025-12-01T09:00:00Z",
    completed_at: "2025-12-01T09:05:00Z",
  },
  {
    id: "audit-2",
    current_url: "https://old.greenwoodelectrical.co.uk",
    new_url: "https://greenwoodelectrical.dabhandmarketing.com",
    status: "complete",
    pagespeed_before: {
      performanceScore: 22,
      largestContentfulPaint: 12400,
      cumulativeLayoutShift: 0.78,
      speedIndex: 9800,
    },
    pagespeed_after: {
      performanceScore: 97,
      largestContentfulPaint: 890,
      cumulativeLayoutShift: 0.01,
      speedIndex: 1100,
    },
    created_at: "2025-10-15T11:00:00Z",
    completed_at: "2025-10-15T11:04:00Z",
  },
  {
    id: "audit-3",
    current_url: "https://manchesterdental.co.uk",
    new_url: "https://manchesterdental.dabhandmarketing.com",
    status: "running",
    pagespeed_before: {
      performanceScore: 51,
      largestContentfulPaint: 5600,
      cumulativeLayoutShift: 0.32,
      speedIndex: 4900,
    },
    pagespeed_after: null,
    created_at: "2026-03-05T14:00:00Z",
    completed_at: null,
  },
];

export const mockContentPlans = [
  {
    id: "plan-1",
    project_id: "proj-1",
    plan_data: [
      { month: "January", topic: "Family Law Rights in the New Year", keywords: ["family law solicitor manchester", "divorce lawyer manchester"], locations: ["Manchester", "Salford"], notes: "Tie into New Year resolution themes" },
      { month: "February", topic: "Understanding Prenuptial Agreements", keywords: ["prenup solicitor", "prenuptial agreement uk"], locations: ["Manchester", "Altrincham"], notes: "Valentine's Day angle" },
      { month: "March", topic: "Spring Property Market & Conveyancing", keywords: ["conveyancing solicitor manchester", "property lawyer"], locations: ["Manchester", "Stockport"], notes: "Spring market surge content" },
      { month: "April", topic: "Employment Law Updates", keywords: ["employment law solicitor", "unfair dismissal lawyer"], locations: ["Manchester", "Salford"], notes: "New tax year employment changes" },
      { month: "May", topic: "Guide to Making a Will", keywords: ["will writing service manchester", "probate solicitor"], locations: ["Manchester", "Didsbury"], notes: "" },
      { month: "June", topic: "Child Custody Arrangements for Summer", keywords: ["child custody solicitor", "family law summer"], locations: ["Manchester", "Altrincham"], notes: "Summer holiday custody tips" },
      { month: "July", topic: "First-Time Buyer Conveyancing Guide", keywords: ["first time buyer solicitor", "conveyancing guide"], locations: ["Manchester", "Stockport"], notes: "" },
      { month: "August", topic: "Workplace Disputes Resolution", keywords: ["workplace dispute solicitor", "employment tribunal"], locations: ["Manchester", "Salford"], notes: "" },
      { month: "September", topic: "Back to School — Co-Parenting Guide", keywords: ["co-parenting solicitor", "child arrangement order"], locations: ["Manchester", "Didsbury"], notes: "School term co-parenting angle" },
      { month: "October", topic: "Protecting Your Estate This Autumn", keywords: ["estate planning manchester", "wills and probate"], locations: ["Manchester", "Altrincham"], notes: "Wills awareness month" },
      { month: "November", topic: "Redundancy Rights Guide", keywords: ["redundancy solicitor manchester", "employment rights"], locations: ["Manchester", "Salford"], notes: "" },
      { month: "December", topic: "Year-End Legal Checklist", keywords: ["legal advice manchester", "solicitor end of year"], locations: ["Manchester", "Stockport"], notes: "Review and plan for next year" },
    ],
    google_sheet_url: "https://docs.google.com/spreadsheets/d/example1",
    google_doc_url: "https://docs.google.com/document/d/example1",
    created_at: "2025-11-01T09:00:00Z",
  },
  {
    id: "plan-2",
    project_id: "proj-3",
    plan_data: [
      { month: "January", topic: "Winter Electrical Safety Tips", keywords: ["electrician stockport", "electrical safety"], locations: ["Stockport", "Cheadle"], notes: "" },
      { month: "February", topic: "EV Charger Installation Guide", keywords: ["ev charger installation stockport", "home ev charger"], locations: ["Stockport", "Bramhall"], notes: "Growing demand for EV chargers" },
      { month: "March", topic: "EICR Testing Requirements", keywords: ["eicr testing stockport", "electrical inspection"], locations: ["Stockport", "Hazel Grove"], notes: "Landlord EICR deadline awareness" },
      { month: "April", topic: "Spring Home Rewiring Guide", keywords: ["house rewiring stockport", "rewiring cost"], locations: ["Stockport", "Poynton"], notes: "" },
      { month: "May", topic: "Commercial Electrical Services", keywords: ["commercial electrician stockport", "business electrical"], locations: ["Stockport", "Cheadle"], notes: "" },
      { month: "June", topic: "Outdoor Lighting for Summer", keywords: ["garden lighting stockport", "outdoor electrician"], locations: ["Stockport", "Bramhall"], notes: "" },
      { month: "July", topic: "Smart Home Electrical Setup", keywords: ["smart home electrician", "home automation stockport"], locations: ["Stockport", "Hazel Grove"], notes: "" },
      { month: "August", topic: "Fuse Board Upgrades Explained", keywords: ["consumer unit upgrade stockport", "fuse board replacement"], locations: ["Stockport", "Poynton"], notes: "" },
      { month: "September", topic: "Landlord Electrical Certificates", keywords: ["landlord electrician stockport", "eicr certificate"], locations: ["Stockport", "Cheadle"], notes: "" },
      { month: "October", topic: "Preparing Electrics for Winter", keywords: ["electrical safety winter", "electrician near me"], locations: ["Stockport", "Bramhall"], notes: "" },
      { month: "November", topic: "Emergency Electrician Guide", keywords: ["emergency electrician stockport", "24 hour electrician"], locations: ["Stockport", "Hazel Grove"], notes: "" },
      { month: "December", topic: "Christmas Lighting Safety", keywords: ["christmas lights electrician", "festive electrical safety"], locations: ["Stockport", "Poynton"], notes: "Seasonal safety content" },
    ],
    google_sheet_url: "https://docs.google.com/spreadsheets/d/example2",
    google_doc_url: null,
    created_at: "2025-10-05T14:00:00Z",
  },
];

// Helper to get client name by ID
export function getClientName(clientId: string | null): string | null {
  if (!clientId) return null;
  return mockClients.find((c) => c.id === clientId)?.name ?? null;
}

// Helper to get projects for a client
export function getClientProjects(clientId: string) {
  return mockProjects.filter((p) => p.client_id === clientId);
}

// Helper to get project by ID
export function getProjectById(id: string) {
  return mockProjects.find((p) => p.id === id) ?? null;
}

// Helper to get client by ID
export function getClientById(id: string) {
  return mockClients.find((c) => c.id === id) ?? null;
}

// Helper to get audit by ID
export function getAuditById(id: string) {
  return mockAudits.find((a) => a.id === id) ?? null;
}

// Helper to get content plan by project ID
export function getContentPlanByProjectId(projectId: string) {
  return mockContentPlans.find((p) => p.project_id === projectId) ?? null;
}
