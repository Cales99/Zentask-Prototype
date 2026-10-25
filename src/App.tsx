import { FormEvent, useEffect, useMemo, useState } from "react";

type Page = "dashboard" | "tasks" | "calendar" | "focus" | "statistics" | "community" | "profile" | "settings";
type Task = { id: number; title: string; deadline: string; priority: "High" | "Medium" | "Low"; status: "To do" | "In progress" | "Completed"; duration: number };
type Post = { id: number; author: string; text: string; likes: number; liked: boolean; comments: string[] };

const today = new Date().toISOString().slice(0, 10);
const initialTasks: Task[] = [
  { id: 1, title: "Finish interaction design report", deadline: today, priority: "High", status: "In progress", duration: 90 },
  { id: 2, title: "Review statistics lecture", deadline: today, priority: "Medium", status: "To do", duration: 45 },
  { id: 3, title: "Submit research outline", deadline: new Date(Date.now() + 86400000).toISOString().slice(0, 10), priority: "High", status: "To do", duration: 60 },
  { id: 4, title: "Read chapter 8", deadline: new Date(Date.now() - 86400000).toISOString().slice(0, 10), priority: "Low", status: "Completed", duration: 30 },
];

const nav: { id: Page; label: string; mark: string }[] = [
  { id: "dashboard", label: "Dashboard", mark: "D" }, { id: "tasks", label: "Tasks", mark: "T" },
  { id: "calendar", label: "Calendar", mark: "C" }, { id: "focus", label: "Focus Timer", mark: "F" },
  { id: "statistics", label: "Statistics", mark: "S" }, { id: "community", label: "Community", mark: "Co" },
  { id: "profile", label: "Profile", mark: "P" }, { id: "settings", label: "Settings", mark: "Se" },
];

function Button({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={`btn ${variant}`} {...props}>{children}</button>;
}

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <label className="field"><span>{label}</span><input {...props} aria-invalid={!!error} />{error && <small className="error">{error}</small>}</label>;
}

function Auth({ mode, setMode, onSuccess }: { mode: "welcome" | "login" | "register"; setMode: (v: "welcome" | "login" | "register") => void; onSuccess: (name?: string) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  if (mode === "welcome") return <main className="welcome">
    <section className="welcome-copy">
      <img src="/assets/zentask-logo.png" className="welcome-logo" alt="Zentask" />
      <p className="eyebrow">STUDY WITH INTENTION</p>
      <h1>Make space for what matters.</h1>
      <p className="lead">Plan deadlines, build focus, and care for your wellbeing — all in one calm student workspace.</p>
      <div className="welcome-actions"><Button onClick={() => setMode("register")}>Create account</Button><Button variant="secondary" onClick={() => setMode("login")}>Log in</Button></div>
      <p className="prototype-note">Interactive demo · Your data stays in this browser</p>
    </section>
    <section className="welcome-art" aria-label="A preview of today's student plan">
      <div className="orbit one" /><div className="orbit two" />
      <div className="preview-card">
        <span className="preview-date">TODAY · 3 TASKS</span><strong>Good morning, Alex.</strong>
        <div className="preview-progress"><i /></div>
        <div className="mini-task"><b />Interaction design report <span>Today</span></div>
        <div className="mini-task"><b />Statistics review <span>4:00 PM</span></div>
        <div className="focus-pill">25:00 &nbsp; Start focus</div>
      </div>
    </section>
  </main>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (mode === "register" && form.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 6) next.password = "Use at least 6 characters.";
    if (mode === "register" && form.password !== form.confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (!Object.keys(next).length) onSuccess(form.name || "Alex");
  };
  return <main className="auth-page">
    <section className="auth-panel">
      <button className="back" onClick={() => setMode("welcome")} aria-label="Back">← Back</button>
      <img src="/assets/zentask-logo.png" className="auth-logo" alt="Zentask" />
      <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "YOUR FRESH START"}</p>
      <h1>{mode === "login" ? "Log in to your space" : "Create your account"}</h1>
      <p>{mode === "login" ? "Continue building a calmer study routine." : "Start planning with more clarity and less stress."}</p>
      <form onSubmit={submit} noValidate>
        {mode === "register" && <Field label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={errors.name} />}
        <Field label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="student@university.edu" />
        <div className="password-wrap"><Field label="Password" type={show ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} error={errors.password} /><button type="button" className="show-password" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></div>
        {mode === "register" && <Field label="Confirm password" type={show ? "text" : "password"} value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />}
        <Button type="submit">{mode === "login" ? "Log in" : "Create account"}</Button>
      </form>
      <p className="switch">{mode === "login" ? "New to Zentask?" : "Already have an account?"} <button onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Log in"}</button></p>
      <small>Demo only — no real account is created.</small>
    </section>
  </main>;
}

function TaskModal({ task, onClose, onSave }: { task?: Task; onClose: () => void; onSave: (task: Task) => void }) {
  const [draft, setDraft] = useState<Task>(task || { id: Date.now(), title: "", deadline: today, priority: "Medium", status: "To do", duration: 30 });
  const [error, setError] = useState("");
  const save = (e: FormEvent) => { e.preventDefault(); if (!draft.title.trim()) return setError("Give your task a clear title."); onSave(draft); };
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <form className="modal" onSubmit={save}><div className="modal-head"><div><p className="eyebrow">{task ? "EDIT TASK" : "NEW TASK"}</p><h2>{task ? "Update task" : "What needs doing?"}</h2></div><button type="button" className="close" onClick={onClose} aria-label="Close">×</button></div>
      <Field label="Task title" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} error={error} autoFocus />
      <div className="form-grid"><Field label="Deadline" type="date" value={draft.deadline} onChange={e => setDraft({ ...draft, deadline: e.target.value })} />
        <label className="field"><span>Priority</span><select value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value as Task["priority"] })}><option>High</option><option>Medium</option><option>Low</option></select></label>
        <label className="field"><span>Status</span><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Task["status"] })}><option>To do</option><option>In progress</option><option>Completed</option></select></label>
        <Field label="Estimated minutes" type="number" min={5} step={5} value={draft.duration} onChange={e => setDraft({ ...draft, duration: +e.target.value })} />
      </div><div className="modal-actions"><Button variant="ghost" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Save task</Button></div>
    </form>
  </div>;
}

function TaskRows({ tasks, onToggle, onEdit, onDelete }: { tasks: Task[]; onToggle: (id: number) => void; onEdit: (t: Task) => void; onDelete: (id: number) => void }) {
  if (!tasks.length) return <div className="empty"><strong>Nothing here yet</strong><p>Try another filter or add a task to your plan.</p></div>;
  return <div className="task-list">{tasks.map(t => <article className={`task-row ${t.status === "Completed" ? "done" : ""}`} key={t.id}>
    <button className="check" onClick={() => onToggle(t.id)} aria-label={t.status === "Completed" ? "Mark incomplete" : "Mark complete"}>{t.status === "Completed" ? "✓" : ""}</button>
    <div className="task-main"><strong>{t.title}</strong><span>{t.deadline === today ? "Today" : new Date(`${t.deadline}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {t.duration} min</span></div>
    <span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span>
    <button className="text-action" onClick={() => onEdit(t)}>Edit</button><button className="text-action danger-text" onClick={() => onDelete(t.id)}>Delete</button>
  </article>)}</div>;
}

function FocusTimer() {
  const [mode, setMode] = useState<"Focus" | "Short break" | "Long break">("Focus");
  const durations = { Focus: 1500, "Short break": 300, "Long break": 900 };
  const [seconds, setSeconds] = useState(1500), [running, setRunning] = useState(false), [complete, setComplete] = useState(false);
  useEffect(() => { if (!running) return; const id = setInterval(() => setSeconds(s => { if (s <= 1) { setRunning(false); setComplete(true); return 0; } return s - 1; }), 1000); return () => clearInterval(id); }, [running]);
  const change = (m: typeof mode) => { setMode(m); setSeconds(durations[m]); setRunning(false); setComplete(false); };
  const reset = () => { setSeconds(durations[mode]); setRunning(false); setComplete(false); };
  return <section className="focus-layout"><div className="timer-card">
    <p className="eyebrow">FOCUS SPACE</p><h2>{complete ? "Session complete" : running ? "You are in the zone" : "Ready when you are"}</h2>
    <div className="segmented">{(Object.keys(durations) as (keyof typeof durations)[]).map(m => <button className={m === mode ? "active" : ""} onClick={() => change(m)} key={m}>{m}</button>)}</div>
    <div className="timer-ring" style={{ "--progress": `${((durations[mode] - seconds) / durations[mode]) * 360}deg` } as React.CSSProperties}><div><strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong><span>{mode}</span></div></div>
    <div className="timer-actions"><Button onClick={() => setRunning(!running)} disabled={complete}>{running ? "Pause" : seconds < durations[mode] ? "Resume" : "Start session"}</Button><Button variant="ghost" onClick={reset}>Reset</Button></div>
    {complete && <div className="success">Great work. Take a breath before your next session.</div>}
  </div><aside className="card"><p className="eyebrow">FOCUS TIP</p><h3>Make distraction harder</h3><p>Silence notifications and keep only the material you need open.</p><div className="stat-line"><span>Today</span><strong>2 sessions · 50 min</strong></div></aside></section>;
}

function AppContent() {
  const [page, setPage] = useState<Page>("dashboard");
  const [tasks, setTasks] = useState<Task[]>(() => { try { return JSON.parse(localStorage.getItem("zentask-tasks") || "") || initialTasks; } catch { return initialTasks; } });
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);
  const [filter, setFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(today);
  const [month, setMonth] = useState(new Date());
  const [toast, setToast] = useState("");
  const [name, setName] = useState(localStorage.getItem("zentask-name") || "Alex");
  const [wellness, setWellness] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<"open" | "accepted" | "dismissed">("open");
  const [posts, setPosts] = useState<Post[]>([{ id: 1, author: "Maya R.", text: "Small win: finished my literature review draft two days early. The 25-minute sessions really helped.", likes: 18, liked: false, comments: ["That is inspiring — well done!"] }]);
  const [postText, setPostText] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [settings, setSettings] = useState({ reminders: true, sound: true, wellness: true });
  const completed = tasks.filter(t => t.status === "Completed").length;
  useEffect(() => localStorage.setItem("zentask-tasks", JSON.stringify(tasks)), [tasks]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(""), 2400); return () => clearTimeout(id); }, [toast]);
  const toggle = (id: number) => setTasks(ts => ts.map(t => t.id === id ? { ...t, status: t.status === "Completed" ? "To do" : "Completed" } : t));
  const saveTask = (task: Task) => { setTasks(ts => ts.some(t => t.id === task.id) ? ts.map(t => t.id === task.id ? task : t) : [task, ...ts]); setModalTask(undefined); setToast("Task saved to your plan."); };
  const remove = (id: number) => { if (confirm("Delete this task? This cannot be undone.")) { setTasks(ts => ts.filter(t => t.id !== id)); setToast("Task deleted."); } };
  const title = nav.find(n => n.id === page)?.label;
  const filtered = tasks.filter(t => filter === "All" || t.priority === filter || t.status === filter);
  const calendarDays = Array.from({ length: 35 }, (_, i) => { const d = new Date(month.getFullYear(), month.getMonth(), i - new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 1); return d; });
  const logout = () => { localStorage.removeItem("zentask-session"); location.reload(); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}><div className="brand"><img src="/assets/zentask-logo.png" alt="Zentask" /></div>
      <nav>{nav.map(item => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setMobileNav(false); }}><span>{item.mark}</span>{item.label}</button>)}</nav>
      <div className="sidebar-goal"><small>DAILY GOAL</small><strong>{completed}/4 tasks</strong><div><i style={{ width: `${Math.min(100, completed * 25)}%` }} /></div></div>
      <button className="logout" onClick={logout}>Log out</button>
    </aside>
    <main className="main">
      <header className="topbar"><button className="menu" onClick={() => setMobileNav(!mobileNav)}>Menu</button><div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p><h1>{title}</h1></div><button className="profile-chip" onClick={() => setPage("profile")}><img src="/assets/profile.png" alt="" /><span>{name}<small>Student · {completed * 25 + 120} pts</small></span></button></header>
      <div className="content">
        {page === "dashboard" && <><section className="hero"><div><p className="eyebrow">YOUR DAY AT A GLANCE</p><h2>Good morning, {name}.</h2><p>You have {tasks.filter(t => t.deadline === today && t.status !== "Completed").length} tasks left today. Start with the one that will create the most relief.</p><div className="hero-actions"><Button onClick={() => setModalTask(null)}>Add a task</Button><Button variant="secondary" onClick={() => setPage("focus")}>Start focus</Button></div></div><div className="progress-orb"><strong>{Math.round((completed / Math.max(tasks.length, 1)) * 100)}%</strong><span>weekly progress</span></div></section>
          <div className="dashboard-grid"><section className="card span2"><div className="section-head"><div><p className="eyebrow">TODAY</p><h3>Your priorities</h3></div><button onClick={() => setPage("tasks")}>View all</button></div><TaskRows tasks={tasks.filter(t => t.deadline === today).slice(0, 3)} onToggle={toggle} onEdit={setModalTask} onDelete={remove} /></section>
            <section className="card"><p className="eyebrow">SMART SCHEDULE · DEMO</p><h3>Best next step</h3>{suggestion === "open" ? <><p><strong>{tasks.find(t => t.status !== "Completed")?.title}</strong></p><p className="muted">Suggested at 2:30 PM for 45 minutes, based on deadline and priority.</p><div className="inline-actions"><Button onClick={() => { setSuggestion("accepted"); setToast("Suggestion added to your plan."); }}>Accept</Button><Button variant="ghost" onClick={() => setSuggestion("dismissed")}>Dismiss</Button></div></> : <div className="empty compact"><strong>{suggestion === "accepted" ? "Added to your plan" : "Suggestion dismissed"}</strong><button onClick={() => setSuggestion("open")}>Undo</button></div>}</section>
            <section className="card"><p className="eyebrow">WELLBEING</p><h3>A balanced study day</h3>{["Drink water", "Take a 5-minute stretch", "Eat away from your desk"].map(w => <label className="wellness" key={w}><input type="checkbox" checked={wellness.includes(w)} onChange={() => setWellness(v => v.includes(w) ? v.filter(x => x !== w) : [...v, w])} /><span>{w}</span></label>)}</section>
            <section className="card span2"><div className="section-head"><div><p className="eyebrow">THIS WEEK</p><h3>Momentum</h3></div><strong>{completed * 25 + 120} points</strong></div><div className="bars">{[45, 72, 58, 88, 64, 30, 18].map((h, i) => <div key={i}><i style={{ height: `${h}%` }} /><span>{"MTWTFSS"[i]}</span></div>)}</div></section>
          </div></>}

        {page === "tasks" && <section><div className="page-actions"><div className="filters">{["All", "High", "Medium", "Low", "To do", "Completed"].map(f => <button className={filter === f ? "active" : ""} onClick={() => setFilter(f)} key={f}>{f}</button>)}</div><Button onClick={() => setModalTask(null)}>Add task</Button></div><div className="card"><TaskRows tasks={filtered} onToggle={toggle} onEdit={setModalTask} onDelete={remove} /></div></section>}

        {page === "calendar" && <div className="calendar-layout"><section className="card calendar"><div className="section-head"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}>← Previous</button><h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}>Next →</button></div><div className="weekdays">{"SMTWTFS".split("").map((d, i) => <span key={i}>{d}</span>)}</div><div className="calendar-grid">{calendarDays.map((d, i) => { const iso = d.toISOString().slice(0, 10); return <button key={i} className={`${d.getMonth() !== month.getMonth() ? "outside" : ""} ${iso === selectedDate ? "selected" : ""}`} onClick={() => setSelectedDate(iso)}><span>{d.getDate()}</span>{tasks.some(t => t.deadline === iso) && <i />}</button>; })}</div></section><aside className="card"><p className="eyebrow">SELECTED DATE</p><h3>{new Date(`${selectedDate}T00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3><TaskRows tasks={tasks.filter(t => t.deadline === selectedDate)} onToggle={toggle} onEdit={setModalTask} onDelete={remove} /></aside></div>}
        {page === "focus" && <FocusTimer />}
        {page === "statistics" && <div className="stats-grid"><section className="hero span-all"><div><p className="eyebrow">WEEKLY REFLECTION</p><h2>Your consistency is growing.</h2><p>{completed} of {tasks.length} available demo tasks are complete.</p></div><div className="progress-orb"><strong>{completed}/{tasks.length}</strong><span>completed</span></div></section>{[{ k: "Completion rate", v: `${Math.round(completed / Math.max(tasks.length, 1) * 100)}%` }, { k: "Focus time", v: "2h 35m" }, { k: "Current streak", v: "4 days" }].map(x => <section className="card metric" key={x.k}><span>{x.k}</span><strong>{x.v}</strong></section>)}<section className="card span-all"><h3>Last 7 days</h3><div className="bars large">{[45, 72, 58, 88, 64, 30, 18].map((h, i) => <div key={i}><i style={{ height: `${h}%` }} /><span>{"MTWTFSS"[i]}</span></div>)}</div><p className="muted">Statistics combine your current local demo tasks with illustrative focus-session data.</p></section></div>}
        {page === "community" && <div className="community-grid"><section className="card"><p className="eyebrow">STUDENT COMMUNITY · DEMO</p><h2>Share a small win</h2><textarea placeholder="What helped you move forward today?" value={postText} onChange={e => setPostText(e.target.value)} /><Button disabled={!postText.trim()} onClick={() => { setPosts([{ id: Date.now(), author: name, text: postText, likes: 0, liked: false, comments: [] }, ...posts]); setPostText(""); setToast("Your demo post was shared."); }}>Create post</Button></section><section className="feed">{posts.map(p => <article className="card post" key={p.id}><div className="post-author"><span>{p.author[0]}</span><strong>{p.author}<small>Student community</small></strong></div><p>{p.text}</p><div className="post-actions"><button onClick={() => setPosts(ps => ps.map(x => x.id === p.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x))}>{p.liked ? "Liked" : "Like"} · {p.likes}</button><button onClick={() => { const c = prompt("Write a supportive comment"); if (c) setPosts(ps => ps.map(x => x.id === p.id ? { ...x, comments: [...x.comments, c] } : x)); }}>Comment · {p.comments.length}</button></div>{p.comments.map((c, i) => <div className="comment" key={i}>{c}</div>)}</article>)}</section></div>}
        {page === "profile" && <Profile name={name} onSave={n => { setName(n); localStorage.setItem("zentask-name", n); setToast("Profile updated."); }} />}
        {page === "settings" && <section className="settings-grid"><div className="card"><p className="eyebrow">PREFERENCES</p><h2>Shape your Zentask</h2>{([["reminders", "Break reminders", "Receive gentle nudges during long study blocks."], ["sound", "Timer sound", "Play a tone when a focus session ends."], ["wellness", "Wellbeing prompts", "Show daily movement, meal, and rest tips."]] as const).map(([key, label, desc]) => <label className="toggle-row" key={key}><span><strong>{label}</strong><small>{desc}</small></span><input type="checkbox" checked={settings[key]} onChange={() => setSettings({ ...settings, [key]: !settings[key] })} /></label>)}<div className="inline-actions"><Button onClick={() => setToast("Settings saved in this session.")}>Save settings</Button><Button variant="ghost" onClick={() => setSettings({ reminders: true, sound: true, wellness: true })}>Cancel changes</Button></div></div><div className="card danger-zone"><h3>Session</h3><p>This prototype stores task data only in this browser. Logging out does not create or secure an account.</p><Button variant="danger" onClick={logout}>Log out</Button></div></section>}
      </div>
    </main>
    {modalTask !== undefined && <TaskModal task={modalTask || undefined} onClose={() => setModalTask(undefined)} onSave={saveTask} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}

function Profile({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState(name);
  return <section className="profile-page"><div className="profile-banner"><img src="/assets/profile.png" alt="Profile" /><div><p className="eyebrow">STUDENT PROFILE</p><h2>{name}</h2><p>Computer Science · Year 3</p></div></div><div className="card profile-form"><h3>Basic details</h3>{editing ? <><Field label="Display name" value={draft} onChange={e => setDraft(e.target.value)} /><Field label="University email" value="student@university.edu" disabled /><div className="inline-actions"><Button onClick={() => { onSave(draft); setEditing(false); }}>Save changes</Button><Button variant="ghost" onClick={() => { setDraft(name); setEditing(false); }}>Cancel</Button></div></> : <><dl><div><dt>Name</dt><dd>{name}</dd></div><div><dt>Email</dt><dd>student@university.edu</dd></div><div><dt>Course</dt><dd>Computer Science</dd></div></dl><Button onClick={() => setEditing(true)}>Edit profile</Button></>}</div><div className="badges"><div className="card"><span className="badge-mark">4</span><strong>Day streak</strong><small>Consistent learner</small></div><div className="card"><span className="badge-mark">8</span><strong>Tasks this week</strong><small>Getting things done</small></div></div></section>;
}

export default function App() {
  const [mode, setMode] = useState<"welcome" | "login" | "register" | "app">(() => localStorage.getItem("zentask-session") ? "app" : "welcome");
  if (mode !== "app") return <Auth mode={mode} setMode={setMode} onSuccess={name => { localStorage.setItem("zentask-session", "demo"); if (name) localStorage.setItem("zentask-name", name); setMode("app"); }} />;
  return <AppContent />;
}
