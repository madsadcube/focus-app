// ─── FOCUS APP DATA ──────────────────────────────────────────────────────────
// Kilde til sandhed: brain/projects/focus-app/data.js
// Focus-appen (focus-app/src/data.js) peger på denne fil via symlink.
// Opdateres af Claude Code under brain-sessioner når opgaver/klienter ændres.
// Sidst opdateret: 2026-04-06

export const OWN_COMPANIES  = ["Ellegård Markedsføring", "Synlii"];
export const CLIENTS        = ["Cardirect", "Bambusudsalg", "Tækkekollektivet", "Tækkemand Carlsen", "Energitømreren", "Xpertens", "AlfaRehab"];
export const ALL_WORKSPACES = [...OWN_COMPANIES, ...CLIENTS];

export const AREAS = {
  "google-ads": { label: "Google Ads", color: "#4285f4" },
  "meta":       { label: "Meta",       color: "#1877f2" },
  "seo":        { label: "SEO",        color: "#10b981" },
  "cro":        { label: "CRO",        color: "#f59e0b" },
  "admin":      { label: "Admin",      color: "#94a3b8" },
};

export const FLAGS = {
  "issue":   { label: "Issue",          color: "#ef4444" },
  "request": { label: "Client Request", color: "#f97316" },
};

export const STATUSES = {
  "todo":        { label: "To do",       color: "#c4bdb4", icon: "○" },
  "in-progress": { label: "In progress", color: "#4285f4", icon: "◑" },
  "waiting":     { label: "Afventer",    color: "#f59e0b", icon: "◷" },
  "done":        { label: "Done",        color: "#10b981", icon: "●" },
};

export const INIT_GOALS = [
  { id: 1, emoji: "🚗", color: "#ef4444", client: "Cardirect",         title: "Webshop med ePay live",              roadmap: "ePay opsætning → test betaling → store body → Google Ads",                                      bottleneck: "Nets-forretningsnumre ikke tastet ind i ePay endnu",           firstStep: "Log ind på app.epay.eu og indtast Dankort-nr. 3581275",                      due: "2026-04-14", log: [{ id: 1, text: "Adpulse auto-pausede kampagner 31. marts — skyldes tracking-fejl. Undersøger.", date: "2026-04-04T15:00:00Z" }, { id: 2, text: "Facebook vinterhjul-annoncer — 2 af 3 færdige", date: "2026-04-04T14:30:00Z" }, { id: 3, text: "ePay-konto bekræftet klar.", date: "2026-04-01T09:00:00Z" }] },
  { id: 2, emoji: "🌿", color: "#10b981", client: "Bambusudsalg",      title: "Shopping-strategi optimeret",        roadmap: "Hent rapport → segment-analyse → ROAS-scenarie → anbefaling",                                   bottleneck: "Mangler opdateret Shopping-rapport",                            firstStep: "Hent ny Shopping-rapport og kør segment-analyse",                            due: "2026-04-18", log: [{ id: 1, text: "Søren ekskluderede dyre hækpakker. Baseline: 49,6x ROAS på 3000kr+ produkter (AOV 5356kr). Analyse om 2 uger.", date: "2026-04-04T12:00:00Z" }] },
  { id: 3, emoji: "🏠", color: "#f59e0b", client: "Tækkekollektivet",  title: "Humlebæk-side konverterer",          roadmap: "Anmeldelser + navngivet tækkemand → garanti → kørselsvejledning",                               bottleneck: "Kun 1 anmeldelse og ingen navngivet fagmand",                   firstStep: "Skriv 3 anmeldelser med stednavne, send til Chris",                          due: "2026-04-15", log: [{ id: 1, text: "Audit: 3 kritiske mangler ift. Austin Plumbing-reference", date: "2026-04-04T16:00:00Z" }] },
  { id: 5, emoji: "🏡", color: "#d97706", client: "Tækkemand Carlsen", title: "Rank top 5 på 'tækkemand helsinge'", roadmap: "Lokalside live med Maps + GBP → indeksering → link building → position tracking",              bottleneck: "Siden er ikke live — Chris (IT) har ikke godkendt format",     firstStep: "Afklar format med Chris og få siden live med Google Maps embed",             due: "2026-06-01", log: [{ id: 1, text: "Hypotese: lokalside med Maps embed + GBP-link giver top 5 ranking inden 60 dage. Baseline: ingen ranking pt.", date: "2026-04-04T12:00:00Z" }] },
  { id: 4, emoji: "💼", color: "#6366f1", client: "Synlii",            title: "Reducér faste omkostninger",         roadmap: "Astro vs Webflow → Adpulse ROI → frigjort budget",                                              bottleneck: "Astro vs Webflow-beslutning udskudt",                          firstStep: "Skriv Webflow use-cases ned og tjek om Astro dækker dem",                    due: "2026-05-01", log: [] },
];

export const INIT_TASKS = [
  { id: 1,  title: "Log ind på app.epay.eu",                          goalId: 1,    area: "admin",      flag: null,      client: "Cardirect",         status: "todo",        due: "2026-04-14", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 2,  title: "Dankort-nr. 3581275 ind i ePay",                  goalId: 1,    area: "admin",      flag: null,      client: "Cardirect",         status: "todo",        due: "2026-04-14", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 3,  title: "Internationale kort-nr. 9099920",                 goalId: 1,    area: "admin",      flag: null,      client: "Cardirect",         status: "todo",        due: "2026-04-14", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 4,  title: "Test betaling",                                   goalId: 1,    area: "admin",      flag: null,      client: "Cardirect",         status: "todo",        due: "2026-04-14", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 5,  title: "Facebook annonce 3 — EV/niche-vinkel",            goalId: 1,    area: "meta",       flag: null,      client: "Cardirect",         status: "todo",        due: "2026-04-10", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 6,  title: "Hent opdateret Shopping-rapport",                 goalId: 2,    area: "google-ads", flag: null,      client: "Bambusudsalg",      status: "todo",        due: "2026-04-18", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 7,  title: "Kør segment-analyse (billige vs. dyre)",          goalId: 2,    area: "google-ads", flag: null,      client: "Bambusudsalg",      status: "todo",        due: "2026-04-18", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 8,  title: "ROAS-scenarie ved 200/300 kr. forsendelse",       goalId: 2,    area: "google-ads", flag: null,      client: "Bambusudsalg",      status: "todo",        due: "2026-04-18", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 9,  title: "Send anbefaling til Søren",                       goalId: 2,    area: "admin",      flag: null,      client: "Bambusudsalg",      status: "todo",        due: "2026-04-18", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 10, title: "3-4 anmeldelser med stednavne",                   goalId: 3,    area: "cro",        flag: null,      client: "Tækkekollektivet",  status: "todo",        due: "2026-04-15", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 11, title: "Navngiv tækkemanden med foto",                    goalId: 3,    area: "cro",        flag: null,      client: "Tækkekollektivet",  status: "todo",        due: "2026-04-15", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 12, title: "Tilføj garanti-sektion",                          goalId: 3,    area: "cro",        flag: null,      client: "Tækkekollektivet",  status: "todo",        due: "2026-04-15", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 13, title: "Kørselsvejledning-kort",                          goalId: 3,    area: "seo",        flag: null,      client: "Tækkekollektivet",  status: "todo",        due: "2026-04-15", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 14, title: "Spørg Chris om Helsinge-format",                  goalId: 3,    area: "admin",      flag: null,      client: "Tækkekollektivet",  status: "todo",        due: "2026-04-08", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 15, title: "Astro vs Webflow — beslutning",                   goalId: 4,    area: "admin",      flag: null,      client: "Synlii",            status: "todo",        due: "2026-05-01", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 16, title: "Adpulse — tjek ROI",                              goalId: 4,    area: "admin",      flag: null,      client: "Synlii",            status: "todo",        due: "2026-05-01", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 17, title: "Pat Arel Fix Your Site — indsend URL",            goalId: 4,    area: "seo",        flag: null,      client: "Synlii",            status: "todo",        due: "2026-04-21", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 18, title: "Fix duplikeret tekst på Helsinge-siden",          goalId: null, area: "seo",        flag: null,      client: "Tækkekollektivet",  status: "todo",        due: "",           notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 19, title: "key-relationships.md udfyldes i brain",           goalId: null, area: "admin",      flag: null,      client: "",                  status: "todo",        due: "",           notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 20, title: "Google Ads skill guide læses",                    goalId: null, area: "google-ads", flag: null,      client: "",                  status: "todo",        due: "",           notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 21, title: "Energitømreren: multiple image upload til form",  goalId: null, area: "admin",      flag: "issue",   client: "Energitømreren",    status: "waiting",     due: "",           notes: "Sandeep undersøger. Afventer svar.", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 22, title: "Bambusudsalg: Søren spørger om budgetforøgelse",  goalId: null, area: "google-ads", flag: "request", client: "Bambusudsalg",      status: "todo",        due: "",           notes: "Søren (Søren Nielsen Ladefoged) overvejer budgetforøgelse — afventer Shopping-analyse og ROAS-scenarie.", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 23, title: "Tækkekollektivet: Chris vil mødes om Helsinge",   goalId: null, area: "admin",      flag: "request", client: "Tækkekollektivet",  status: "todo",        due: "2026-04-07", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 24, title: "Kontakt Chris — afklar Helsinge-format",          goalId: 5,    area: "admin",      flag: null,      client: "Tækkemand Carlsen", status: "todo",        due: "2026-04-08", notes: "Skal Chris godkende format for Helsinge-siden inden vi bygger videre.", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 25, title: "Google Maps embed på Helsinge-siden",             goalId: 5,    area: "seo",        flag: null,      client: "Tækkemand Carlsen", status: "todo",        due: "2026-04-15", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 26, title: "Link til Google Business Profile (GBP)",          goalId: 5,    area: "seo",        flag: null,      client: "Tækkemand Carlsen", status: "todo",        due: "2026-04-15", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 27, title: "Send Helsinge-siden til indeksering",             goalId: 5,    area: "seo",        flag: null,      client: "Tækkemand Carlsen", status: "todo",        due: "2026-04-21", notes: "", log: [], subtasks: [], snoozedUntil: null, priority: null },
  { id: 28, title: "Betal fakturaer",                                  goalId: null, area: "admin",      flag: null,      client: "Ellegård Markedsføring", status: "todo",  due: "2026-04-07", notes: "", log: [{ id: 1, text: "Betalt faktura til RM Marketing (Jonas Bay). Bekræftet via Slack: \"Tak. Den er betalt nu.\"", date: "2026-04-07T00:00:00Z" }], subtasks: [], snoozedUntil: null, priority: null },
  { id: 29, title: "Energitømreren: Opret 60 manglende service-sider (404)",  goalId: null, area: "seo", flag: "issue", client: "Energitømreren", status: "todo", due: "", notes: "GSC viser 60 sider med 404 — første crawlet 19. apr 2025. Alle er /udskiftning-doere-[by]/ sider. Skal oprettes i WordPress. Byer fra GSC: Albertslund, Frederiksværk, Hillerød, Hørsholm, Søborg, Ballerup, Roskilde, Fredensborg, Greve, Hvidovre + 50 mere.", log: [], subtasks: [], snoozedUntil: null, priority: null },
];

export const INIT_ROUTINES = [
  { id: 1, title: "/gm morgenroutine",         cadence: "Dagligt",   lastDone: "2026-04-05", streak: 1, color: "#f59e0b" },
  { id: 2, title: "Månedlig Google Ads audit", cadence: "Månedligt", lastDone: "2026-03-15", streak: 0, color: "#4285f4" },
  { id: 3, title: "Klient-check-in runde",     cadence: "Ugentligt", lastDone: "2026-03-28", streak: 0, color: "#10b981" },
  { id: 4, title: "Fakturering",               cadence: "Månedligt", lastDone: "2026-03-01", streak: 0, color: "#6366f1" },
];

export const INIT_SEO_PAGES = [
  { id: 1, client: "Tækkekollektivet", url: "taekkekollektivet.dk/taekkemand-humlebaek/", keyword: "tækkemand humlebæk",
    positionHistory: [
      { id: 1, date: "2026-03-01", position: 24 },
      { id: 2, date: "2026-03-15", position: 19 },
      { id: 3, date: "2026-04-01", position: 14 },
      { id: 4, date: "2026-04-05", position: 14 },
    ],
    changeLog: [
      { id: 1, date: "2026-03-01", text: "Side oprettet og sendt til indeksering" },
      { id: 2, date: "2026-03-10", text: "Title tag optimeret: 'Tækkemand i Humlebæk — Tækkekollektivet'" },
      { id: 3, date: "2026-03-28", text: "Meta description tilføjet med lokale søgeord" },
      { id: 4, date: "2026-04-04", text: "CRO audit: mangler anmeldelser, navngivet håndværker + garanti" },
    ],
    notes: "Næste fokus: tilføj 3-4 anmeldelser med stednavne + navngivet tækkemand", updatedAt: "2026-04-06" },
  { id: 2, client: "Tækkekollektivet", url: "taekkekollektivet.dk/taekkemand-helsinge/", keyword: "tækkemand helsinge",
    positionHistory: [],
    changeLog: [{ id: 1, date: "2026-04-04", text: "Side under opbygning — afventer Chris' beslutning om format" }],
    notes: "Afventer Chris", updatedAt: "2026-04-04" },
  { id: 3, client: "Cardirect",        url: "cardirect.dk/",         keyword: "køb brugt bil",    positionHistory: [], changeLog: [], notes: "", updatedAt: "" },
  { id: 4, client: "Synlii",           url: "synlii.dk/google-ads/", keyword: "google ads bureau", positionHistory: [], changeLog: [], notes: "", updatedAt: "" },
];

export const INIT_RETAINERS = [
  { id: 1, client: "Cardirect",         monthlyFee: 5000, currency: "DKK", services: ["google-ads", "meta"], hoursIncluded: null, status: "active", billingDay: 1, startDate: "2025-01-01", notes: "ePay webshop projekt igangværende", expenses: [] },
  { id: 2, client: "Bambusudsalg",      monthlyFee: 3000, currency: "DKK", services: ["google-ads"],         hoursIncluded: null, status: "active", billingDay: 1, startDate: "2025-03-01", notes: "Shopping-fokus. Kontakt: Søren Nielsen Ladefoged", expenses: [] },
  { id: 3, client: "Tækkekollektivet",  monthlyFee: 4000, currency: "DKK", services: ["google-ads", "seo"],  hoursIncluded: null, status: "active", billingDay: 1, startDate: "2024-09-01", notes: "Kontakt: Chris (IT)", expenses: [] },
  { id: 4, client: "Tækkemand Carlsen", monthlyFee: 3000, currency: "DKK", services: ["seo"],                hoursIncluded: null, status: "active", billingDay: 1, startDate: "2026-03-01", notes: "Ny klient. Samme ejer som Tækkekollektivet", expenses: [] },
  { id: 5, client: "Energitømreren",    monthlyFee: 3000, currency: "DKK", services: ["google-ads"],         hoursIncluded: null, status: "active", billingDay: 1, startDate: "2025-06-01", notes: "", expenses: [] },
  { id: 6, client: "Xpertens",          monthlyFee: 3000, currency: "DKK", services: ["google-ads"],         hoursIncluded: null, status: "active", billingDay: 1, startDate: "2025-01-01", notes: "", expenses: [] },
  { id: 7, client: "AlfaRehab",         monthlyFee: 3000, currency: "DKK", services: ["google-ads"],         hoursIncluded: null, status: "active", billingDay: 1, startDate: "2026-01-01", notes: "", expenses: [] },
];

export const INIT_PROJECTS = [
  { id: 1, title: "Webshop launch", client: "Cardirect", color: "#ef4444", status: "active", due: "2026-04-30", description: "ePay integration, produktsider og Google Ads kampagne." },
];

// Idea statuses: "ny" | "vurderer" | "bygger" | "parkeret"
export const INIT_IDEAS = [
  {
    id: 1,
    title: "Facebook → Google Business Profile auto-poster",
    description: "Hver gang der oprettes et Facebook-opslag, scrapes det automatisk og konverteres til et GBP-post. Sparer tid og sikrer konsistent tilstedeværelse på tværs af platforme.",
    status: "ny",
    tags: ["automation", "GBP", "Facebook"],
    createdAt: "2026-04-09",
  },
];

