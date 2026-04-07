import { useState, useEffect } from "react";
import { AREAS, FLAGS, STATUSES, OWN_COMPANIES, CLIENTS, ALL_WORKSPACES, INIT_GOALS, INIT_TASKS, INIT_ROUTINES, INIT_SEO_PAGES, INIT_RETAINERS } from "./data.js";

const nowISO = () => new Date().toISOString();
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
};
const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};
const fmtDue = (iso) => {
  if (!iso) return null;
  const days = Math.floor((new Date(iso) - Date.now()) / 86400000);
  if (days < 0) return { label: fmtDate(iso), color: "#ef4444" };
  if (days === 0) return { label: "I dag", color: "#ef4444" };
  if (days <= 5) return { label: fmtDate(iso), color: "#f97316" };
  return { label: fmtDate(iso), color: "#94a3b8" };
};


const BG = "#f3f4f6";
const SIDEBAR_W = 228;
const PANEL_MIN = 320;
const PANEL_MAX = 640;

const LABEL  = { fontSize: 10, fontWeight: 600, color: "#7f8c9a", letterSpacing: "0.6px", display: "block", marginBottom: 6, textTransform: "uppercase" };
const SELECT = { width: "100%", border: "1.5px solid #e3e6ea", borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#f8f9fb", cursor: "pointer", boxSizing: "border-box", color: "#1e1f21", transition: "border-color 0.15s" };

export default function App() {
  const [nav, setNav]                   = useState("issues");
  const [clientFilter, setClientFilter] = useState(null);
  const [clientSubNav, setClientSubNav] = useState("issues");
  const [goals, setGoals]               = useState(INIT_GOALS);
  const [tasks, setTasks]               = useState(INIT_TASKS);
  const [routines, setRoutines]         = useState(INIT_ROUTINES);
  const [seoPages, setSeoPages]         = useState(INIT_SEO_PAGES);
  const [retainers, setRetainers]       = useState(INIT_RETAINERS);
  const [timer, setTimer]               = useState(() => {
    try { return JSON.parse(localStorage.getItem("focus-timer") || "null") || { taskId: null, startTime: null }; }
    catch { return { taskId: null, startTime: null }; }
  });
  const [timeLog, setTimeLog]           = useState(() => {
    try { return JSON.parse(localStorage.getItem("focus-timelog") || "[]"); }
    catch { return []; }
  });
  const [openGoalId, setOpenGoalId]     = useState(null);
  const [openTaskId, setOpenTaskId]     = useState(null);
  const [panelWidth, setPanelWidth]     = useState(360);
  const [adding, setAdding]             = useState(false);
  const [ownOpen, setOwnOpen]           = useState(true);
  const [clientsOpen, setClientsOpen]   = useState(true);
  const [search, setSearch]             = useState("");
  const [newTitle, setNewTitle]         = useState("");
  const [newGoalId, setNewGoalId]       = useState("");
  const [newArea, setNewArea]           = useState("admin");
  const [newClient, setNewClient]       = useState("");
  const [newDue, setNewDue]             = useState("");
  const [selectedIds, setSelectedIds]   = useState([]);
  const [bulkDate, setBulkDate]         = useState("");

  const toggleSelect = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const clearSelection = () => setSelectedIds([]);
  const bulkDelete = () => { setTasks((p) => p.filter((t) => !selectedIds.includes(t.id))); setOpenTaskId(null); setSelectedIds([]); };
  const bulkSetDue = (date) => { setTasks((p) => p.map((t) => selectedIds.includes(t.id) ? { ...t, due: date } : t)); setSelectedIds([]); };

  const urgentCount = tasks.filter((t) => t.flag && t.status !== "done").length;

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks((p) => [...p, { id: Date.now(), title: newTitle.trim(), goalId: newGoalId ? Number(newGoalId) : null, area: newArea, flag: null, priority: null, client: newClient, status: "todo", due: newDue, notes: "", log: [], subtasks: [], snoozedUntil: null }]);
    setNewTitle(""); setNewGoalId(""); setNewArea("admin"); setNewClient(""); setNewDue("");
    setAdding(false);
  };

  const STATUS_CYCLE = ["todo", "in-progress", "waiting", "done"];

  const handleStatusChange = (id, newStatus, currentStatus) => {
    // Auto-start timer when going to in-progress
    if (newStatus === "in-progress" && currentStatus !== "in-progress") {
      const t = { taskId: id, startTime: Date.now() };
      setTimer(t);
      localStorage.setItem("focus-timer", JSON.stringify(t));
    }
    // Auto-stop timer when leaving in-progress (and this task had the timer)
    if (currentStatus === "in-progress" && newStatus !== "in-progress") {
      setTimer((prev) => {
        if (prev.taskId !== id) return prev;
        const elapsed = Math.round((Date.now() - prev.startTime) / 1000 / 60);
        const h = Math.floor(elapsed / 60), m = elapsed % 60;
        const label = h > 0 ? `⏱ ${h}t ${m}m` : `⏱ ${m}m`;
        setTasks((p) => p.map((t) => t.id === id ? { ...t, log: [{ id: Date.now(), text: label, attachments: [], date: nowISO() }, ...t.log] } : t));
        const cleared = { taskId: null, startTime: null };
        localStorage.setItem("focus-timer", JSON.stringify(cleared));
        return cleared;
      });
    }
    setTasks((p) => p.map((t) => t.id === id ? { ...t, status: newStatus } : t));
  };

  const toggleTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status || "todo") + 1) % STATUS_CYCLE.length];
    handleStatusChange(id, next, task.status);
  };

  const setTaskStatus = (id, status) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    handleStatusChange(id, status, task.status);
  };

  const updateTask = (id, changes) =>
    setTasks((p) => p.map((t) => t.id === id ? { ...t, ...changes } : t));

  const addTaskLog = (id, text, attachments = []) => {
    if (!text.trim() && attachments.length === 0) return;
    setTasks((p) => p.map((t) => t.id === id ? { ...t, log: [{ id: Date.now(), text: text.trim(), attachments, date: nowISO() }, ...t.log] } : t));
  };

  const updateTaskLogEntry = (taskId, logId, newText) =>
    setTasks((p) => p.map((t) => t.id === taskId ? { ...t, log: t.log.map((l) => l.id === logId ? { ...l, text: newText } : l) } : t));

  const updateGoalLogEntry = (goalId, logId, newText) =>
    setGoals((p) => p.map((g) => g.id === goalId ? { ...g, log: g.log.map((l) => l.id === logId ? { ...l, text: newText } : l) } : g));

  const deleteTask = (id) => { setTasks((p) => p.filter((t) => t.id !== id)); setOpenTaskId(null); };

  const snoozeTask = (id, days) => {
    if (days === 0) { updateTask(id, { snoozedUntil: null }); return; }
    const until = new Date();
    until.setDate(until.getDate() + days);
    updateTask(id, { snoozedUntil: until.toISOString().slice(0, 10) });
  };

  const updateRetainer = (id, changes) =>
    setRetainers((p) => p.map((r) => r.id === id ? { ...r, ...changes } : r));

  const addExpense = (id, expense) =>
    setRetainers((p) => p.map((r) => r.id === id ? { ...r, expenses: [{ id: Date.now(), ...expense }, ...(r.expenses || [])] } : r));

  const deleteExpense = (retainerId, expenseId) =>
    setRetainers((p) => p.map((r) => r.id === retainerId ? { ...r, expenses: r.expenses.filter((e) => e.id !== expenseId) } : r));

  const startTimer = (taskId) => {
    const t = { taskId, startTime: Date.now() };
    setTimer(t);
    localStorage.setItem("focus-timer", JSON.stringify(t));
  };

  const stopTimer = () => {
    if (!timer.taskId || !timer.startTime) return;
    const elapsed = Math.round((Date.now() - timer.startTime) / 1000 / 60); // minutes
    const h = Math.floor(elapsed / 60), m = elapsed % 60;
    const label = h > 0 ? `⏱ ${h}t ${m}m` : `⏱ ${m}m`;
    addTaskLog(timer.taskId, label);
    // Save structured time entry
    const task = tasks.find((t) => t.id === timer.taskId);
    if (task && elapsed > 0) {
      const entry = {
        id: Date.now(), taskId: timer.taskId, taskTitle: task.title,
        client: task.client || "", area: task.area,
        minutes: elapsed, date: new Date().toISOString().slice(0, 10), type: "human"
      };
      const updated = [entry, ...timeLog];
      setTimeLog(updated);
      localStorage.setItem("focus-timelog", JSON.stringify(updated));
    }
    const cleared = { taskId: null, startTime: null };
    setTimer(cleared);
    localStorage.setItem("focus-timer", JSON.stringify(cleared));
  };

  const addGoalLog = (gid, text) => {
    if (!text.trim()) return;
    setGoals((p) => p.map((g) => g.id === gid ? { ...g, log: [{ id: Date.now(), text: text.trim(), date: nowISO() }, ...g.log] } : g));
  };

  const updateGoalField = (gid, field, val) =>
    setGoals((p) => p.map((g) => g.id === gid ? { ...g, [field]: val } : g));

  const markRoutineDone = (id) =>
    setRoutines((p) => p.map((r) => r.id === id ? { ...r, lastDone: new Date().toISOString().slice(0, 10), streak: r.streak + 1 } : r));

  const updateSeoPage = (id, field, val) =>
    setSeoPages((p) => p.map((s) => s.id === id ? { ...s, [field]: val, updatedAt: new Date().toISOString().slice(0, 10) } : s));

  const addSeoPageEntry = (id, type, data) =>
    setSeoPages((p) => p.map((s) => s.id === id ? { ...s, [type]: [{ id: Date.now(), ...data }, ...s[type]], updatedAt: new Date().toISOString().slice(0, 10) } : s));

  const addSeoPage = (client) => {
    const url = prompt("URL (fx cardirect.dk/brugte-biler/):");
    if (!url) return;
    const keyword = prompt("Målord (fx 'brugte biler'):");
    setSeoPages((p) => [...p, { id: Date.now(), client, url: url.trim(), keyword: keyword?.trim() || "", positionHistory: [], changeLog: [], notes: "", updatedAt: new Date().toISOString().slice(0, 10) }]);
  };

  const openGoal = goals.find((g) => g.id === openGoalId);
  const openTask = tasks.find((t) => t.id === openTaskId);

  const navItems = [
    { key: "kalender", label: "Kalender", icon: "📅" },
    { key: "issues",   label: "Issues",   icon: "🔥", badge: urgentCount || null },
    { key: "maal",     label: "Mål",      icon: "◎" },
    { key: "opgaver",  label: "Alle opgaver",  icon: "☐" },
    { key: "rutiner",  label: "Rutiner",  icon: "↻" },
    { key: "retainer", label: "Retainer", icon: "💰" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", background: BG, color: "#1e1f21", overflow: "hidden" }}>

      {/* ── TIMER FLOATING ── */}
      {timer.taskId && (
        <div onClick={() => setOpenTaskId(timer.taskId)} style={{ position: "fixed", top: 14, right: 20, zIndex: 1000, display: "flex", alignItems: "center", gap: 6, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "6px 10px", cursor: "pointer", boxShadow: "0 2px 10px #f9731620" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 0 2px #fed7aa" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#c2410c" }}>TIMER</span>
          <TimerDisplay startTime={timer.startTime} />
          <button onClick={(e) => { e.stopPropagation(); stopTimer(); }} style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: "#fff", background: "#f97316", border: "none", borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}>Stop</button>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{ width: SIDEBAR_W, flexShrink: 0, background: "#fff", borderRight: "1px solid #e3e6ea", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 10 }}>
        <div style={{ padding: "20px 16px 14px" }}>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.3px", color: "#1e1f21" }}>Focus</span>
        </div>
        <div style={{ padding: "0 12px 8px" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#b8bfcc", pointerEvents: "none" }}>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg..."
              style={{ width: "100%", border: "1px solid #e3e6ea", borderRadius: 6, padding: "6px 8px 6px 26px", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#f8f9fb", boxSizing: "border-box", color: "#1e293b" }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#b8bfcc", lineHeight: 1, padding: 0 }}>×</button>}
          </div>
        </div>
        <div style={{ padding: "0 8px 8px" }}>
          {navItems.map(({ key, label, icon, badge }) => (
            <SidebarItem key={key} icon={icon} label={label} badge={badge}
              active={nav === key && !clientFilter && !openGoalId}
              onClick={() => { setNav(key); setClientFilter(null); setOpenGoalId(null); setOpenTaskId(null); }} />
          ))}
        </div>
        <div style={{ padding: "0 8px 8px", flex: 1, overflowY: "auto" }}>
          <SidebarSection label="MINE FIRMAER" open={ownOpen} onToggle={() => setOwnOpen((v) => !v)}>
            {OWN_COMPANIES.map((c) => {
              const goal = goals.find((g) => g.client === c);
              const color = goal?.color || "#6366f1";
              return (
                <SidebarItem key={c}
                  icon={<span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />}
                  label={c}
                  active={clientFilter === c && !openGoalId}
                  onClick={() => { setClientFilter(c); setClientSubNav("issues"); setOpenGoalId(null); setOpenTaskId(null); }} />
              );
            })}
          </SidebarSection>
          <SidebarSection label="KUNDER" open={clientsOpen} onToggle={() => setClientsOpen((v) => !v)}>
            {CLIENTS.map((c) => {
              const goal = goals.find((g) => g.client === c);
              const color = goal?.color || "#94a3b8";
              const clientUrgent = tasks.filter((t) => t.client === c && t.flag && t.status !== "done").length;
              return (
                <SidebarItem key={c}
                  icon={<span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />}
                  label={c} badge={clientUrgent || null} badgeColor="#f97316"
                  active={clientFilter === c && !openGoalId}
                  onClick={() => { setClientFilter(c); setClientSubNav("issues"); setOpenGoalId(null); setOpenTaskId(null); }} />
              );
            })}
          </SidebarSection>
        </div>
        <div style={{ padding: "12px 8px 16px", borderTop: "1px solid #f5f1eb" }}>
          <button onClick={() => setAdding(true)}
            style={{ width: "100%", background: "none", border: "1px dashed #d4cfc9", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#94a3b8", textAlign: "left" }}>
            + Ny opgave
          </button>
        </div>
      </aside>

      {/* ── MAIN + PANEL wrapper ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Main scroll area */}
        <div style={{ flex: 1, overflow: "auto" }}>

          {adding && (
            <AddModal goals={goals} newTitle={newTitle} setNewTitle={setNewTitle} newGoalId={newGoalId} setNewGoalId={setNewGoalId} newArea={newArea} setNewArea={setNewArea} newClient={newClient} setNewClient={setNewClient} newDue={newDue} setNewDue={setNewDue} onAdd={addTask} onClose={() => setAdding(false)} clientFilter={clientFilter} />
          )}

          {search.trim() ? (
            <SearchResults tasks={tasks} query={search} onToggle={toggleTask} onOpenTask={setOpenTaskId} openTaskId={openTaskId} onSetStatus={setTaskStatus} />
          ) : openGoalId && openGoal ? (
            <GoalDetail goal={openGoal} tasks={tasks.filter((t) => t.goalId === openGoalId)} onBack={() => { setOpenGoalId(null); setOpenTaskId(null); }} onAddLog={(t) => addGoalLog(openGoalId, t)} onToggleTask={toggleTask} onUpdateField={(f, v) => updateGoalField(openGoalId, f, v)} onOpenTask={setOpenTaskId} openTaskId={openTaskId} />
          ) : clientFilter ? (
            <ClientView
              client={clientFilter} subNav={clientSubNav} setSubNav={setClientSubNav}
              tasks={tasks.filter((t) => t.client === clientFilter)}
              goals={goals.filter((g) => g.client === clientFilter)} allGoals={goals}
              routines={routines}
              seoPages={seoPages.filter((s) => s.client === clientFilter)}
              onToggle={toggleTask} onOpenGoal={(id) => { setOpenGoalId(id); setOpenTaskId(null); }}
              onOpenTask={setOpenTaskId} openTaskId={openTaskId}
              onMarkRoutineDone={markRoutineDone} onUpdateSeoPage={updateSeoPage} onAddSeoPageEntry={addSeoPageEntry}
              onAddSeoPage={() => addSeoPage(clientFilter)}
              onAddTask={() => { setNewClient(clientFilter); setAdding(true); }}
              onSetStatus={setTaskStatus}
              clientColor={goals.find((g) => g.client === clientFilter)?.color || "#94a3b8"}
              timeLog={timeLog.filter((e) => e.client === clientFilter)}
              allTasks={tasks}
              onEditTaskLog={updateTaskLogEntry}
              onEditGoalLog={updateGoalLogEntry}
            />
          ) : (
            <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", padding: "40px 36px" }}>
              {nav === "kalender" && <CalendarView tasks={tasks} goals={goals} onToggle={toggleTask} onOpenTask={setOpenTaskId} openTaskId={openTaskId} onSnooze={snoozeTask} />}
              {nav === "issues"  && <IssuesView tasks={tasks} onToggle={toggleTask} onAdd={() => setAdding(true)} onOpenTask={setOpenTaskId} openTaskId={openTaskId} selectedIds={selectedIds} onSelect={toggleSelect} />}
              {nav === "maal"    && (
                <div>
                  <PageHeader title="Mål" subtitle="Klik for at åbne roadmap, log og tilknyttede opgaver." />
                  {goals.map((g) => {
                    const gt = tasks.filter((t) => t.goalId === g.id);
                    const done = gt.filter((t) => t.status === "done").length;
                    return <GoalRow key={g.id} goal={g} taskCount={gt.length} doneTasks={done} onClick={() => setOpenGoalId(g.id)} />;
                  })}
                </div>
              )}
              {nav === "opgaver" && <TasksView tasks={tasks} goals={goals} onToggle={toggleTask} onOpenGoal={(id) => setOpenGoalId(id)} onOpenTask={setOpenTaskId} openTaskId={openTaskId} clientFilter={null} onSetStatus={setTaskStatus} onSnooze={snoozeTask} selectedIds={selectedIds} onSelect={toggleSelect} />}
              {nav === "rutiner" && (
                <div>
                  <PageHeader title="Rutiner" subtitle="Tilbagevendende opgaver." />
                  {routines.map((r) => <RoutineRow key={r.id} routine={r} onDone={() => markRoutineDone(r.id)} />)}
                </div>
              )}
              {nav === "retainer" && (
                <RetainerView retainers={retainers} tasks={tasks} onUpdate={updateRetainer} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />
              )}
            </div>
          )}
        </div>

        {/* ── BULK ACTION TOOLBAR ── */}
        {selectedIds.length > 0 && (
          <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "#1e1f21", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, minWidth: 380 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginRight: 4 }}>{selectedIds.length} valgt</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)}
                style={{ border: "1px solid #374151", borderRadius: 7, padding: "5px 9px", fontSize: 12, background: "#374151", color: "#fff", fontFamily: "inherit", outline: "none", cursor: "pointer" }} />
              <button onClick={() => { if (bulkDate) { bulkSetDue(bulkDate); setBulkDate(""); } }}
                disabled={!bulkDate}
                style={{ background: bulkDate ? "#6366f1" : "#374151", color: "#fff", border: "none", borderRadius: 7, padding: "6px 13px", fontSize: 12, fontWeight: 600, cursor: bulkDate ? "pointer" : "default", fontFamily: "inherit" }}>
                Sæt dato
              </button>
            </div>
            <div style={{ width: 1, height: 20, background: "#374151" }} />
            <button onClick={bulkDelete}
              style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 7, padding: "6px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Slet {selectedIds.length}
            </button>
            <button onClick={clearSelection}
              style={{ background: "none", color: "#9ca3af", border: "none", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
              ×
            </button>
          </div>
        )}

        {/* ── TASK PANEL (slides in from right, resizable) ── */}
        {openTask && (
          <TaskPanel
            task={openTask} goals={goals}
            width={panelWidth} onResize={setPanelWidth}
            onSave={(changes) => updateTask(openTaskId, changes)}
            onAddLog={(text, attachments) => addTaskLog(openTaskId, text, attachments)}
            onAddSubtask={(sub) => updateTask(openTaskId, { subtasks: [{ id: Date.now(), title: sub, status: "todo" }, ...(openTask.subtasks || [])] })}
            onToggleSubtask={(sid) => updateTask(openTaskId, { subtasks: (openTask.subtasks || []).map((s) => s.id === sid ? { ...s, status: s.status === "done" ? "todo" : "done" } : s) })}
            onToggle={() => toggleTask(openTaskId)}
            onSetStatus={(s) => setTaskStatus(openTaskId, s)}
            onDelete={() => deleteTask(openTaskId)}
            onSnooze={(days) => snoozeTask(openTaskId, days)}
            onClose={() => setOpenTaskId(null)}
            timer={timer}
            onStartTimer={() => startTimer(openTaskId)}
            onStopTimer={stopTimer}
          />
        )}
      </div>
    </div>
  );
}

// ─── TASK PANEL ───────────────────────────────────────────────────────────────

function TaskPanel({ task: t, goals, width, onResize, onSave, onAddLog, onAddSubtask, onToggleSubtask, onToggle, onSetStatus, onDelete, onSnooze, onClose, timer, onStartTimer, onStopTimer }) {
  const [title, setTitle]       = useState(t.title);
  const [area, setArea]         = useState(t.area);
  const [flag, setFlag]         = useState(t.flag || "");

  const [client, setClient]     = useState(t.client);
  const [goalId, setGoalId]     = useState(t.goalId || "");
  const [due, setDue]           = useState(t.due || "");
  const [notes, setNotes]       = useState(t.notes || "");
  const [subInput, setSubInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty]       = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const dragging = { current: false, startX: 0, startW: 0 };

  const areaColor = FLAGS[flag]?.color || AREAS[area]?.color || "#94a3b8";
  const done = t.status === "done";
  const subtasks = t.subtasks || [];

  const set = (fn) => (val) => { fn(val); setDirty(true); };
  const save = () => { onSave({ title: title.trim() || t.title, area, flag: flag || null, client, goalId: goalId ? Number(goalId) : null, due, notes }); setDirty(false); };
  const handleSub = () => { if (!subInput.trim()) return; onAddSubtask(subInput.trim()); setSubInput(""); };

  const onDragStart = (e) => {
    dragging.current = true;
    dragging.startX = e.clientX;
    dragging.startW = width;
    const onMove = (ev) => {
      if (!dragging.current) return;
      const delta = dragging.startX - ev.clientX;
      onResize(Math.min(PANEL_MAX, Math.max(PANEL_MIN, dragging.startW + delta)));
    };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const panelContent = (
    <>
      {/* Colored top stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${areaColor}, ${areaColor}88)`, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "10px 12px 10px 18px", borderBottom: "1px solid #eaecf0", display: "flex", alignItems: "center", gap: 6, background: "#fdfcfb" }}>
        <button onClick={onToggle}
          style={{ width: 20, height: 20, borderRadius: "50%", border: done ? "none" : `2px solid ${areaColor}`, background: done ? areaColor : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
          {done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
        </button>
        {flag && (
          <span style={{ fontSize: 10, color: FLAGS[flag].color, background: FLAGS[flag].color + "15", borderRadius: 100, padding: "3px 9px", fontWeight: 700, letterSpacing: "0.3px", border: `1px solid ${FLAGS[flag].color}30` }}>
            {FLAGS[flag].label}
          </span>
        )}
        <div style={{ flex: 1 }} />

        {/* Timer button */}
        {(() => {
          const isRunning = timer?.taskId === t.id;
          return (
            <button onClick={isRunning ? onStopTimer : onStartTimer} title={isRunning ? "Stop timer" : "Start timer"}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 7, fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s", border: isRunning ? "1.5px solid #fed7aa" : "1.5px solid #e3e6ea", background: isRunning ? "#fff7ed" : "#f8f9fb", color: isRunning ? "#c2410c" : "#64748b" }}>
              <span style={{ fontSize: 12 }}>{isRunning ? "⏹" : "▶"}</span>
              {isRunning && timer.startTime ? <TimerDisplay startTime={timer.startTime} /> : <span>{isRunning ? "Stop" : "Timer"}</span>}
            </button>
          );
        })()}

        {/* Afslut */}
        {t.status !== "done" && (
          <button onClick={() => onSetStatus("done")} title="Afslut opgave"
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 7, fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s", border: "1.5px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dcfce7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}>
            <span>✓</span><span>Afslut</span>
          </button>
        )}

        {/* Slet */}
        {confirmDelete ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={onDelete}
              style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 7, fontFamily: "inherit", cursor: "pointer", border: "none", background: "#ef4444", color: "#fff" }}>
              Bekræft
            </button>
            <button onClick={() => setConfirmDelete(false)}
              style={{ fontSize: 11, padding: "5px 8px", borderRadius: 7, fontFamily: "inherit", cursor: "pointer", border: "1.5px solid #e3e6ea", background: "#fff", color: "#64748b" }}>
              Nej
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} title="Slet opgave"
            style={{ fontSize: 15, padding: "4px 7px", borderRadius: 7, fontFamily: "inherit", cursor: "pointer", border: "1.5px solid transparent", background: "none", color: "#d1d5db", lineHeight: 1, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.background = "#fef2f2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#d1d5db"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "none"; }}>
            🗑
          </button>
        )}

        <div style={{ width: 1, height: 16, background: "#e3e6ea", margin: "0 2px" }} />

        <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? "Skjul som panel" : "Åbn fuldt"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#b8bfcc", lineHeight: 1, padding: "2px 4px", borderRadius: 4, transition: "color 0.15s" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#64748b"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#b8bfcc"}>
          {fullscreen ? "⊟" : "⛶"}
        </button>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#b8bfcc", lineHeight: 1, padding: "0 2px", borderRadius: 4, transition: "color 0.15s" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#64748b"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#b8bfcc"}>×</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Title */}
        <div style={{ padding: "18px 20px 4px" }}>
          <textarea value={title} onChange={(e) => set(setTitle)(e.target.value)} rows={2}
            style={{ width: "100%", border: "none", resize: "none", fontSize: 22, fontWeight: 800, fontFamily: "inherit", color: done ? "#b8bfcc" : "#1e293b", outline: "none", background: "transparent", letterSpacing: "-0.4px", lineHeight: 1.35, boxSizing: "border-box", textDecoration: done ? "line-through" : "none" }} />
        </div>

        {/* Properties — Linear-style */}
        <div style={{ borderBottom: "1px solid #eaecf0", paddingTop: 4, paddingBottom: 4 }}>

          {/* Status row */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "7px 20px", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, width: 90, flexShrink: 0, userSelect: "none" }}>Status</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: STATUSES[t.status]?.color + "15", color: STATUSES[t.status]?.color, border: `1px solid ${STATUSES[t.status]?.color}30`, borderRadius: 100, padding: "3px 10px 3px 8px", fontSize: 12, fontWeight: 600, userSelect: "none" }}>
              {STATUSES[t.status]?.icon} {STATUSES[t.status]?.label}
            </span>
            <span style={{ marginLeft: 5, fontSize: 10, color: "#b8bfcc", userSelect: "none" }}>▾</span>
            <select value={t.status} onChange={(e) => { onSetStatus(e.target.value); }}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", fontSize: 16 }}>
              {Object.entries(STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </div>

          {/* Service */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "7px 20px", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, width: 90, flexShrink: 0, userSelect: "none" }}>Service</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: AREAS[area]?.color || "#1e293b", userSelect: "none" }}>{AREAS[area]?.label}</span>
            <span style={{ fontSize: 10, color: "#b8bfcc", userSelect: "none" }}>▾</span>
            <select value={area} onChange={(e) => set(setArea)(e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", fontSize: 16 }}>
              {Object.entries(AREAS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>

          {/* Flag */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "7px 20px", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, width: 90, flexShrink: 0, userSelect: "none" }}>Flag</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: flag ? (FLAGS[flag]?.color || "#1e293b") : "#b8bfcc", userSelect: "none" }}>{flag ? FLAGS[flag]?.label : "— Ingen"}</span>
            <span style={{ fontSize: 10, color: "#b8bfcc", userSelect: "none" }}>▾</span>
            <select value={flag} onChange={(e) => set(setFlag)(e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", fontSize: 16 }}>
              <option value="">— Ingen</option>
              <option value="issue">🔥 Issue</option>
              <option value="request">📩 Client Request</option>
            </select>
          </div>

          {/* Klient */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "7px 20px", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, width: 90, flexShrink: 0, userSelect: "none" }}>Klient</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: client ? "#1e293b" : "#b8bfcc", userSelect: "none" }}>{client || "— Ingen"}</span>
            <span style={{ fontSize: 10, color: "#b8bfcc", userSelect: "none" }}>▾</span>
            <select value={client} onChange={(e) => set(setClient)(e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", fontSize: 16 }}>
              <option value="">— Ingen</option>
              {ALL_WORKSPACES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Mål */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "7px 20px", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, width: 90, flexShrink: 0, userSelect: "none" }}>Mål</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: goalId ? "#1e293b" : "#b8bfcc", userSelect: "none" }}>
              {goalId ? (goals.find(g => g.id === Number(goalId))?.title || "—") : "— Ad hoc"}
            </span>
            <span style={{ fontSize: 10, color: "#b8bfcc", userSelect: "none" }}>▾</span>
            <select value={goalId} onChange={(e) => set(setGoalId)(e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", fontSize: 16 }}>
              <option value="">— Ad hoc</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.title}</option>)}
            </select>
          </div>

          {/* Deadline */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "7px 20px", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, width: 90, flexShrink: 0, userSelect: "none" }}>Deadline</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: due ? "#1e293b" : "#b8bfcc", userSelect: "none" }}>{due || "— Ingen dato"}</span>
            <span style={{ fontSize: 10, color: "#b8bfcc", userSelect: "none" }}>▾</span>
            <input type="date" value={due} onChange={(e) => set(setDue)(e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
          </div>

        </div>

        {/* Notes */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #eaecf0" }}>
          <label style={{ ...LABEL, marginBottom: 8 }}>NOTER</label>
          <textarea value={notes}
            onChange={(e) => { set(setNotes)(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 320) + "px"; }}
            placeholder="Context, links, observationer..."
            ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 320) + "px"; } }}
            style={{ width: "100%", border: "1.5px solid #e3e6ea", borderRadius: 9, padding: "10px 12px", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none", lineHeight: 1.65, minHeight: 80, boxSizing: "border-box", background: "#f8f9fb", color: "#374151", transition: "border-color 0.15s", overflow: "hidden" }}
            onFocus={(e) => e.target.style.borderColor = areaColor + "80"}
            onBlur={(e) => e.target.style.borderColor = "#e3e6ea"} />
        </div>

        {/* Save */}
        <div style={{ padding: "12px 20px 14px", borderBottom: "1px solid #eaecf0" }}>
          <button onClick={save} disabled={!dirty}
            style={{
              width: "100%", border: "none", borderRadius: 9, padding: "10px", fontSize: 12, fontWeight: 700,
              cursor: dirty ? "pointer" : "default", fontFamily: "inherit", transition: "all 0.2s",
              background: dirty ? `linear-gradient(135deg, ${areaColor}, ${areaColor}cc)` : "#eaecf0",
              color: dirty ? "#fff" : "#b8b0a8",
              boxShadow: dirty ? `0 2px 10px ${areaColor}40` : "none"
            }}>
            {dirty ? "💾 Gem ændringer" : "Ingen ændringer"}
          </button>
        </div>

        {/* Subtasks */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaecf0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "#7f8c9a", letterSpacing: "0.7px", display: "flex", alignItems: "center", gap: 6 }}>
            DELOPGAVER
            {subtasks.length > 0 && (
              <span style={{ fontSize: 10, background: "#eaecf0", borderRadius: 100, padding: "1px 7px", color: "#9ca3af", fontWeight: 600 }}>
                {subtasks.filter(s => s.status === "done").length}/{subtasks.length}
              </span>
            )}
          </p>
          <div style={{ display: "flex", gap: 6, marginBottom: subtasks.length ? 10 : 0 }}>
            <input value={subInput} onChange={(e) => setSubInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSub()}
              placeholder="Tilføj delopgave..."
              style={{ flex: 1, border: "1.5px solid #e3e6ea", borderRadius: 8, padding: "8px 11px", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#f8f9fb", color: "#374151", transition: "border-color 0.15s" }}
              onFocus={(e) => e.target.style.borderColor = areaColor + "80"}
              onBlur={(e) => e.target.style.borderColor = "#e3e6ea"} />
            <button onClick={handleSub}
              style={{ background: areaColor, color: "#fff", border: "none", borderRadius: 8, width: 34, fontSize: 18, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${areaColor}40` }}>+</button>
          </div>
          {subtasks.map((s) => (
            <div key={s.id}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 7, transition: "background 0.1s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fb"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <button onClick={() => onToggleSubtask(s.id)}
                style={{ width: 16, height: 16, borderRadius: 4, border: s.status === "done" ? "none" : "1.5px solid #d0ccc8", background: s.status === "done" ? areaColor : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {s.status === "done" && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>}
              </button>
              <span style={{ fontSize: 12, color: s.status === "done" ? "#b8bfcc" : "#374151", textDecoration: s.status === "done" ? "line-through" : "none", flex: 1, lineHeight: 1.4 }}>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Activity log */}
        <div style={{ padding: "16px 20px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "#7f8c9a", letterSpacing: "0.7px" }}>AKTIVITETSLOG</p>
          <LogInput areaColor={areaColor} onSubmit={onAddLog} />
          {t.log.length === 0 ? (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#b8bfcc", textAlign: "center", padding: "12px 0" }}>Ingen aktivitet endnu.</p>
          ) : t.log.map((entry, i) => (
            <div key={entry.id} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.attachments?.length ? "#8b5cf6" : areaColor, boxShadow: `0 0 0 2px ${entry.attachments?.length ? "#8b5cf620" : areaColor + "20"}` }} />
                {i < t.log.length - 1 && <div style={{ width: 1, flex: 1, background: "#e3e6ea", margin: "4px 0", minHeight: 16 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 14 }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, color: "#b8b0a8", fontWeight: 500 }}>{fmtTime(entry.date)}</p>
                {entry.text && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#374151", lineHeight: 1.55 }}>{entry.text}</p>}
                {entry.attachments?.map((att) => (
                  <div key={att.id} style={{ marginBottom: 6 }}>
                    {att.type.startsWith("image/") ? (
                      <img src={att.dataUrl} alt={att.name}
                        style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #e3e6ea", display: "block", cursor: "pointer" }}
                        onClick={() => window.open(att.dataUrl, "_blank")} />
                    ) : (
                      <a href={att.dataUrl} download={att.name}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6366f1", background: "#eef2ff", borderRadius: 6, padding: "5px 10px", textDecoration: "none", fontWeight: 600, border: "1px solid #e0e7ff" }}>
                        <span>📎</span>{att.name}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  if (fullscreen) {
    return (
      <>
        {/* Backdrop */}
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 900 }} />
        {/* Modal */}
        <div style={{ position: "fixed", top: "5vh", left: "50%", transform: "translateX(-50%)", width: "min(860px, 94vw)", height: "90vh", background: "#fff", borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", zIndex: 901, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {panelContent}
        </div>
      </>
    );
  }

  return (
    <div style={{ width, flexShrink: 0, borderLeft: "1px solid #e8e3dc", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "-6px 0 24px rgba(0,0,0,0.06)", position: "relative" }}>
      {/* Drag handle */}
      <div onMouseDown={onDragStart}
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", zIndex: 10, background: "transparent" }}
        onMouseEnter={(e) => e.currentTarget.style.background = areaColor + "50"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} />
      {panelContent}
    </div>
  );
}

// ─── SNOOZE CONTROL ──────────────────────────────────────────────────────────

function SnoozeButton({ taskId, onSnooze }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ fontSize: 11, color: "#9ca3af", border: "1px solid #e8e3dc", borderRadius: 5, padding: "2px 8px", cursor: "pointer", background: "#fff", fontFamily: "inherit" }}>
        💤
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "#fff", border: "1px solid #e8e3dc", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 300, padding: 4, minWidth: 110 }}>
          {[["I morgen", 1], ["3 dage", 3], ["1 uge", 7], ["2 uger", 14]].map(([label, days]) => (
            <button key={days} onClick={(e) => { e.stopPropagation(); onSnooze(taskId, days); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", fontSize: 12, border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", borderRadius: 5, color: "#1e1f21" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f7f3ef"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SnoozeControl({ snoozedUntil, onSnooze }) {
  const [showPicker, setShowPicker] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const handleCustom = () => {
    if (!customDate) return;
    const days = Math.ceil((new Date(customDate) - Date.now()) / 86400000);
    if (days > 0) { onSnooze(days); setShowPicker(false); setCustomDate(""); }
  };

  const today = new Date().toISOString().slice(0, 10);

  if (snoozedUntil) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#fef9c3", borderRadius: 8, border: "1px solid #fde68a" }}>
        <span style={{ fontSize: 14 }}>💤</span>
        <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600, flex: 1 }}>Snoozet til {fmtDate(snoozedUntil)}</span>
        <button onClick={() => onSnooze(0)}
          style={{ fontSize: 11, fontWeight: 700, color: "#92400e", background: "none", border: "1px solid #fbbf24", borderRadius: 5, padding: "3px 9px", cursor: "pointer", fontFamily: "inherit" }}>
          Aktiver nu
        </button>
      </div>
    );
  }

  return (
    <div>
      <label style={LABEL}>UDSÆT</label>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        {[[1, "I morgen"], [3, "3 dage"], [7, "1 uge"]].map(([days, label]) => (
          <button key={days} onClick={() => onSnooze(days)}
            style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: "5px 12px", border: "1px solid #e3e6ea", cursor: "pointer", fontFamily: "inherit", background: "#fff", color: "#5e6470" }}>
            💤 {label}
          </button>
        ))}
        <button onClick={() => setShowPicker(!showPicker)}
          style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: "5px 12px", border: "1px solid #e3e6ea", cursor: "pointer", fontFamily: "inherit", background: showPicker ? "#f5f1eb" : "#fff", color: "#5e6470" }}>
          📅 Vælg dato
        </button>
      </div>
      {showPicker && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
          <input type="date" value={customDate} min={today} onChange={(e) => setCustomDate(e.target.value)}
            style={{ ...SELECT, fontSize: 12, flex: 1 }} />
          <button onClick={handleCustom} disabled={!customDate}
            style={{ background: customDate ? "#1e293b" : "#f5f1eb", color: customDate ? "#fff" : "#b8bfcc", border: "none", borderRadius: 7, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: customDate ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            Udsæt
          </button>
        </div>
      )}
    </div>
  );
}

// ─── LOG INPUT ────────────────────────────────────────────────────────────────

function LogInput({ areaColor, onSubmit }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState([]); // [{ id, name, type, dataUrl }]
  const fileRef = { current: null };

  const readFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ id: Date.now() + Math.random(), name: file.name, type: file.type, dataUrl: e.target.result });
    reader.readAsDataURL(file);
  });

  const handleFiles = async (files) => {
    const results = await Promise.all(Array.from(files).map(readFile));
    setPending((p) => [...p, ...results]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handlePaste = async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;
    e.preventDefault();
    const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
    await handleFiles(files);
  };

  const submit = () => {
    if (!text.trim() && pending.length === 0) return;
    onSubmit(text, pending);
    setText("");
    setPending([]);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Pending attachments preview */}
      {pending.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {pending.map((att) => (
            <div key={att.id} style={{ position: "relative", display: "inline-flex" }}>
              {att.type.startsWith("image/") ? (
                <img src={att.dataUrl} alt={att.name}
                  style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #e3e6ea" }} />
              ) : (
                <div style={{ fontSize: 11, color: "#6366f1", background: "#eef2ff", borderRadius: 6, padding: "6px 10px", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📎 {att.name}
                </div>
              )}
              <button onClick={() => setPending((p) => p.filter((a) => a.id !== att.id))}
                style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#1e293b", color: "#fff", border: "none", cursor: "pointer", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{ display: "flex", gap: 6 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()} onPaste={handlePaste}
          placeholder="Hvad skete der? Eller slip en fil her..."
          style={{ flex: 1, border: "1px solid #e3e6ea", borderRadius: 7, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#f8f9fb" }} />
        <input ref={(el) => { fileRef.current = el; }} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt"
          style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
        <button onClick={() => fileRef.current?.click()}
          title="Vedhæft fil"
          style={{ background: "#f5f1eb", color: "#5e6470", border: "none", borderRadius: 7, padding: "0 11px", fontSize: 14, cursor: "pointer" }}>
          📎
        </button>
        <button onClick={submit}
          style={{ background: areaColor, color: "#fff", border: "none", borderRadius: 7, padding: "0 12px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>↵</button>
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ───────────────────────────────────────────────────────────

function CalendarView({ tasks, goals, onToggle, onOpenTask, openTaskId, onSnooze }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayStart = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const diffDays = (iso) => {
    if (!iso) return Infinity;
    return Math.floor((dayStart(iso) - today) / 86400000);
  };

  const active = tasks.filter((t) => {
    if (t.status === "done") return false;
    if (t.snoozedUntil && dayStart(t.snoozedUntil) > today) return false;
    return true;
  });

  const overdue  = active.filter((t) => t.due && diffDays(t.due) < 0);
  const todayT   = active.filter((t) => t.due && diffDays(t.due) === 0);
  const next7    = active.filter((t) => t.due && diffDays(t.due) > 0 && diffDays(t.due) <= 7);
  const next30   = active.filter((t) => t.due && diffDays(t.due) > 7 && diffDays(t.due) <= 30);
  const noDue    = active.filter((t) => !t.due);
  const snoozed  = tasks.filter((t) => t.status !== "done" && t.snoozedUntil && dayStart(t.snoozedUntil) > today);

  const CalSection = ({ label, color, emoji, tasks: ts }) => {
    if (ts.length === 0) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "0 10px" }}>
          <span style={{ fontSize: 15 }}>{emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "0.2px" }}>{label}</span>
          <span style={{ fontSize: 11, color: "#b8bfcc", marginLeft: 4 }}>{ts.length} opgave{ts.length !== 1 ? "r" : ""}</span>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e3e6ea", overflow: "hidden" }}>
          {ts.map((t, i) => (
            <div key={t.id} style={{ borderTop: i > 0 ? "1px solid #f5f1eb" : "none" }}>
              <CalRow task={t} onToggle={onToggle} onOpen={onOpenTask} isOpen={openTaskId === t.id} onSnooze={onSnooze} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Kalender" subtitle="Opgaver sorteret efter deadline. Snooze det der ikke er aktuelt endnu." />
      {overdue.length > 0  && <CalSection label="OVERSKREDET" emoji="🚨" color="#ef4444" tasks={overdue.sort((a,b) => a.due < b.due ? -1 : 1)} />}
      <CalSection label="I DAG"              emoji="📌" color="#f97316" tasks={todayT} />
      <CalSection label="DE NÆSTE 7 DAGE"   emoji="📅" color="#4285f4" tasks={next7.sort((a,b) => a.due < b.due ? -1 : 1)} />
      <CalSection label="DE NÆSTE 30 DAGE"  emoji="🗓"  color="#10b981" tasks={next30.sort((a,b) => a.due < b.due ? -1 : 1)} />
      {noDue.length > 0    && <CalSection label="INGEN DEADLINE"       emoji="☐"  color="#7f8c9a" tasks={noDue} />}
      {snoozed.length > 0  && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "0 10px" }}>
            <span style={{ fontSize: 15 }}>💤</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7f8c9a", letterSpacing: "0.2px" }}>SNOOZET</span>
            <span style={{ fontSize: 11, color: "#b8bfcc", marginLeft: 4 }}>{snoozed.length} skjult</span>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e3e6ea", opacity: 0.6, overflow: "hidden" }}>
            {snoozed.map((t, i) => (
              <div key={t.id} style={{ borderTop: i > 0 ? "1px solid #f5f1eb" : "none" }}>
                <CalRow task={t} onToggle={onToggle} onOpen={onOpenTask} isOpen={openTaskId === t.id} onSnooze={onSnooze} snoozed />
              </div>
            ))}
          </div>
        </div>
      )}
      {active.length === 0 && snoozed.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#7f8c9a" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Intet på dagsordenen</p>
        </div>
      )}
    </div>
  );
}

function CalRow({ task: t, onToggle, onOpen, isOpen, onSnooze, snoozed }) {
  const [hover, setHover] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const area = AREAS[t.area];
  const due = fmtDue(t.due);

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setShowSnooze(false); }}
      style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, background: isOpen ? "#f5f1eb" : hover ? "#f8f9fb" : "transparent", transition: "background 0.1s" }}>
      <button onClick={() => onToggle(t.id)}
        style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${area?.color || "#b8bfcc"}`, background: "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }} />
      <span onClick={() => onOpen(t.id)}
        style={{ flex: 1, fontSize: 13, color: "#1e293b", cursor: "pointer", lineHeight: 1.4 }}>
        {t.title}
        {t.client && <span style={{ fontSize: 11, color: "#7f8c9a", marginLeft: 8 }}>{t.client}</span>}
      </span>
      {area && <span style={{ fontSize: 11, color: area.color, background: area.color + "15", borderRadius: 4, padding: "2px 7px", fontWeight: 600, flexShrink: 0 }}>{area.label}</span>}
      {snoozed && t.snoozedUntil && <span style={{ fontSize: 11, color: "#92400e", background: "#fef9c3", borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>💤 til {fmtDate(t.snoozedUntil)}</span>}
      {!snoozed && due && <span style={{ fontSize: 11, color: due.color, flexShrink: 0 }}>{due.label}</span>}
      {hover && !snoozed && (
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowSnooze(!showSnooze)}
            style={{ fontSize: 11, color: "#7f8c9a", border: "1px solid #e3e6ea", borderRadius: 5, padding: "3px 8px", cursor: "pointer", background: "#fff", fontFamily: "inherit", fontWeight: 600 }}>
            💤 Udsæt
          </button>
          {showSnooze && (
            <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "#fff", border: "1px solid #e3e6ea", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 100, padding: 4, minWidth: 120 }}>
              {[["I morgen", 1], ["3 dage", 3], ["1 uge", 7], ["2 uger", 14], ["1 måned", 30]].map(([label, days]) => (
                <button key={days} onClick={() => { onSnooze(t.id, days); setShowSnooze(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 12px", fontSize: 12, border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", borderRadius: 5, color: "#374151" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f1eb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {hover && snoozed && (
        <button onClick={() => onSnooze(t.id, 0)}
          style={{ fontSize: 11, color: "#10b981", border: "1px solid #d1fae5", borderRadius: 5, padding: "3px 8px", cursor: "pointer", background: "#f0fdf4", fontFamily: "inherit", fontWeight: 600 }}>
          Aktiver
        </button>
      )}
    </div>
  );
}

// ─── SIDEBAR ITEM ─────────────────────────────────────────────────────────────

function SidebarItem({ icon, label, badge, badgeColor, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px 6px 8px", border: "none", borderLeft: active ? "2px solid #1e1f21" : "2px solid transparent", borderRadius: 0, cursor: "pointer", fontFamily: "inherit", background: active ? "#f5f0e8" : "transparent", color: active ? "#1e1f21" : "#78716c", fontSize: 12.5, fontWeight: active ? 600 : 400, textAlign: "left", transition: "all 0.1s" }}>
      <span style={{ fontSize: typeof icon === "string" ? 12 : "inherit", width: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: active ? 1 : 0.7 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && <span style={{ background: badgeColor || "#ef4444", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 800, padding: "1px 5px", lineHeight: 1.7 }}>{badge}</span>}
    </button>
  );
}

// ─── BOARD VIEW ──────────────────────────────────────────────────────────────

function BoardView({ tasks, onOpenTask, openTaskId, onSetStatus }) {
  const cols = Object.entries(STATUSES);
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }}>
      {cols.map(([key, s]) => {
        const col = tasks.filter((t) => (t.status || "todo") === key);
        return (
          <div key={key} style={{ minWidth: 220, flex: "0 0 220px", background: "#f5f1eb", borderRadius: 10, padding: "10px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "0 4px" }}>
              <span style={{ fontSize: 13 }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: "#b8bfcc", marginLeft: "auto" }}>{col.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {col.map((t) => {
                const area = AREAS[t.area];
                const flag = FLAGS[t.flag];
                const due = fmtDue(t.due);
                return (
                  <div key={t.id} onClick={() => onOpenTask(t.id)}
                    style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", cursor: "pointer", border: openTaskId === t.id ? "1.5px solid #1e293b" : "1.5px solid transparent", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "box-shadow 0.1s" }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b", lineHeight: 1.4, flex: 1 }}>{t.title}</p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                      {flag && <span style={{ fontSize: 10, color: flag.color, background: flag.color + "15", borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>{flag.label}</span>}
                      {area && <span style={{ fontSize: 10, color: area.color, background: area.color + "15", borderRadius: 3, padding: "1px 5px", fontWeight: 600 }}>{area.label}</span>}
                      {t.client && <span style={{ fontSize: 10, color: "#7f8c9a" }}>{t.client}</span>}
                      {due && <span style={{ fontSize: 10, color: due.color, marginLeft: "auto" }}>📅 {due.label}</span>}
                    </div>
                    {/* Quick status change */}
                    <div style={{ display: "flex", gap: 3, marginTop: 8, borderTop: "1px solid #f5f1eb", paddingTop: 6 }}>
                      {Object.entries(STATUSES).filter(([k]) => k !== key).map(([k, st]) => (
                        <button key={k} onClick={(e) => { e.stopPropagation(); onSetStatus(t.id, k); }}
                          title={`Sæt til ${st.label}`}
                          style={{ fontSize: 10, color: st.color, background: st.color + "15", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                          {st.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {col.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", fontSize: 12, color: "#b8bfcc" }}>Tom</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SEARCH RESULTS ───────────────────────────────────────────────────────────

function SearchResults({ tasks, query, onToggle, onOpenTask, openTaskId, onSetStatus }) {
  const q = query.toLowerCase().trim();
  const results = tasks.filter((t) =>
    t.title.toLowerCase().includes(q) ||
    t.client?.toLowerCase().includes(q) ||
    t.notes?.toLowerCase().includes(q)
  );
  return (
    <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", padding: "40px 36px" }}>
      <PageHeader title={`Søgeresultater`} subtitle={`"${query}" — ${results.length} opgave${results.length !== 1 ? "r" : ""} fundet`} />
      {results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#7f8c9a" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          <p style={{ margin: 0 }}>Ingen opgaver matcher "{query}"</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e3e6ea", overflow: "hidden" }}>
          {results.map((t, i) => (
            <div key={t.id} style={{ borderTop: i > 0 ? "1px solid #f5f1eb" : "none" }}>
              <TaskLine task={t} onToggle={onToggle} onOpen={onOpenTask} showClient isOpen={openTaskId === t.id} onSetStatus={onSetStatus} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarSection({ label, open, onToggle, children }) {
  return (
    <div style={{ marginBottom: 2, marginTop: 8 }}>
      <button onClick={onToggle}
        style={{ display: "flex", alignItems: "center", width: "100%", padding: "3px 10px 5px 10px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit" }}>
        <span style={{ fontSize: 9.5, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.7px", flex: 1, textAlign: "left", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 9, color: "#b8bfcc", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s", display: "inline-block" }}>▾</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: "-0.8px", color: "#1e1f21", lineHeight: 1.1 }}>{title}</h1>
        {subtitle && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ─── TASK ROW ────────────────────────────────────────────────────────────────

function TaskLine({ task: t, onToggle, onOpen, showClient, isOpen, onSetStatus, onSnooze, selected, onSelect }) {
  const [hover, setHover] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const area = AREAS[t.area];
  const flag = FLAGS[t.flag];
  const status = STATUSES[t.status] || STATUSES["todo"];
  const due = fmtDue(t.due);
  const done = t.status === "done";

  const meta = [
    showClient && t.client ? t.client : null,
    area ? area.label : null,
    due ? due.label : null,
  ].filter(Boolean);

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setStatusOpen(false); }}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 10px 9px 6px", borderRadius: 6, background: selected ? "#eef2ff" : isOpen ? "#f0ece8" : hover ? "#f7f3ef" : "transparent", transition: "background 0.1s", cursor: "default", position: "relative" }}>

      {/* Checkbox (multi-select) — only visible on hover or when selected */}
      {onSelect && (
        <div style={{ flexShrink: 0, paddingTop: 2, width: 16 }}>
          <button onClick={() => onSelect(t.id)} title={selected ? "Fravælg" : "Vælg"}
            style={{ width: 16, height: 16, borderRadius: 4, border: selected ? "none" : `1.5px solid ${hover || selected ? "#6366f1" : "#d4cfc9"}`, background: selected ? "#6366f1" : hover ? "#ede9fe" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", opacity: selected || hover ? 1 : 0 }}>
            {selected && <span style={{ color: "#fff", fontSize: 8, fontWeight: 900 }}>✓</span>}
          </button>
        </div>
      )}

      {/* Status button — only shown when NOT in select mode */}
      {!onSelect && (
        <div style={{ position: "relative", flexShrink: 0, paddingTop: 2 }}>
          <button onClick={() => onSetStatus ? setStatusOpen(!statusOpen) : onToggle(t.id)}
            title={status.label}
            style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${done ? status.color : "#d4cfc9"}`, background: done ? status.color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
            {done && <span style={{ color: "#fff", fontSize: 8, fontWeight: 900 }}>✓</span>}
            {t.status === "in-progress" && !done && <span style={{ fontSize: 8, color: status.color }}>◑</span>}
            {t.status === "waiting" && !done && <span style={{ fontSize: 8, color: status.color }}>◷</span>}
          </button>
          {statusOpen && onSetStatus && (
            <div style={{ position: "absolute", left: 0, top: "100%", marginTop: 4, background: "#fff", border: "1px solid #e8e3dc", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", zIndex: 200, minWidth: 150, padding: 4 }}>
              {Object.entries(STATUSES).map(([k, s]) => (
                <button key={k} onClick={() => { onSetStatus(t.id, k); setStatusOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", fontSize: 12, border: "none", background: t.status === k ? "#f5f1eb" : "none", cursor: "pointer", fontFamily: "inherit", borderRadius: 5, color: "#1e1f21", fontWeight: t.status === k ? 600 : 400 }}>
                  <span style={{ color: s.color }}>{s.icon}</span><span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two-line content */}
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onOpen && onOpen(t.id)}>
        <div style={{ fontSize: 14, color: done ? "#b8bfcc" : "#1e1f21", textDecoration: done ? "line-through" : "none", lineHeight: 1.4, fontWeight: 400, display: "flex", alignItems: "center", gap: 6 }}>
          {t.title}
          {flag && <span style={{ fontSize: 10, color: flag.color, fontWeight: 700, flexShrink: 0 }}>{flag.label}</span>}
        </div>
        {meta.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            {showClient && t.client && <><span style={{ fontSize: 11, color: "#9ca3af" }}>{t.client}</span><span style={{ color: "#d4cfc9", fontSize: 10 }}>·</span></>}
            {area && <span style={{ fontSize: 11, color: area.color + "bb" }}>{area.label}</span>}
            {due && <><span style={{ color: "#d4cfc9", fontSize: 10 }}>·</span><span style={{ fontSize: 11, color: due.color }}>{due.label}</span></>}
          </div>
        )}
      </div>

      {t.log?.length > 0 && hover && <span style={{ fontSize: 10, color: "#d4cfc9", flexShrink: 0 }}>💬 {t.log.length}</span>}
      {onSnooze && hover && !done && <SnoozeButton taskId={t.id} onSnooze={onSnooze} />}
    </div>
  );
}

// ─── ISSUES VIEW ─────────────────────────────────────────────────────────────

function IssuesView({ tasks, onToggle, onAdd, onOpenTask, openTaskId, hideClient, selectedIds, onSelect }) {
  const [cf, setCf] = useState("all");
  const urgent = tasks.filter((t) => t.flag && t.status !== "done");
  const clients = [...new Set(urgent.map((t) => t.client).filter(Boolean))];
  const filtered = cf === "all" ? urgent : urgent.filter((t) => t.client === cf);
  const issues   = filtered.filter((t) => t.flag === "issue");
  const requests = filtered.filter((t) => t.flag === "request");

  return (
    <div>
      <PageHeader title="Issues" subtitle="Ting der brænder på — løs dem inden du arbejder på andet."
        right={<button onClick={onAdd} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Nyt issue</button>}
      />
      {urgent.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#7f8c9a" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Ingen åbne issues</p>
        </div>
      ) : (
        <>
          {clients.length > 1 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {["all", ...clients].map((c) => (
                <button key={c} onClick={() => setCf(c)}
                  style={{ fontSize: 11, fontWeight: 600, borderRadius: 99, padding: "4px 12px", border: "1px solid", cursor: "pointer", fontFamily: "inherit", borderColor: cf === c ? "#1e293b" : "#e3e6ea", background: cf === c ? "#1e293b" : "#fff", color: cf === c ? "#fff" : "#5e6470" }}>
                  {c === "all" ? "Alle kunder" : c}
                </button>
              ))}
            </div>
          )}
          {issues.length > 0   && <TaskGroup label="🔥 Issues"          color="#ef4444" tasks={issues}   onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} showClient={!hideClient} selectedIds={selectedIds} onSelect={onSelect} />}
          {requests.length > 0 && <TaskGroup label="📩 Client Requests"  color="#f97316" tasks={requests} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} showClient={!hideClient} selectedIds={selectedIds} onSelect={onSelect} />}
        </>
      )}
    </div>
  );
}

// ─── TASKS VIEW ──────────────────────────────────────────────────────────────

function TasksView({ tasks, goals, onToggle, onOpenGoal, onOpenTask, openTaskId, clientFilter, onSetStatus, onSnooze, selectedIds, onSelect }) {
  const [groupBy, setGroupBy] = useState("maal");
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");
  const views = [{ key: "maal", label: "Mål" }, { key: "omraade", label: "Område" }, { key: "board", label: "Board" }];

  return (
    <div>
      <PageHeader title={clientFilter || "Alle opgaver"}
        right={
          <div style={{ display: "flex", gap: 4, background: "#e3e6ea", borderRadius: 8, padding: 3 }}>
            {views.map(({ key, label }) => (
              <button key={key} onClick={() => setGroupBy(key)}
                style={{ background: groupBy === key ? "#fff" : "transparent", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: groupBy === key ? 700 : 500, cursor: "pointer", fontFamily: "inherit", color: groupBy === key ? "#1e293b" : "#5e6470", boxShadow: groupBy === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {label}
              </button>
            ))}
          </div>
        }
      />
      {groupBy === "board"   && <BoardView tasks={tasks} onOpenTask={onOpenTask} openTaskId={openTaskId} onSetStatus={onSetStatus} />}
      {groupBy === "maal"    && <><TasksByGoalView tasks={open} goals={goals} onToggle={onToggle} onOpenGoal={onOpenGoal} onOpenTask={onOpenTask} openTaskId={openTaskId} showClient={!clientFilter} onSetStatus={onSetStatus} onSnooze={onSnooze} selectedIds={selectedIds} onSelect={onSelect} />{done.length > 0 && <TaskGroup label={`Udført (${done.length})`} color="#b8bfcc" tasks={done} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} showClient={!clientFilter} onSetStatus={onSetStatus} onSnooze={onSnooze} collapsed selectedIds={selectedIds} onSelect={onSelect} />}</>}
      {groupBy === "omraade" && <><TasksByAreaView tasks={open} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} showClient={!clientFilter} onSetStatus={onSetStatus} onSnooze={onSnooze} selectedIds={selectedIds} onSelect={onSelect} />{done.length > 0 && <TaskGroup label={`Udført (${done.length})`} color="#b8bfcc" tasks={done} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} showClient={!clientFilter} onSetStatus={onSetStatus} onSnooze={onSnooze} collapsed selectedIds={selectedIds} onSelect={onSelect} />}</>}
    </div>
  );
}

function TasksByGoalView({ tasks, goals, onToggle, onOpenGoal, onOpenTask, openTaskId, showClient, selectedIds, onSelect }) {
  const withGoal = goals.map((g) => ({ goal: g, tasks: tasks.filter((t) => t.goalId === g.id) })).filter((g) => g.tasks.length > 0);
  const loose = tasks.filter((t) => !t.goalId);
  return (
    <div>
      {withGoal.map(({ goal: g, tasks: gt }) => (
        <div key={g.id} style={{ marginBottom: 20 }}>
          <div onClick={() => onOpenGoal(g.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", cursor: "pointer", borderRadius: 6, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#5e6470" }}>{g.title}</span>
            <span style={{ fontSize: 11, color: "#b8bfcc", marginLeft: "auto" }}>↗</span>
          </div>
          {gt.map((t) => <TaskLine key={t.id} task={t} onToggle={onToggle} onOpen={onOpenTask} showClient={showClient} isOpen={openTaskId === t.id} selected={selectedIds?.includes(t.id)} onSelect={onSelect} />)}
        </div>
      ))}
      {loose.length > 0 && <TaskGroup label="Ad hoc" color="#b8bfcc" tasks={loose} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} showClient={showClient} selectedIds={selectedIds} onSelect={onSelect} />}
    </div>
  );
}

function TasksByAreaView({ tasks, onToggle, onOpenTask, openTaskId, showClient, selectedIds, onSelect }) {
  const grouped = Object.entries(AREAS).map(([key, cfg]) => ({ key, cfg, tasks: tasks.filter((t) => t.area === key) })).filter((g) => g.tasks.length > 0);
  return (
    <div>
      {grouped.map(({ key, cfg, tasks: at }) => (
        <TaskGroup key={key} label={cfg.label} color={cfg.color} tasks={at} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} showClient={showClient} selectedIds={selectedIds} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TaskGroup({ label, color, tasks, onToggle, onOpenTask, openTaskId, showClient, collapsed: initCollapsed, onSetStatus, onSnooze, selectedIds, onSelect }) {
  const [open, setOpen] = useState(!initCollapsed);
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "10px 6px 6px 6px", marginBottom: 0, width: "100%" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1e1f21" }}>{label}</span>
        <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>{tasks.length}</span>
        <span style={{ fontSize: 10, color: "#b8bfcc", marginLeft: "auto", transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.15s" }}>▶</span>
      </button>
      {open && tasks.map((t) => <TaskLine key={t.id} task={t} onToggle={onToggle} onOpen={onOpenTask} showClient={showClient} isOpen={openTaskId === t.id} onSetStatus={onSetStatus} onSnooze={onSnooze} selected={selectedIds?.includes(t.id)} onSelect={onSelect} />)}
    </div>
  );
}

// ─── GOAL ROW ────────────────────────────────────────────────────────────────

function GoalRow({ goal: g, taskCount, doneTasks, onClick }) {
  const [hover, setHover] = useState(false);
  const due = fmtDue(g.due);
  const pct = taskCount ? Math.round((doneTasks / taskCount) * 100) : 0;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 8, background: hover ? "#f7f3ef" : "#fff", border: "1px solid #e3e6ea", marginBottom: 8, cursor: "pointer", transition: "background 0.1s" }}>
      <span style={{ fontSize: 18 }}>{g.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{g.title}</span>
          <span style={{ fontSize: 11, color: g.color, background: g.color + "15", borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>{g.client}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 80, height: 3, background: "#e3e6ea", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: g.color, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 11, color: "#7f8c9a" }}>{doneTasks}/{taskCount}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {due && <span style={{ fontSize: 11, color: due.color }}>📅 {due.label}</span>}
        <span style={{ fontSize: 16, color: "#d4cfc9" }}>›</span>
      </div>
    </div>
  );
}

// ─── GOAL DETAIL ─────────────────────────────────────────────────────────────

function GoalDetail({ goal: g, tasks, onBack, onAddLog, onToggleTask, onUpdateField, onOpenTask, openTaskId }) {
  const [logInput, setLogInput]     = useState("");
  const [editField, setEditField]   = useState(null);
  const [editVal, setEditVal]       = useState("");
  const [areaFilter, setAreaFilter] = useState("all");

  const due = fmtDue(g.due);
  const taskAreas = [...new Set(tasks.map((t) => t.area))];
  const filtered = areaFilter === "all" ? tasks : tasks.filter((t) => t.area === areaFilter);
  const doneTasks = tasks.filter((t) => t.status === "done").length;

  const handleLog = () => { onAddLog(logInput); setLogInput(""); };
  const startEdit = (f) => { setEditField(f); setEditVal(g[f] || ""); };
  const saveEdit = () => { onUpdateField(editField, editVal); setEditField(null); };

  const fields = [
    { key: "roadmap",    label: "Roadmap",       color: "#6366f1" },
    { key: "bottleneck", label: "Bottleneck",    color: "#ef4444" },
    { key: "firstStep",  label: "Første skridt", color: g.color  },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 32px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#7f8c9a", fontFamily: "inherit", marginBottom: 20, padding: 0 }}>← Mål</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <span style={{ fontSize: 24 }}>{g.emoji}</span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", flex: 1 }}>{g.title}</h1>
        <span style={{ fontSize: 11, color: g.color, background: g.color + "15", borderRadius: 4, padding: "3px 10px", fontWeight: 600 }}>{g.client}</span>
        {due && <span style={{ fontSize: 11, color: due.color }}>📅 {due.label}</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map(({ key, label, color }) => (
            <div key={key} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e3e6ea", padding: "14px 16px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color, letterSpacing: "0.6px" }}>{label.toUpperCase()}</p>
              {editField === key ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setEditField(null)}
                    style={{ border: `1.5px solid ${color}`, borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.6, minHeight: 64 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveEdit} style={{ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Gem</button>
                    <button onClick={() => setEditField(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#7f8c9a", fontFamily: "inherit" }}>Annuller</button>
                  </div>
                </div>
              ) : (
                <p onClick={() => startEdit(key)} style={{ margin: 0, fontSize: 13, color: g[key] ? "#374151" : "#b8bfcc", lineHeight: 1.6, cursor: "text" }}>{g[key] || "Klik for at redigere..."}</p>
              )}
            </div>
          ))}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e3e6ea", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 8 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#7f8c9a", letterSpacing: "0.6px", flex: 1 }}>OPGAVER</p>
              <span style={{ fontSize: 11, color: "#7f8c9a" }}>{doneTasks}/{tasks.length}</span>
            </div>
            {tasks.length > 0 && (
              <div style={{ height: 3, background: "#e3e6ea", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${(doneTasks / tasks.length) * 100}%`, background: g.color, borderRadius: 99 }} />
              </div>
            )}
            {taskAreas.length > 1 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {["all", ...taskAreas].map((a) => {
                  const cfg = AREAS[a]; const color = cfg?.color || "#1e293b"; const active = areaFilter === a;
                  return (
                    <button key={a} onClick={() => setAreaFilter(a)}
                      style={{ fontSize: 10, fontWeight: 600, borderRadius: 99, padding: "2px 9px", border: "1px solid", cursor: "pointer", fontFamily: "inherit", borderColor: active ? color : "#e3e6ea", background: active ? color : "transparent", color: active ? "#fff" : "#7f8c9a" }}>
                      {a === "all" ? "Alle" : cfg?.label}
                    </button>
                  );
                })}
              </div>
            )}
            {filtered.map((t) => <TaskLine key={t.id} task={t} onToggle={onToggleTask} onOpen={onOpenTask} isOpen={openTaskId === t.id} />)}
            {filtered.length === 0 && <p style={{ margin: 0, fontSize: 12, color: "#b8bfcc", textAlign: "center", padding: "8px 0" }}>Ingen opgaver</p>}
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e3e6ea", overflow: "hidden", position: "sticky", top: 24 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f5f1eb" }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#7f8c9a", letterSpacing: "0.6px" }}>AKTIVITETSLOG</p>
          </div>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f5f1eb" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input style={{ flex: 1, border: "1px solid #e3e6ea", borderRadius: 7, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#f8f9fb" }}
                placeholder="Hvad skete der?" value={logInput} onChange={(e) => setLogInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLog()} />
              <button onClick={handleLog} style={{ background: g.color, color: "#fff", border: "none", borderRadius: 7, padding: "0 12px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>↵</button>
            </div>
          </div>
          <div style={{ maxHeight: 440, overflowY: "auto" }}>
            {g.log.length === 0 && <p style={{ margin: 0, padding: "20px 16px", fontSize: 12, color: "#b8bfcc", textAlign: "center" }}>Ingen aktivitet endnu.</p>}
            {g.log.map((entry, i) => (
              <div key={entry.id} style={{ display: "flex", gap: 10, padding: "10px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: g.color, marginTop: 4 }} />
                  {i < g.log.length - 1 && <div style={{ width: 1, flex: 1, background: "#f5f1eb", margin: "3px 0" }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 6 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 10, color: "#b8bfcc" }}>{fmtDate(entry.date)}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT VIEW ─────────────────────────────────────────────────────────────

function ClientView({ client, subNav, setSubNav, tasks, goals, allGoals, routines, seoPages, onToggle, onOpenGoal, onOpenTask, openTaskId, onMarkRoutineDone, onUpdateSeoPage, onAddSeoPageEntry, onAddSeoPage, onAddTask, onSetStatus, clientColor, timeLog = [], allTasks = [], onEditTaskLog, onEditGoalLog }) {
  const urgentCount = tasks.filter((t) => t.flag && t.status !== "done").length;
  const gAds  = tasks.filter((t) => t.area === "google-ads" && t.status !== "done");
  const meta   = tasks.filter((t) => t.area === "meta"       && t.status !== "done");
  const tabs = [
    { key: "issues",     label: "Issues",       icon: "🔥", badge: urgentCount || null },
    { key: "maal",       label: "Mål",          icon: "◎" },
    { key: "opgaver",    label: "Alle opgaver",  icon: "☐" },
    { key: "google-ads", label: "Google Ads",   icon: "🎯", badge: gAds.length || null,  badgeColor: "#4285f4" },
    { key: "meta",       label: "Meta",         icon: "📘", badge: meta.length || null,  badgeColor: "#1877f2" },
    { key: "seo",        label: "SEO",          icon: "🌿", badge: seoPages.length || null, badgeColor: "#10b981" },
    { key: "tid",        label: "Tid",          icon: "⏱", badge: timeLog.length || null, badgeColor: "#f97316" },
    { key: "timeline",   label: "Timeline",     icon: "📋" },
  ];
  return (
    <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "32px 36px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: clientColor, display: "inline-block", flexShrink: 0 }} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>{client}</h1>
      </div>
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e3e6ea", marginBottom: 28, overflowX: "auto" }}>
        {tabs.map(({ key, label, icon, badge, badgeColor }) => (
          <button key={key} onClick={() => setSubNav(key)}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "8px 16px", fontSize: 12, fontWeight: subNav === key ? 700 : 500, color: subNav === key ? "#1e293b" : "#7f8c9a", borderBottom: subNav === key ? `2px solid ${clientColor}` : "2px solid transparent", marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0 }}>
            <span>{icon}</span><span>{label}</span>
            {badge > 0 && <span style={{ background: badgeColor || "#ef4444", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "1px 5px", lineHeight: 1.6 }}>{badge}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={onAddTask} style={{ background: "none", border: "1px solid #e3e6ea", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#5e6470", marginBottom: 4, alignSelf: "center", flexShrink: 0 }}>+ Opgave</button>
      </div>
      {subNav === "issues"     && <IssuesView tasks={tasks} onToggle={onToggle} onAdd={onAddTask} onOpenTask={onOpenTask} openTaskId={openTaskId} hideClient />}
      {subNav === "maal"       && (
        <div>
          {goals.length === 0 && <p style={{ color: "#7f8c9a", fontSize: 13 }}>Ingen mål for {client} endnu.</p>}
          {goals.map((g) => { const gt = tasks.filter((t) => t.goalId === g.id); const done = gt.filter((t) => t.status === "done").length; return <GoalRow key={g.id} goal={g} taskCount={gt.length} doneTasks={done} onClick={() => onOpenGoal(g.id)} />; })}
        </div>
      )}
      {subNav === "opgaver"    && <TasksView tasks={tasks} goals={allGoals} onToggle={onToggle} onOpenGoal={onOpenGoal} onOpenTask={onOpenTask} openTaskId={openTaskId} clientFilter={client} onSetStatus={onSetStatus} />}
      {subNav === "google-ads" && <ServiceTasksView tasks={gAds} allTasks={tasks} area="google-ads" goals={allGoals} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} onAddTask={onAddTask} />}
      {subNav === "meta"       && <ServiceTasksView tasks={meta} allTasks={tasks} area="meta" goals={allGoals} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} onAddTask={onAddTask} />}
      {subNav === "seo"        && <SeoView pages={seoPages} onUpdate={onUpdateSeoPage} onAddEntry={onAddSeoPageEntry} onAdd={onAddSeoPage} clientColor={clientColor} />}
      {subNav === "tid"        && <TimeView timeLog={timeLog} clientColor={clientColor} />}
      {subNav === "timeline"   && <TimelineView tasks={tasks} goals={goals} clientColor={clientColor} onEditTaskLog={onEditTaskLog} onEditGoalLog={onEditGoalLog} />}
    </div>
  );
}

// ─── TIME VIEW ───────────────────────────────────────────────────────────────

function fmtMinutes(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}t ${m}m` : `${m}m`;
}

function TimeView({ timeLog, clientColor }) {
  if (timeLog.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#7f8c9a" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏱</div>
        <p style={{ fontWeight: 600, marginBottom: 6 }}>Ingen tidsregistreringer endnu</p>
        <p style={{ fontSize: 13, color: "#b8bfcc" }}>Start en timer på en opgave for at logge tid</p>
      </div>
    );
  }

  // Group by date
  const byDate = {};
  timeLog.forEach((e) => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const totalMin = timeLog.reduce((s, e) => s + e.minutes, 0);
  const humanMin = timeLog.filter((e) => e.type === "human").reduce((s, e) => s + e.minutes, 0);

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total tid", value: fmtMinutes(totalMin), icon: "⏱", color: clientColor },
          { label: "Din tid", value: fmtMinutes(humanMin), icon: "🧠", color: "#6366f1" },
          { label: "Sessioner", value: timeLog.length, icon: "📍", color: "#10b981" },
          { label: "Dage aktiv", value: dates.length, icon: "📅", color: "#f59e0b" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ flex: 1, background: "#f8f9fb", borderRadius: 10, padding: "14px 16px", border: "1px solid #eaecf0" }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: "-0.5px" }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#7f8c9a", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Daily breakdown */}
      {dates.map((date) => {
        const entries = byDate[date];
        const dayTotal = entries.reduce((s, e) => s + e.minutes, 0);
        const d = new Date(date);
        const dayLabel = d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "short" });
        return (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", textTransform: "capitalize" }}>{dayLabel}</span>
              <div style={{ flex: 1, height: 1, background: "#eaecf0" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: clientColor }}>{fmtMinutes(dayTotal)}</span>
            </div>
            {entries.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #eaecf0", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#fff", background: e.type === "human" ? "#6366f1" : "#10b981", borderRadius: 4, padding: "2px 7px", fontWeight: 700, flexShrink: 0 }}>
                  {e.type === "human" ? "DIG" : "AUTO"}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: "#374151", fontWeight: 500 }}>{e.taskTitle}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{fmtMinutes(e.minutes)}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── TIMELINE VIEW ───────────────────────────────────────────────────────────

function TimelineView({ tasks, goals, clientColor, onEditTaskLog, onEditGoalLog }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText]   = useState("");

  // Aggregate all log entries from tasks + goals for this client
  const entries = [];
  tasks.forEach((t) => {
    (t.log || []).forEach((l) => {
      entries.push({ logId: l.id, date: l.date, text: l.text, source: t.title, sourceType: "task", area: t.area, attachments: l.attachments, parentId: t.id });
    });
  });
  goals.forEach((g) => {
    (g.log || []).forEach((l) => {
      entries.push({ logId: l.id, date: l.date, text: l.text, source: g.title, sourceType: "mål", area: null, parentId: g.id });
    });
  });
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#7f8c9a" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <p style={{ fontWeight: 600 }}>Ingen aktivitet endnu</p>
        <p style={{ fontSize: 13, color: "#b8bfcc" }}>Aktivitetslog fra opgaver og mål vises her</p>
      </div>
    );
  }

  const startEdit = (e) => {
    setEditingId(e.logId);
    setEditText(e.text || "");
  };

  const saveEdit = (e) => {
    if (e.sourceType === "task") onEditTaskLog?.(e.parentId, e.logId, editText);
    else onEditGoalLog?.(e.parentId, e.logId, editText);
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div style={{ maxWidth: 640 }}>
      {entries.map((e, i) => {
        const d = new Date(e.date);
        const timeLabel = d.toLocaleDateString("da-DK", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
        const areaColor = AREAS[e.area]?.color || clientColor;
        const isEditing = editingId === e.logId;
        return (
          <div key={e.logId || i} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 4 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: areaColor, boxShadow: `0 0 0 3px ${areaColor}20`, flexShrink: 0 }} />
              {i < entries.length - 1 && <div style={{ width: 1, flex: 1, background: "#eaecf0", margin: "4px 0", minHeight: 20 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "#7f8c9a" }}>{timeLabel}</span>
                <span style={{ fontSize: 10, background: e.sourceType === "mål" ? "#eaecf0" : areaColor + "15", color: e.sourceType === "mål" ? "#7f8c9a" : areaColor, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                  {e.sourceType === "mål" ? "◎ " : ""}{e.source}
                </span>
                {!isEditing && (
                  <button onClick={() => startEdit(e)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#b8bfcc", padding: "0 2px", fontFamily: "inherit" }} title="Rediger">✏️</button>
                )}
              </div>
              {isEditing ? (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={(ev) => setEditText(ev.target.value)}
                    onKeyDown={(ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); saveEdit(e); } if (ev.key === "Escape") cancelEdit(); }}
                    style={{ flex: 1, border: "1px solid #d1cbc4", borderRadius: 7, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", lineHeight: 1.5, resize: "vertical", minHeight: 60, outline: "none", color: "#374151" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button onClick={() => saveEdit(e)} style={{ background: areaColor, color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Gem</button>
                    <button onClick={cancelEdit} style={{ background: "#eaecf0", color: "#5e6470", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuller</button>
                  </div>
                </div>
              ) : (
                e.text && <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{e.text}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SERVICE TASKS VIEW ──────────────────────────────────────────────────────

function ServiceTasksView({ tasks, allTasks, area, goals, onToggle, onOpenTask, openTaskId, onAddTask }) {
  const areaInfo = AREAS[area];
  const withGoal = goals
    .map((g) => ({ goal: g, tasks: tasks.filter((t) => t.goalId === g.id) }))
    .filter((g) => g.tasks.length > 0);
  const loose = tasks.filter((t) => !t.goalId);
  const done  = allTasks.filter((t) => t.area === area && t.status === "done");

  if (tasks.length === 0 && done.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#7f8c9a" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{area === "google-ads" ? "🎯" : "📘"}</div>
        <p style={{ margin: "0 0 16px", fontWeight: 600 }}>Ingen {areaInfo?.label}-opgaver endnu</p>
        <button onClick={onAddTask} style={{ background: areaInfo?.color, color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Tilføj opgave</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: areaInfo?.color, background: areaInfo?.color + "15", borderRadius: 5, padding: "3px 10px" }}>{areaInfo?.label}</span>
        <span style={{ fontSize: 12, color: "#7f8c9a" }}>{tasks.length} åbne opgaver</span>
        <div style={{ flex: 1 }} />
        <button onClick={onAddTask} style={{ background: "none", border: `1px solid ${areaInfo?.color}40`, borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: areaInfo?.color }}>+ Opgave</button>
      </div>
      {withGoal.map(({ goal: g, tasks: gt }) => (
        <div key={g.id} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", marginBottom: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: g.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#5e6470" }}>{g.title}</span>
          </div>
          {gt.map((t) => <TaskLine key={t.id} task={t} onToggle={onToggle} onOpen={onOpenTask} isOpen={openTaskId === t.id} />)}
        </div>
      ))}
      {loose.length > 0 && <TaskGroup label="Uden mål" color="#b8bfcc" tasks={loose} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} />}
      {done.length > 0  && <TaskGroup label={`Udført (${done.length})`} color="#b8bfcc" tasks={done} onToggle={onToggle} onOpenTask={onOpenTask} openTaskId={openTaskId} collapsed />}
    </div>
  );
}

// ─── SEO VIEW ────────────────────────────────────────────────────────────────

function SeoView({ pages, onUpdate, onAddEntry, onAdd }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Landingssider</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#7f8c9a" }}>Position over tid + ændringer. Korrelér hvad du gør med hvad der virker.</p>
        </div>
        <button onClick={onAdd} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Side</button>
      </div>
      {pages.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#7f8c9a" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌿</div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Ingen landingssider endnu</p>
        </div>
      ) : pages.map((page) => <SeoPageRow key={page.id} page={page} onUpdate={onUpdate} onAddEntry={onAddEntry} />)}
    </div>
  );
}

function PositionChart({ positionHistory, changeLog }) {
  const sorted = [...positionHistory].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;

  const W = 600, H = 120, PAD = { top: 12, bottom: 28, left: 32, right: 12 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const positions = sorted.map(s => s.position);
  const minPos = Math.max(1, Math.min(...positions) - 2);
  const maxPos = Math.max(...positions) + 2;
  const dates = sorted.map(s => new Date(s.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  const x = (d) => PAD.left + ((new Date(d).getTime() - minDate) / dateRange) * innerW;
  // inverted: position 1 at top
  const y = (p) => PAD.top + ((p - minPos) / (maxPos - minPos)) * innerH;

  const points = sorted.map(s => `${x(s.date)},${y(s.position)}`).join(" ");

  // Changes that fall within our date range
  const changes = changeLog.filter(c => {
    const t = new Date(c.date).getTime();
    return t >= minDate && t <= maxDate;
  });

  return (
    <div style={{ marginBottom: 16, background: "#f8f9fb", borderRadius: 8, padding: "8px 0 0", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Grid lines */}
        {[minPos, Math.round((minPos + maxPos) / 2), maxPos].map(p => (
          <g key={p}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(p)} y2={y(p)} stroke="#e3e6ea" strokeWidth={1} />
            <text x={PAD.left - 4} y={y(p) + 4} fontSize={9} fill="#b8bfcc" textAnchor="end">#{p}</text>
          </g>
        ))}

        {/* Change markers */}
        {changes.map(c => (
          <g key={c.id}>
            <line x1={x(c.date)} x2={x(c.date)} y1={PAD.top} y2={H - PAD.bottom} stroke="#6366f1" strokeWidth={1} strokeDasharray="3,3" opacity={0.6} />
            <circle cx={x(c.date)} cy={PAD.top} r={3} fill="#6366f1" opacity={0.8} />
          </g>
        ))}

        {/* Position line */}
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth={2} strokeLinejoin="round" />

        {/* Position dots */}
        {sorted.map((s, i) => {
          const posColor = s.position <= 3 ? "#10b981" : s.position <= 10 ? "#f59e0b" : "#ef4444";
          return (
            <g key={s.id}>
              <circle cx={x(s.date)} cy={y(s.position)} r={4} fill={posColor} />
              {i === sorted.length - 1 && (
                <text x={x(s.date) + 6} y={y(s.position) + 4} fontSize={10} fontWeight="bold" fill={posColor}>#{s.position}</text>
              )}
            </g>
          );
        })}

        {/* Date labels */}
        {sorted.filter((_, i) => i === 0 || i === sorted.length - 1).map(s => (
          <text key={s.id + "lbl"} x={x(s.date)} y={H - 6} fontSize={9} fill="#b8bfcc" textAnchor="middle">
            {new Date(s.date).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ padding: "4px 12px 8px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width={16} height={8}><line x1={0} y1={4} x2={16} y2={4} stroke="#10b981" strokeWidth={2} /></svg>
          <span style={{ fontSize: 10, color: "#7f8c9a" }}>Position</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width={12} height={12}><line x1={6} y1={0} x2={6} y2={12} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="2,2" /><circle cx={6} cy={2} r={2.5} fill="#6366f1" /></svg>
          <span style={{ fontSize: 10, color: "#7f8c9a" }}>Ændring</span>
        </div>
      </div>
    </div>
  );
}

function SeoPageRow({ page, onUpdate, onAddEntry }) {
  const [expanded, setExpanded]   = useState(page.positionHistory?.length > 0);
  const [posInput, setPosInput]   = useState("");
  const [posDate, setPosDate]     = useState(new Date().toISOString().slice(0, 10));
  const [changeInput, setChangeInput] = useState("");
  const [notesVal, setNotesVal]   = useState(page.notes || "");
  const [editNotes, setEditNotes] = useState(false);

  const history = page.positionHistory || [];
  const changelog = page.changeLog || [];
  const latest = history.length > 0 ? [...history].sort((a, b) => b.date.localeCompare(a.date))[0].position : null;
  const posColor = latest === null ? "#b8bfcc" : latest <= 3 ? "#10b981" : latest <= 10 ? "#f59e0b" : "#ef4444";

  const addPos = () => {
    const n = parseInt(posInput, 10);
    if (isNaN(n)) return;
    onAddEntry(page.id, "positionHistory", { date: posDate, position: n });
    setPosInput("");
  };

  const addChange = () => {
    if (!changeInput.trim()) return;
    onAddEntry(page.id, "changeLog", { date: posDate, text: changeInput.trim() });
    setChangeInput("");
  };

  const saveNotes = () => { onUpdate(page.id, "notes", notesVal.trim()); setEditNotes(false); };

  // Combined timeline sorted newest first
  const timeline = [
    ...history.map(h => ({ type: "pos", date: h.date, data: h })),
    ...changelog.map(c => ({ type: "change", date: c.date, data: c })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e3e6ea", overflow: "hidden", marginBottom: 12 }}>
      {/* Header */}
      <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, background: posColor + "18", border: `1.5px solid ${posColor}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: posColor, lineHeight: 1 }}>{latest !== null ? `#${latest}` : "—"}</span>
          <span style={{ fontSize: 8, color: posColor + "99", fontWeight: 600 }}>POS</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.url}</p>
          {page.keyword && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#10b981", fontWeight: 600 }}>{page.keyword}</p>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {history.length > 0 && <span style={{ fontSize: 11, color: "#b8bfcc" }}>{history.length} målinger</span>}
          {changelog.length > 0 && <span style={{ fontSize: 11, color: "#b8bfcc" }}>{changelog.length} ændringer</span>}
          <span style={{ fontSize: 14, color: "#d4cfc9", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #f5f1eb" }}>

          {/* Chart */}
          <div style={{ padding: "14px 16px 0" }}>
            <PositionChart positionHistory={history} changeLog={changelog} />
          </div>

          {/* Log inputs */}
          <div style={{ padding: "0 16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Position input */}
            <div>
              <label style={{ ...LABEL, marginBottom: 6 }}>LOG POSITION</label>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                <input type="date" value={posDate} onChange={(e) => setPosDate(e.target.value)}
                  style={{ flex: 1, border: "1px solid #e3e6ea", borderRadius: 6, padding: "6px 8px", fontSize: 11, fontFamily: "inherit", outline: "none", background: "#f8f9fb" }} />
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <input value={posInput} onChange={(e) => setPosInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPos()}
                  placeholder="#position"
                  style={{ flex: 1, border: "1px solid #e3e6ea", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#f8f9fb" }} />
                <button onClick={addPos} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "0 10px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>+</button>
              </div>
            </div>

            {/* Change input */}
            <div>
              <label style={{ ...LABEL, marginBottom: 6 }}>LOG ÆNDRING</label>
              <div style={{ height: 28, marginBottom: 4 }} /> {/* spacer to align with date */}
              <div style={{ display: "flex", gap: 4 }}>
                <input value={changeInput} onChange={(e) => setChangeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChange()}
                  placeholder="Hvad ændrede du?"
                  style={{ flex: 1, border: "1px solid #e3e6ea", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#f8f9fb" }} />
                <button onClick={addChange} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, padding: "0 10px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}>+</button>
              </div>
            </div>
          </div>

          {/* Combined timeline */}
          {timeline.length > 0 && (
            <div style={{ borderTop: "1px solid #f5f1eb", padding: "12px 16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "#7f8c9a", letterSpacing: "0.5px" }}>TIMELINE</p>
              {timeline.map((entry, i) => {
                const isPos = entry.type === "pos";
                const dotColor = isPos
                  ? (entry.data.position <= 3 ? "#10b981" : entry.data.position <= 10 ? "#f59e0b" : "#ef4444")
                  : "#6366f1";
                return (
                  <div key={entry.data.id + entry.type} style={{ display: "flex", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
                      {i < timeline.length - 1 && <div style={{ width: 1, flex: 1, background: "#f0ece8", margin: "3px 0", minHeight: 14 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 10 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 10, color: "#b8bfcc" }}>{entry.date}</p>
                      {isPos
                        ? <p style={{ margin: 0, fontSize: 12, color: dotColor, fontWeight: 700 }}>Position #{entry.data.position}</p>
                        : <p style={{ margin: 0, fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{entry.data.text}</p>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notes */}
          <div style={{ borderTop: "1px solid #f5f1eb", padding: "12px 16px" }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#7f8c9a", letterSpacing: "0.5px" }}>NOTER</p>
            {editNotes ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea autoFocus value={notesVal} onChange={(e) => setNotesVal(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setEditNotes(false)}
                  style={{ border: "1.5px solid #10b981", borderRadius: 7, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.6, minHeight: 64 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveNotes} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Gem</button>
                  <button onClick={() => setEditNotes(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#7f8c9a", fontFamily: "inherit" }}>Annuller</button>
                </div>
              </div>
            ) : (
              <p onClick={() => { setNotesVal(page.notes || ""); setEditNotes(true); }}
                style={{ margin: 0, fontSize: 12, color: page.notes ? "#374151" : "#b8bfcc", lineHeight: 1.6, cursor: "text" }}>
                {page.notes || "Klik for at tilføje noter..."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROUTINE ROW ─────────────────────────────────────────────────────────────

function RoutineRow({ routine: r, onDone }) {
  const [hover, setHover] = useState(false);
  const days = r.lastDone ? Math.floor((Date.now() - new Date(r.lastDone)) / 86400000) : null;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: hover ? "#f5f1eb" : "transparent" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: "#1e293b" }}>{r.title}</span>
      <span style={{ fontSize: 11, color: "#7f8c9a" }}>{r.cadence}</span>
      {r.streak > 0 && <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>🔥{r.streak}</span>}
      {days !== null && <span style={{ fontSize: 11, color: days > 7 ? "#ef4444" : "#7f8c9a" }}>{days === 0 ? "i dag" : `${days}d siden`}</span>}
      {hover && <button onClick={onDone} style={{ background: "none", border: "1px solid #e3e6ea", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "#5e6470" }}>✓</button>}
    </div>
  );
}

// ─── ADD MODAL ────────────────────────────────────────────────────────────────

function AddModal({ goals, newTitle, setNewTitle, newGoalId, setNewGoalId, newArea, setNewArea, newClient, setNewClient, newDue, setNewDue, onAdd, onClose, clientFilter }) {
  const effectiveClient = clientFilter || newClient;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px", width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, flex: 1 }}>Ny opgave</h3>
          {clientFilter && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "#eef2ff", borderRadius: 100, padding: "3px 10px", border: "1px solid #e0e7ff" }}>
              {clientFilter}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input autoFocus style={{ border: "1.5px solid #6366f1", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
            placeholder="Opgavetitel..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><label style={LABEL}>MÅL</label>
              <select value={newGoalId} onChange={(e) => setNewGoalId(e.target.value)} style={SELECT}>
                <option value="">— Ad hoc</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.title}</option>)}
              </select>
            </div>
            <div><label style={LABEL}>OMRÅDE</label>
              <select value={newArea} onChange={(e) => setNewArea(e.target.value)} style={SELECT}>
                {Object.entries(AREAS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            {!clientFilter && (
              <div><label style={LABEL}>KLIENT</label>
                <input style={{ ...SELECT, border: "1px solid #e3e6ea" }} placeholder="Fx Cardirect" value={newClient} onChange={(e) => setNewClient(e.target.value)} />
              </div>
            )}
            <div style={clientFilter ? {} : {}}><label style={LABEL}>DEADLINE</label>
              <input type="date" style={SELECT} value={newDue} onChange={(e) => setNewDue(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={() => { if (clientFilter) setNewClient(clientFilter); onAdd(); }}
            style={{ flex: 1, background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Tilføj</button>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #e3e6ea", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#5e6470" }}>Annuller</button>
        </div>
      </div>
    </div>
  );
}

// ─── TIMER DISPLAY ───────────────────────────────────────────────────────────

function TimerDisplay({ startTime }) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startTime) / 1000));
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const fmt = h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
  return <span style={{ fontSize: 11, fontWeight: 700, color: "#f97316", fontVariantNumeric: "tabular-nums" }}>{fmt}</span>;
}

// ─── RETAINER VIEW ───────────────────────────────────────────────────────────

const EXPENSE_CATS = {
  developer: { label: "Udvikler", color: "#8b5cf6" },
  links:     { label: "Links",    color: "#3b82f6" },
  tools:     { label: "Tools",    color: "#06b6d4" },
  ads:       { label: "Annoncer", color: "#f97316" },
  other:     { label: "Andet",    color: "#94a3b8" },
};

function RetainerView({ retainers, tasks, onUpdate, onAddExpense, onDeleteExpense }) {
  const active = retainers.filter((r) => r.status === "active");
  const inactive = retainers.filter((r) => r.status !== "active");
  const totalMRR = active.reduce((sum, r) => sum + r.monthlyFee, 0);
  const [editId, setEditId] = useState(null);
  const [editFee, setEditFee] = useState("");

  const RETAINER_STATUSES = { active: { label: "Aktiv", color: "#22c55e" }, paused: { label: "Pause", color: "#f59e0b" }, churned: { label: "Churnet", color: "#ef4444" } };

  const getMonthlyHours = (client) => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let minutes = 0;
    tasks.filter((t) => t.client === client).forEach((t) => {
      (t.log || []).forEach((entry) => {
        if (!entry.date?.startsWith(monthStr)) return;
        const m1 = entry.text?.match(/⏱\s*(\d+)t\s*(\d+)m/);
        if (m1) { minutes += parseInt(m1[1]) * 60 + parseInt(m1[2]); return; }
        const m2 = entry.text?.match(/⏱\s*(\d+)m/);
        if (m2) minutes += parseInt(m2[1]);
      });
    });
    return Math.round(minutes / 60 * 10) / 10;
  };

  const getMonthlyExpenses = (r) => {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return (r.expenses || []).filter((e) => e.date?.startsWith(monthStr));
  };

  const startEdit = (r) => { setEditId(r.id); setEditFee(String(r.monthlyFee)); };
  const saveEdit = (id) => { onUpdate(id, { monthlyFee: parseInt(editFee) || 0 }); setEditId(null); };

  const RetainerCard = ({ r }) => {
    const hoursUsed = getMonthlyHours(r.client);
    const pct = r.hoursIncluded > 0 ? Math.min(100, Math.round((hoursUsed / r.hoursIncluded) * 100)) : 0;
    const st = RETAINER_STATUSES[r.status] || RETAINER_STATUSES.active;
    const monthExpenses = getMonthlyExpenses(r);
    const totalExpenses = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const margin = r.monthlyFee - totalExpenses;

    const [showExpenses, setShowExpenses] = useState(false);
    const [expDesc, setExpDesc] = useState("");
    const [expAmount, setExpAmount] = useState("");
    const [expCat, setExpCat] = useState("other");
    const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));

    const submitExpense = () => {
      if (!expDesc.trim() || !expAmount) return;
      onAddExpense(r.id, { description: expDesc.trim(), amount: parseInt(expAmount), category: expCat, date: expDate });
      setExpDesc(""); setExpAmount(""); setExpCat("other");
    };

    return (
      <div style={{ background: "#fff", border: "1px solid #e3e6ea", borderRadius: 10, padding: "16px 18px", marginBottom: 10 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{r.client}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.color + "18", borderRadius: 4, padding: "1px 7px" }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 11, color: "#7f8c9a" }}>{r.services.join(" · ")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {editId === r.id ? (
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <input value={editFee} onChange={(e) => setEditFee(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit(r.id)}
                  style={{ width: 80, border: "1px solid #e3e6ea", borderRadius: 6, padding: "4px 8px", fontSize: 13, fontFamily: "inherit", outline: "none", textAlign: "right", fontWeight: 700 }} autoFocus />
                <button onClick={() => saveEdit(r.id)} style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Gem</button>
                <button onClick={() => setEditId(null)} style={{ background: "none", border: "1px solid #e3e6ea", borderRadius: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", color: "#7f8c9a" }}>×</button>
              </div>
            ) : (
              <button onClick={() => startEdit(r)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{r.monthlyFee.toLocaleString("da-DK")} DKK</div>
                <div style={{ fontSize: 10, color: "#b8bfcc" }}>pr. måned · klik for at redigere</div>
              </button>
            )}
          </div>
        </div>

        {/* Margin summary */}
        {totalExpenses > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10, padding: "8px 10px", background: "#f8f9fb", borderRadius: 7 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#7f8c9a", marginBottom: 1 }}>Fee</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{r.monthlyFee.toLocaleString("da-DK")}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#7f8c9a", marginBottom: 1 }}>Udgifter</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>−{totalExpenses.toLocaleString("da-DK")}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#7f8c9a", marginBottom: 1 }}>Margin</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: margin >= 0 ? "#22c55e" : "#ef4444" }}>{margin.toLocaleString("da-DK")}</div>
            </div>
          </div>
        )}

        {/* Hours bar */}
        {r.hoursIncluded > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#7f8c9a" }}>Timer denne måned</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e" }}>{hoursUsed}t / {r.hoursIncluded}t</span>
            </div>
            <div style={{ height: 5, background: "#f5f1eb", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e", borderRadius: 99, transition: "width 0.3s" }} />
            </div>
          </div>
        )}

        {/* Expenses section toggle */}
        <button onClick={() => setShowExpenses((v) => !v)}
          style={{ fontSize: 10, fontWeight: 700, color: "#5e6470", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, marginBottom: showExpenses ? 8 : 0 }}>
          {showExpenses ? "▾" : "▸"} UDGIFTER {monthExpenses.length > 0 && <span style={{ color: "#7f8c9a", fontWeight: 400 }}>({monthExpenses.length} denne måned)</span>}
        </button>

        {showExpenses && (
          <div>
            {/* Add expense form */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 6, marginBottom: 10, alignItems: "center" }}>
              <input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Beskrivelse (fx 'Linkbuilding via Rhino')"
                style={{ border: "1px solid #e3e6ea", borderRadius: 6, padding: "6px 8px", fontSize: 11, fontFamily: "inherit", outline: "none", background: "#f8f9fb" }} />
              <select value={expCat} onChange={(e) => setExpCat(e.target.value)}
                style={{ border: "1px solid #e3e6ea", borderRadius: 6, padding: "6px 8px", fontSize: 11, fontFamily: "inherit", outline: "none", background: "#f8f9fb", cursor: "pointer" }}>
                {Object.entries(EXPENSE_CATS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
              </select>
              <input value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="DKK" type="number" min="0"
                style={{ width: 80, border: "1px solid #e3e6ea", borderRadius: 6, padding: "6px 8px", fontSize: 11, fontFamily: "inherit", outline: "none", background: "#f8f9fb", textAlign: "right" }} />
              <button onClick={submitExpense}
                style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Tilføj</button>
            </div>
            <div style={{ marginBottom: 8 }}>
              <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)}
                style={{ border: "1px solid #e3e6ea", borderRadius: 6, padding: "5px 8px", fontSize: 11, fontFamily: "inherit", outline: "none", background: "#f8f9fb" }} />
            </div>

            {/* Expense list */}
            {(r.expenses || []).length === 0 ? (
              <p style={{ fontSize: 11, color: "#b8bfcc", margin: "0 0 8px" }}>Ingen udgifter logget endnu.</p>
            ) : (
              <div>
                {(r.expenses || []).map((e) => {
                  const cat = EXPENSE_CATS[e.category] || EXPENSE_CATS.other;
                  return (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #f5f1eb" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: cat.color + "18", borderRadius: 3, padding: "1px 6px", flexShrink: 0 }}>{cat.label}</span>
                      <span style={{ fontSize: 12, color: "#374151", flex: 1 }}>{e.description}</span>
                      <span style={{ fontSize: 11, color: "#7f8c9a", flexShrink: 0 }}>{e.date?.slice(0, 7)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", flexShrink: 0 }}>{(e.amount || 0).toLocaleString("da-DK")}</span>
                      <button onClick={() => onDeleteExpense(r.id, e.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#e2ddd9", lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Status buttons */}
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {Object.entries(RETAINER_STATUSES).map(([k, s]) => (
            <button key={k} onClick={() => onUpdate(r.id, { status: k })}
              style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 5, border: `1px solid ${r.status === k ? s.color : "#e3e6ea"}`, background: r.status === k ? s.color + "18" : "#fff", color: r.status === k ? s.color : "#7f8c9a", cursor: "pointer", fontFamily: "inherit" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Retainer" subtitle="Månedlige kunder og MRR-overblik." />
      <div style={{ background: "#fff", border: "1px solid #e3e6ea", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#7f8c9a", letterSpacing: "0.5px", marginBottom: 4 }}>TOTAL MRR</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", letterSpacing: "-1px" }}>{totalMRR.toLocaleString("da-DK")} DKK</div>
        <div style={{ fontSize: 12, color: "#7f8c9a", marginTop: 2 }}>{active.length} aktive kunder</div>
      </div>
      {active.map((r) => <RetainerCard key={r.id} r={r} />)}
      {inactive.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#b8bfcc", letterSpacing: "0.5px", marginBottom: 10 }}>INAKTIVE</div>
          {inactive.map((r) => <RetainerCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}
