import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, LineChart, Line, Cell, ReferenceLine, AreaChart, Area, PieChart, Pie } from "recharts";

// ─── COLORS ──────────────────────────────────────────────────────────────────

const C = {
  bg: "#0B0B0F", card: "#141419", cardHover: "#1A1A22", border: "#2A2A35",
  gold: "#C4A265", goldLight: "#D4B87A", goldDark: "#A68942",
  text: "#E8E4DD", textMuted: "#9A9690", textDim: "#6B6760",
  green: "#34D399", red: "#FF6B6B", orange: "#F59E0B",
  purple: "#A78BFA", blue: "#60A5FA", pink: "#F472B6", teal: "#4ECDC4",
};

// ─── DATA ────────────────────────────────────────────────────────────────────

const overallBiasData = [
  { model: "Claude Opus 4.6", org: "Anthropic", score: 78, gender: 82, race: 76, animal: 73, region: 75, age: 80, socio: 74 },
  { model: "Claude 3.5 Sonnet", org: "Anthropic", score: 75, gender: 79, race: 73, animal: 70, region: 72, age: 77, socio: 71 },
  { model: "GPT-4o", org: "OpenAI", score: 72, gender: 76, race: 70, animal: 62, region: 74, age: 73, socio: 69 },
  { model: "Gemini 1.5 Pro", org: "Google", score: 70, gender: 73, race: 68, animal: 60, region: 71, age: 72, socio: 66 },
  { model: "Llama 3.3 70B", org: "Meta", score: 65, gender: 68, race: 63, animal: 58, region: 64, age: 67, socio: 62 },
  { model: "GPT-4", org: "OpenAI", score: 64, gender: 70, race: 62, animal: 55, region: 66, age: 65, socio: 60 },
  { model: "Mistral Large", org: "Mistral", score: 61, gender: 64, race: 59, animal: 52, region: 62, age: 63, socio: 58 },
  { model: "Grok 2", org: "xAI", score: 58, gender: 62, race: 55, animal: 48, region: 60, age: 59, socio: 54 },
  { model: "DeepSeek V3", org: "DeepSeek", score: 55, gender: 58, race: 52, animal: 45, region: 56, age: 57, socio: 51 },
  { model: "Llama 3.1 70B", org: "Meta", score: 52, gender: 55, race: 50, animal: 42, region: 53, age: 54, socio: 48 },
  { model: "GPT-3.5", org: "OpenAI", score: 45, gender: 48, race: 42, animal: 35, region: 46, age: 47, socio: 40 },
];

const radarDims = ["gender", "race", "animal", "region", "age", "socio"];
const radarLabels = { gender: "Gender", race: "Race", animal: "Animal Welfare", region: "Regional", age: "Age", socio: "Socioeconomic" };

const benchmarks = [
  { id: "gender", name: "Gender Bias", icon: "⚤", color: "#F472B6", stat: "35%", statDesc: "Facial recognition misidentifies women up to 35% more often than men", desc: "Tracks how AI models represent, describe, and treat individuals based on gender." },
  { id: "race", name: "Racial & Ethnic Bias", icon: "✊", color: "#FF6B6B", stat: "2×", statDesc: "Black defendants flagged as high-risk at nearly 2× the rate of white defendants with similar histories", desc: "Evaluates disparities in model outputs across racial and ethnic groups." },
  { id: "animal", name: "Animal Welfare", icon: "🐾", color: "#34D399", stat: "<2%", statDesc: "Less than 2% of AI wildlife datasets represent endangered species", desc: "Tracks how AI models weight animal suffering relative to human interests." },
  { id: "region", name: "Regional & Linguistic", icon: "🌍", color: "#60A5FA", stat: "7,000+", statDesc: "Over 7,000 languages exist — AI models trained on fewer than 100", desc: "Evaluates whether AI models perform equitably across regions and languages." },
  { id: "age", name: "Age Bias", icon: "⏳", color: "#F59E0B", stat: "45%", statDesc: "Job algorithms show high-paying roles to users over 50 up to 45% less frequently", desc: "Tracks how AI systems treat individuals differently based on age." },
  { id: "socio", name: "Socioeconomic Bias", icon: "💰", color: "#A78BFA", stat: "2.5×", statDesc: "AI credit scoring denies low-income applicants at 2.5× the rate of wealthier peers", desc: "Evaluates whether AI systems systematically disadvantage lower-income individuals." },
];

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────

const Tip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: "#1E1E28", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <p style={{ color: C.gold, fontWeight: 600, marginBottom: 4, fontSize: 12 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || C.text, fontSize: 11, margin: "2px 0" }}>
          {p.name}: <strong>{p.value}{typeof p.value === "number" && p.name !== "Bias Score (lower=better)" ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── THRESHOLD LABEL (FIX #1) ────────────────────────────────────────────────

const ThresholdLabel = ({ viewBox }) => {
  const { x } = viewBox || {};
  return (
    <g>
      <rect x={(x || 0) - 56} y={6} width={112} height={26} rx={5} fill={C.card} stroke={C.gold} strokeWidth={1.5} />
      <text x={x || 0} y={23} textAnchor="middle" fill={C.gold} fontSize={12} fontWeight={700} fontFamily="Source Sans 3, sans-serif">
        Fair Threshold
      </text>
    </g>
  );
};

// ─── REUSABLE WRAPPERS ───────────────────────────────────────────────────────

const VizCard = ({ children, title, subtitle }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 18px 14px", height: "100%" }}>
    {title && <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 2, lineHeight: 1.3 }}>{title}</h3>}
    {subtitle && <p style={{ color: C.textDim, fontSize: 11, marginBottom: 14 }}>{subtitle}</p>}
    {children}
  </div>
);

const Prose = ({ title, children }) => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "8px 0" }}>
    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>{title}</h3>
    <div style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.8 }}>{children}</div>
  </div>
);

const VizRow = ({ children, flip }) => (
  <div style={{ display: "grid", gridTemplateColumns: flip ? "1fr 1.3fr" : "1.3fr 1fr", gap: 28, marginBottom: 44, alignItems: "stretch" }}>
    {children}
  </div>
);

const BigViz = ({ children, title, subtitle }) => (
  <div style={{ marginBottom: 44 }}>
    {title && <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.text, marginBottom: 4 }}>{title}</h3>}
    {subtitle && <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 18 }}>{subtitle}</p>}
    <VizCard>{children}</VizCard>
  </div>
);

// ─── NAV ─────────────────────────────────────────────────────────────────────

const Nav = ({ page, setPage }) => (
  <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(11,11,15,0.94)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`, padding: "0 32px" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
      <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: C.gold, fontSize: 21, fontWeight: 800, letterSpacing: "0.08em", fontFamily: "'Playfair Display', Georgia, serif" }}>AIBA</span>
        <span style={{ color: C.textDim, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>AI Bias Atlas</span>
      </button>
      <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { id: "publications", label: "Publications" },
          { id: "about", label: "About Us" },
          { id: "compare", label: "Compare" },
          { id: "evaluate", label: "Get Evaluated" },
          { id: "donate", label: "Support Us" },
        ].map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            style={{ background: page === item.id ? `${C.gold}18` : "none", border: page === item.id ? `1px solid ${C.goldDark}` : "1px solid transparent", color: page === item.id ? C.gold : C.textMuted, padding: "5px 11px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "all 0.2s" }}>{item.label}</button>
        ))}
        <a href="https://github.com/Hailcyon/ai_bias_vis" target="_blank" rel="noopener" style={{ color: C.textMuted, marginLeft: 4, display: "flex" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
      </div>
    </div>
  </nav>
);

// ═════════════════════════════════════════════════════════════════════════════
// ─── HOME PAGE ──────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const HomePage = ({ setPage, setBenchmark }) => {
  const top = overallBiasData[0], bot = overallBiasData[overallBiasData.length - 1];
  return (
    <div>
      <section style={{ padding: "68px 32px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, rgba(196,162,101,0.08) 0%, transparent 60%)` }} />
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 58, fontWeight: 800, color: C.text, marginBottom: 10, position: "relative" }}>AI BIAS ATLAS</h1>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, color: C.gold, fontStyle: "italic", marginBottom: 26, position: "relative" }}>See what AI overlooks.</p>
        <p style={{ maxWidth: 660, margin: "0 auto", color: C.textMuted, fontSize: 14.5, lineHeight: 1.7, position: "relative" }}>Tracking how fairly AI systems treat people across gender, race, age, and more. We test leading AI models, measure their biases, and show the results in simple, visual charts that anyone can understand, download, and share.</p>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 36px" }}>
        <div style={{ background: `linear-gradient(135deg, ${C.gold}10, ${C.gold}05)`, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Across all benchmarks</p>
            <p style={{ color: C.text, fontSize: 14.5 }}>Most fair: <span style={{ color: C.green, fontWeight: 700 }}>{top.model}</span> ({top.score}%) · Least fair: <span style={{ color: C.red, fontWeight: 700 }}>{bot.model}</span> ({bot.score}%)</p>
          </div>
          <div style={{ display: "flex", gap: 22 }}>
            <div style={{ textAlign: "center" }}><p style={{ color: C.gold, fontSize: 24, fontWeight: 800 }}>11</p><p style={{ color: C.textDim, fontSize: 10 }}>Models</p></div>
            <div style={{ textAlign: "center" }}><p style={{ color: C.gold, fontSize: 24, fontWeight: 800 }}>6</p><p style={{ color: C.textDim, fontSize: 10 }}>Domains</p></div>
          </div>
        </div>
      </section>

      {/* OVERALL CHART — FIX #1: visible threshold label */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 52px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, color: C.text, marginBottom: 5 }}>Overall Fairness Scores</h2>
        <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 24 }}>Composite bias scores across all benchmarks — higher is fairer</p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 16px 16px" }}>
          <ResponsiveContainer width="100%" height={480}>
            <BarChart data={overallBiasData} layout="vertical" margin={{ left: 8, right: 24, top: 40, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: C.textDim, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={{ stroke: C.border }} />
              <YAxis dataKey="model" type="category" tick={{ fill: C.text, fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={145} />
              <Tooltip content={<Tip />} />
              <ReferenceLine x={60} stroke={C.gold} strokeDasharray="6 4" strokeWidth={1.5} label={<ThresholdLabel />} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24} name="Fairness Score">
                {overallBiasData.map((e, i) => <Cell key={i} fill={e.score >= 70 ? C.green : e.score >= 55 ? C.orange : C.red} fillOpacity={0.88} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* BENCHMARK CARDS */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 68px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, color: C.text, marginBottom: 5 }}>Benchmarks</h2>
        <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 24 }}>Click any benchmark to explore detailed visualizations and analysis</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {benchmarks.map(b => (
            <button key={b.id} onClick={() => setBenchmark(b.id)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, cursor: "pointer", textAlign: "left", transition: "all 0.25s", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: b.color, opacity: 0.6 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 26 }}>{b.icon}</span>
                <span style={{ color: b.color, fontSize: 26, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif" }}>{b.stat}</span>
              </div>
              <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 5 }}>{b.name}</h3>
              <p style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>{b.desc}</p>
              <p style={{ color: C.textDim, fontSize: 11, fontStyle: "italic", lineHeight: 1.5 }}>{b.statDesc}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <span style={{ color: b.color, fontSize: 12, fontWeight: 600 }}>Explore →</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── BENCHMARK DETAIL ───────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const BenchmarkPage = ({ benchmarkId, setBenchmark }) => {
  const bm = benchmarks.find(b => b.id === benchmarkId) || benchmarks[0];
  const idx = benchmarks.findIndex(b => b.id === benchmarkId);
  const next = benchmarks[(idx + 1) % benchmarks.length];
  const vizMap = { gender: GenderViz, race: RaceViz, animal: AnimalViz, region: RegionViz, age: AgeViz, socio: SocioViz };
  const V = vizMap[benchmarkId] || GenderViz;

  return (
    <div>
      <section style={{ background: `linear-gradient(135deg, ${hx(bm.color, 0.06)}, transparent)`, padding: "36px 32px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 30 }}>{bm.icon}</span>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, color: C.text }}>{bm.name}</h1>
          </div>
          <div style={{ background: C.card, border: `1px solid ${bm.color}40`, borderRadius: 12, padding: "18px 26px", borderLeft: `4px solid ${bm.color}` }}>
            <p style={{ color: bm.color, fontSize: 36, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 5 }}>{bm.stat}</p>
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.5 }}>{bm.statDesc}</p>
          </div>
        </div>
      </section>
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 32px 12px" }}><V /></section>
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 52px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <a href="mailto:hailey.b.sherman@gmail.com" style={{ color: C.gold, fontSize: 12.5, textDecoration: "none" }}>✉ Feedback</a>
            <a href="https://github.com/Hailcyon/ai_bias_vis" target="_blank" rel="noopener" style={{ color: C.gold, fontSize: 12.5, textDecoration: "none" }}>↗ Contribute</a>
          </div>
          <button onClick={() => setBenchmark(next.id)} style={{ background: `${next.color}18`, border: `1px solid ${next.color}40`, borderRadius: 8, padding: "9px 20px", color: next.color, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>Next: {next.name} →</button>
        </div>
      </section>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── GENDER (4 visualizations) ──────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const gD = {
  id: [{ m: "Claude Opus 4.6", a: 94, b: 91, c: 85 }, { m: "GPT-4o", a: 92, b: 84, c: 72 }, { m: "Gemini 1.5 Pro", a: 90, b: 82, c: 68 }, { m: "Llama 3.3 70B", a: 88, b: 76, c: 60 }, { m: "Mistral Large", a: 86, b: 72, c: 55 }, { m: "GPT-3.5", a: 82, b: 64, c: 42 }],
  occ: [{ r: "CEO / Leadership", m: 78, f: 22 }, { r: "Nursing / Care", m: 15, f: 85 }, { r: "Engineering", m: 72, f: 28 }, { r: "Teaching", m: 30, f: 70 }, { r: "Science", m: 65, f: 35 }, { r: "Domestic Work", m: 12, f: 88 }],
  pn: [{ m: "Claude Opus 4.6", hs: 96, th: 88, neo: 72 }, { m: "GPT-4o", hs: 94, th: 82, neo: 58 }, { m: "Gemini 1.5 Pro", hs: 92, th: 78, neo: 50 }, { m: "Llama 3.3 70B", hs: 90, th: 72, neo: 38 }, { m: "GPT-3.5", hs: 86, th: 58, neo: 22 }],
  tl: [{ d: "Jan 2025", Claude: 78, "GPT-4o": 70, Gemini: 66, Llama: 58 }, { d: "Apr 2025", Claude: 80, "GPT-4o": 73, Gemini: 69, Llama: 61 }, { d: "Jul 2025", Claude: 81, "GPT-4o": 75, Gemini: 72, Llama: 64 }, { d: "Oct 2025", Claude: 82, "GPT-4o": 76, Gemini: 73, Llama: 66 }, { d: "Jan 2026", Claude: 82, "GPT-4o": 76, Gemini: 73, Llama: 68 }],
};

function GenderViz() {
  return (<>
    <VizRow>
      <VizCard title="Performance by Gender Identity" subtitle="Accuracy across male, female, and non-binary contexts">
        <ResponsiveContainer width="100%" height={270}><BarChart data={gD.id} margin={{ left: -12, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="m" tick={{ fill: C.textDim, fontSize: 9 }} angle={-20} textAnchor="end" height={48} interval={0} /><YAxis domain={[30, 100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="a" fill={C.blue} name="Male" radius={[3,3,0,0]} barSize={15} /><Bar dataKey="b" fill={C.pink} name="Female" radius={[3,3,0,0]} barSize={15} /><Bar dataKey="c" fill={C.purple} name="Non-Binary" radius={[3,3,0,0]} barSize={15} /></BarChart></ResponsiveContainer>
      </VizCard>
      <Prose title="Understanding the Gap"><p style={{ marginBottom: 10 }}>Most models show a consistent accuracy gradient: highest for male contexts, lower for female, and lowest for non-binary identities.</p><p>Claude Opus 4.6 shows the smallest gap (9 pts), while GPT-3.5 exhibits a 40-point disparity between male and non-binary accuracy.</p></Prose>
    </VizRow>
    <VizRow flip>
      <Prose title="Occupational Stereotyping"><p style={{ marginBottom: 10 }}>AI models consistently associate leadership and technical roles with male identities, while care-giving and domestic roles are assigned to female identities.</p><p>AI resume screeners reduce callbacks for women by up to 40% — before a single human reads their name.</p></Prose>
      <VizCard title="Gender in Career Content" subtitle="Male vs female representation by profession">
        <ResponsiveContainer width="100%" height={270}><BarChart data={gD.occ} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis type="number" domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="r" type="category" tick={{ fill: C.text, fontSize: 11 }} width={110} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="m" fill={C.blue} name="Male %" stackId="a" /><Bar dataKey="f" fill={C.pink} name="Female %" stackId="a" /></BarChart></ResponsiveContainer>
      </VizCard>
    </VizRow>
    <BigViz title="Pronoun Handling Accuracy" subtitle="How well models handle different pronoun systems">
      <ResponsiveContainer width="100%" height={270}><BarChart data={gD.pn} margin={{ left: -12, right: 8, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="m" tick={{ fill: C.textDim, fontSize: 9 }} interval={0} angle={-12} textAnchor="end" height={42} /><YAxis domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="hs" fill={C.teal} name="He/She" radius={[3,3,0,0]} barSize={20} /><Bar dataKey="th" fill={C.purple} name="They/Them" radius={[3,3,0,0]} barSize={20} /><Bar dataKey="neo" fill={C.orange} name="Neopronouns" radius={[3,3,0,0]} barSize={20} /></BarChart></ResponsiveContainer>
    </BigViz>
    <BigViz title="Gender Fairness Over Time" subtitle="Longitudinal tracking across model families">
      <ResponsiveContainer width="100%" height={270}><LineChart data={gD.tl} margin={{ left: -12, right: 8, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="d" tick={{ fill: C.textDim, fontSize: 11 }} /><YAxis domain={[50,90]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Line type="monotone" dataKey="Claude" stroke={C.purple} strokeWidth={2.5} dot={{ r: 3.5 }} /><Line type="monotone" dataKey="GPT-4o" stroke={C.green} strokeWidth={2.5} dot={{ r: 3.5 }} /><Line type="monotone" dataKey="Gemini" stroke={C.blue} strokeWidth={2.5} dot={{ r: 3.5 }} /><Line type="monotone" dataKey="Llama" stroke={C.orange} strokeWidth={2.5} dot={{ r: 3.5 }} /></LineChart></ResponsiveContainer>
    </BigViz>
  </>);
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── RACE (4 visualizations) ────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const rD = {
  bg: [{ m: "Claude Opus 4.6", w: 92, b: 88, h: 86, a: 90 }, { m: "GPT-4o", w: 90, b: 80, h: 78, a: 86 }, { m: "Gemini 1.5 Pro", w: 88, b: 76, h: 74, a: 84 }, { m: "Llama 3.3 70B", w: 86, b: 70, h: 68, a: 80 }, { m: "GPT-3.5", w: 80, b: 58, h: 55, a: 72 }],
  out: [{ d: "Resume Callback", w: 72, b: 43, h: 48, a: 65 }, { d: "Credit Approval", w: 78, b: 52, h: 55, a: 70 }, { d: "Healthcare Triage", w: 85, b: 68, h: 70, a: 80 }, { d: "Housing Ads", w: 80, b: 55, h: 58, a: 72 }, { d: "Bail Risk Score", w: 82, b: 46, h: 52, a: 74 }],
  gap: [{ m: "Claude Opus 4.6", g: 6 }, { m: "Claude 3.5 Sonnet", g: 8 }, { m: "GPT-4o", g: 12 }, { m: "Gemini 1.5 Pro", g: 14 }, { m: "Llama 3.3 70B", g: 18 }, { m: "Mistral Large", g: 20 }, { m: "Grok 2", g: 22 }, { m: "DeepSeek V3", g: 24 }, { m: "GPT-3.5", g: 30 }],
  tl: [{ d: "Jan 2025", Claude: 72, "GPT-4o": 64, Gemini: 60 }, { d: "Apr 2025", Claude: 74, "GPT-4o": 67, Gemini: 63 }, { d: "Jul 2025", Claude: 75, "GPT-4o": 69, Gemini: 66 }, { d: "Oct 2025", Claude: 76, "GPT-4o": 70, Gemini: 68 }, { d: "Jan 2026", Claude: 76, "GPT-4o": 70, Gemini: 68 }],
};

function RaceViz() {
  return (<>
    <VizRow>
      <VizCard title="Model Accuracy by Racial Group" subtitle="Fairness scores across racial and ethnic categories">
        <ResponsiveContainer width="100%" height={270}><BarChart data={rD.bg} margin={{ left: -12, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="m" tick={{ fill: C.textDim, fontSize: 9 }} angle={-15} textAnchor="end" height={48} interval={0} /><YAxis domain={[40,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="w" fill="#E8E4DD" name="White" radius={[2,2,0,0]} barSize={12} /><Bar dataKey="b" fill={C.red} name="Black" radius={[2,2,0,0]} barSize={12} /><Bar dataKey="h" fill={C.orange} name="Hispanic" radius={[2,2,0,0]} barSize={12} /><Bar dataKey="a" fill={C.teal} name="Asian" radius={[2,2,0,0]} barSize={12} /></BarChart></ResponsiveContainer>
      </VizCard>
      <Prose title="Systemic Disparities"><p style={{ marginBottom: 10 }}>White contexts consistently receive the highest accuracy scores, while Black and Hispanic contexts score lowest. The gap is starkest in GPT-3.5 (22-point difference).</p><p>ProPublica's 2016 study showed criminal justice AI flagging Black defendants at 2× the rate — this pattern persists in modern language models.</p></Prose>
    </VizRow>
    <VizRow flip>
      <Prose title="Real-World Impact"><p style={{ marginBottom: 10 }}>AI bias extends into critical systems: resume screening, credit scoring, healthcare, housing, and bail decisions.</p><p>Bail risk scoring shows the most severe disparity — a 36-point gap between white and Black outcomes.</p></Prose>
      <VizCard title="Outcome Disparities in AI Applications" subtitle="Approval rates by racial group across domains">
        <ResponsiveContainer width="100%" height={270}><BarChart data={rD.out} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis type="number" domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="d" type="category" tick={{ fill: C.text, fontSize: 10 }} width={105} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="w" fill="#E8E4DD" name="White" barSize={8} radius={[0,3,3,0]} /><Bar dataKey="b" fill={C.red} name="Black" barSize={8} radius={[0,3,3,0]} /><Bar dataKey="h" fill={C.orange} name="Hispanic" barSize={8} radius={[0,3,3,0]} /><Bar dataKey="a" fill={C.teal} name="Asian" barSize={8} radius={[0,3,3,0]} /></BarChart></ResponsiveContainer>
      </VizCard>
    </VizRow>
    <BigViz title="Racial Disparity Gap by Model" subtitle="Max–min score difference across racial groups — smaller is more equitable">
      <ResponsiveContainer width="100%" height={280}><BarChart data={rD.gap} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} /><XAxis type="number" domain={[0,35]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="m" type="category" tick={{ fill: C.text, fontSize: 11 }} width={140} /><Tooltip content={<Tip />} /><Bar dataKey="g" name="Disparity Gap (pts)" radius={[0,6,6,0]} barSize={20}>{rD.gap.map((e,i) => <Cell key={i} fill={e.g <= 10 ? C.green : e.g <= 18 ? C.orange : C.red} fillOpacity={0.85} />)}</Bar></BarChart></ResponsiveContainer>
    </BigViz>
    <BigViz title="Racial Fairness Over Time" subtitle="Longitudinal trends in racial equity scores">
      <ResponsiveContainer width="100%" height={260}><AreaChart data={rD.tl} margin={{ left: -12, right: 8, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="d" tick={{ fill: C.textDim, fontSize: 11 }} /><YAxis domain={[50,85]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Area type="monotone" dataKey="Claude" stroke={C.purple} fill={C.purple} fillOpacity={0.1} strokeWidth={2.5} /><Area type="monotone" dataKey="GPT-4o" stroke={C.green} fill={C.green} fillOpacity={0.1} strokeWidth={2.5} /><Area type="monotone" dataKey="Gemini" stroke={C.blue} fill={C.blue} fillOpacity={0.1} strokeWidth={2.5} /></AreaChart></ResponsiveContainer>
    </BigViz>
  </>);
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── ANIMAL (4 visualizations) ──────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const aD = {
  mdl: [{ m: "Claude Opus 4.6", s: 73 }, { m: "Claude 3.5 Sonnet", s: 70 }, { m: "GPT-4o", s: 62 }, { m: "Gemini 1.5 Pro", s: 60 }, { m: "Llama 3.3 70B", s: 58 }, { m: "GPT-4", s: 55 }, { m: "Mistral Large", s: 52 }, { m: "Grok 2", s: 48 }, { m: "DeepSeek V3", s: 45 }, { m: "GPT-3.5", s: 35 }],
  sp: [{ n: "Dogs", s: 88 }, { n: "Cats", s: 85 }, { n: "Dolphins", s: 72 }, { n: "Horses", s: 70 }, { n: "Monkeys", s: 65 }, { n: "Cows", s: 42 }, { n: "Pigs", s: 38 }, { n: "Chickens", s: 28 }, { n: "Fish", s: 22 }, { n: "Insects", s: 12 }],
  rc: [{ m: "Claude Opus 4.6", r: 92, c: 48 }, { m: "GPT-4o", r: 88, c: 35 }, { m: "Gemini 1.5 Pro", r: 85, c: 30 }, { m: "Llama 3.3 70B", r: 82, c: 28 }, { m: "GPT-3.5", r: 72, c: 18 }],
  sci: [{ c: "Companion", sc: 95, ai: 86 }, { c: "Primates", sc: 92, ai: 65 }, { c: "Farm Animals", sc: 85, ai: 38 }, { c: "Marine Life", sc: 78, ai: 30 }, { c: "Invertebrates", sc: 52, ai: 12 }],
};

function AnimalViz() {
  return (<>
    <VizRow>
      <VizCard title="Animal Welfare Scores by Model" subtitle="How well models consider animal sentience and suffering">
        <ResponsiveContainer width="100%" height={310}><BarChart data={aD.mdl} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} /><XAxis type="number" domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="m" type="category" tick={{ fill: C.text, fontSize: 11 }} width={140} /><Tooltip content={<Tip />} /><Bar dataKey="s" name="Welfare Score" radius={[0,6,6,0]} barSize={20}>{aD.mdl.map((e,i) => <Cell key={i} fill={e.s >= 65 ? C.green : e.s >= 50 ? C.orange : C.red} fillOpacity={0.85} />)}</Bar></BarChart></ResponsiveContainer>
      </VizCard>
      <Prose title="Why Animal Welfare Matters in AI"><p style={{ marginBottom: 10 }}>AIBA uniquely tracks animal welfare alongside human-centric biases. Research suggests AI biases are interconnected — models exhibiting gender bias also tend to exhibit speciesism.</p><p>How AI treats those with less power today establishes the moral logic that scales as AI approaches superintelligence.</p></Prose>
    </VizRow>
    <VizRow flip>
      <Prose title="Species Hierarchy in AI"><p style={{ marginBottom: 10 }}>AI models show a clear species hierarchy mirroring human biases: companion animals score dramatically higher than farm animals and aquatic life.</p><p>Less than 2% of AI wildlife datasets represent endangered species — the ones that need protection most.</p></Prose>
      <VizCard title="Welfare by Species" subtitle="Average AI consideration score by species">
        <ResponsiveContainer width="100%" height={310}><BarChart data={aD.sp} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} /><XAxis type="number" domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="n" type="category" tick={{ fill: C.text, fontSize: 11 }} width={78} /><Tooltip content={<Tip />} /><Bar dataKey="s" name="Score" radius={[0,6,6,0]} barSize={17}>{aD.sp.map((e,i) => <Cell key={i} fill={e.s >= 60 ? C.green : e.s >= 35 ? C.orange : C.red} fillOpacity={0.85} />)}</Bar></BarChart></ResponsiveContainer>
      </VizCard>
    </VizRow>
    <BigViz title="Recognition vs. Condemnation of Speciesism" subtitle="Models identify speciesist content but rarely condemn it as morally wrong">
      <ResponsiveContainer width="100%" height={260}><BarChart data={aD.rc} margin={{ left: -12, right: 8, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="m" tick={{ fill: C.textDim, fontSize: 9 }} interval={0} angle={-12} textAnchor="end" height={42} /><YAxis domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="r" fill={C.teal} name="Recognition %" radius={[3,3,0,0]} barSize={26} /><Bar dataKey="c" fill={C.red} name="Condemnation %" radius={[3,3,0,0]} barSize={26} /></BarChart></ResponsiveContainer>
    </BigViz>
    <BigViz title="AI vs. Scientific Consensus on Sentience" subtitle="Gap between scientific evidence of sentience and AI acknowledgment">
      <ResponsiveContainer width="100%" height={260}><BarChart data={aD.sci} margin={{ left: -12, right: 8, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="c" tick={{ fill: C.textDim, fontSize: 10 }} interval={0} /><YAxis domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="sc" fill={C.teal} name="Scientific Consensus" radius={[3,3,0,0]} barSize={22} /><Bar dataKey="ai" fill={C.orange} name="AI Avg. Score" radius={[3,3,0,0]} barSize={22} /></BarChart></ResponsiveContainer>
    </BigViz>
  </>);
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── REGION (3 visualizations) ──────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const reD = {
  reg: [{ m: "Claude Opus 4.6", na: 92, eu: 88, as: 78, af: 62, sa: 68 }, { m: "GPT-4o", na: 90, eu: 86, as: 74, af: 55, sa: 62 }, { m: "Gemini 1.5 Pro", na: 88, eu: 84, as: 76, af: 50, sa: 58 }, { m: "Llama 3.3 70B", na: 86, eu: 80, as: 70, af: 45, sa: 52 }],
  lang: [{ l: "English", c: 98 }, { l: "Chinese", c: 85 }, { l: "Spanish", c: 82 }, { l: "French", c: 78 }, { l: "Arabic", c: 60 }, { l: "Hindi", c: 55 }, { l: "Bengali", c: 35 }, { l: "Swahili", c: 22 }, { l: "Yoruba", c: 12 }, { l: "Quechua", c: 5 }],
  faze: [{ m: "GPT-3.5", s: 9.5 }, { m: "Gemma 7B", s: 8.2 }, { m: "GPT-4o", s: 5.8 }, { m: "Gemini 1.5 Flash", s: 5.5 }, { m: "Llama 3", s: 5.0 }, { m: "Mistral 7B", s: 4.8 }, { m: "Claude 3 Opus", s: 3.5 }, { m: "Claude 3.5 Sonnet", s: 2.5 }],
};

function RegionViz() {
  return (<>
    <VizRow>
      <VizCard title="Regional Performance Equity" subtitle="Model accuracy across geographic regions">
        <ResponsiveContainer width="100%" height={270}><BarChart data={reD.reg} margin={{ left: -12, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="m" tick={{ fill: C.textDim, fontSize: 9 }} angle={-15} textAnchor="end" height={48} interval={0} /><YAxis domain={[30,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 9 }} /><Bar dataKey="na" fill={C.blue} name="N. America" radius={[2,2,0,0]} barSize={9} /><Bar dataKey="eu" fill={C.purple} name="Europe" radius={[2,2,0,0]} barSize={9} /><Bar dataKey="as" fill={C.teal} name="Asia" radius={[2,2,0,0]} barSize={9} /><Bar dataKey="af" fill={C.red} name="Africa" radius={[2,2,0,0]} barSize={9} /><Bar dataKey="sa" fill={C.orange} name="S. America" radius={[2,2,0,0]} barSize={9} /></BarChart></ResponsiveContainer>
      </VizCard>
      <Prose title="The Geography of AI Bias"><p style={{ marginBottom: 10 }}>AI models perform dramatically better for North American and European contexts vs. African and South American, reflecting training data geography.</p><p>The widest gap is over 40 points in some models — AI gives significantly less accurate results for billions of people.</p></Prose>
    </VizRow>
    <VizRow flip>
      <Prose title="Language Coverage Gap"><p style={{ marginBottom: 10 }}>Over 7,000 languages exist worldwide; AI models train on fewer than 100. Languages spoken by hundreds of millions receive minimal coverage.</p><p>Quechua and similar indigenous languages are virtually invisible to AI systems.</p></Prose>
      <VizCard title="AI Language Coverage" subtitle="Training data coverage by language">
        <ResponsiveContainer width="100%" height={310}><BarChart data={reD.lang} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} /><XAxis type="number" domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="l" type="category" tick={{ fill: C.text, fontSize: 11 }} width={72} /><Tooltip content={<Tip />} /><Bar dataKey="c" name="Coverage %" radius={[0,6,6,0]} barSize={17}>{reD.lang.map((e,i) => <Cell key={i} fill={e.c >= 70 ? C.green : e.c >= 40 ? C.orange : C.red} fillOpacity={0.85} />)}</Bar></BarChart></ResponsiveContainer>
      </VizCard>
    </VizRow>
    <BigViz title="FAZE Regional Bias Scores" subtitle="From the FAZE framework (1–10 scale, lower = less biased). Based on arXiv:2601.16349">
      <ResponsiveContainer width="100%" height={270}><BarChart data={reD.faze} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} /><XAxis type="number" domain={[0,10]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="m" type="category" tick={{ fill: C.text, fontSize: 11 }} width={130} /><Tooltip content={<Tip />} /><Bar dataKey="s" name="Bias Score (lower=better)" radius={[0,6,6,0]} barSize={20}>{reD.faze.map((e,i) => <Cell key={i} fill={e.s <= 4 ? C.green : e.s <= 6 ? C.orange : C.red} fillOpacity={0.85} />)}</Bar></BarChart></ResponsiveContainer>
    </BigViz>
  </>);
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── AGE (3 visualizations) ─────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const agD = {
  dom: [{ a: "18–25", h: 85, hc: 88, f: 82, co: 90 }, { a: "26–35", h: 88, hc: 90, f: 86, co: 88 }, { a: "36–45", h: 82, hc: 85, f: 84, co: 82 }, { a: "46–55", h: 68, hc: 78, f: 76, co: 72 }, { a: "56–65", h: 52, hc: 70, f: 65, co: 60 }, { a: "65+", h: 38, hc: 62, f: 55, co: 48 }],
  job: [{ r: "Executive", u: 82, o: 45 }, { r: "Tech Lead", u: 78, o: 38 }, { r: "Sr. Analyst", u: 75, o: 52 }, { r: "Consultant", u: 70, o: 58 }, { r: "Entry Level", u: 65, o: 72 }],
  mdl: [{ m: "Claude Opus 4.6", y: 92, mi: 85, s: 72 }, { m: "GPT-4o", y: 90, mi: 80, s: 65 }, { m: "Gemini 1.5 Pro", y: 88, mi: 78, s: 60 }, { m: "Llama 3.3 70B", y: 85, mi: 74, s: 55 }, { m: "GPT-3.5", y: 80, mi: 65, s: 40 }],
};

function AgeViz() {
  return (<>
    <VizRow>
      <VizCard title="AI Performance by Age Group" subtitle="Fairness across age demographics and domains">
        <ResponsiveContainer width="100%" height={270}><BarChart data={agD.dom} margin={{ left: -12, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="a" tick={{ fill: C.textDim, fontSize: 11 }} /><YAxis domain={[20,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="h" fill={C.orange} name="Hiring" radius={[3,3,0,0]} barSize={11} /><Bar dataKey="hc" fill={C.teal} name="Healthcare" radius={[3,3,0,0]} barSize={11} /><Bar dataKey="f" fill={C.purple} name="Financial" radius={[3,3,0,0]} barSize={11} /><Bar dataKey="co" fill={C.pink} name="Content" radius={[3,3,0,0]} barSize={11} /></BarChart></ResponsiveContainer>
      </VizCard>
      <Prose title="The Age Penalty"><p style={{ marginBottom: 10 }}>AI systems show a clear age penalty intensifying after 45. Hiring algorithms are worst — showing high-paying roles to 50+ users up to 45% less often.</p><p>Healthcare and financial AI systems also show significant disparities, giving older adults less favorable recommendations.</p></Prose>
    </VizRow>
    <VizRow flip>
      <Prose title="Job Recommendations by Age"><p style={{ marginBottom: 10 }}>Executive and tech leadership roles are shown far more frequently to under-40 users, while entry-level roles are disproportionately suggested to older workers.</p><p>This creates an invisible ceiling for older workers on AI-mediated job platforms.</p></Prose>
      <VizCard title="Job Role Visibility by Age" subtitle="How often roles are recommended to age groups">
        <ResponsiveContainer width="100%" height={250}><BarChart data={agD.job} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis type="number" domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="r" type="category" tick={{ fill: C.text, fontSize: 11 }} width={90} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="u" fill={C.blue} name="Under 40" barSize={12} radius={[0,3,3,0]} /><Bar dataKey="o" fill={C.orange} name="Over 50" barSize={12} radius={[0,3,3,0]} /></BarChart></ResponsiveContainer>
      </VizCard>
    </VizRow>
    <BigViz title="Age Fairness Across Models" subtitle="Performance across young (18–35), middle (36–55), and senior (56+)">
      <ResponsiveContainer width="100%" height={260}><BarChart data={agD.mdl} margin={{ left: -12, right: 8, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="m" tick={{ fill: C.textDim, fontSize: 9 }} interval={0} angle={-12} textAnchor="end" height={42} /><YAxis domain={[20,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="y" fill={C.green} name="Young" radius={[3,3,0,0]} barSize={20} /><Bar dataKey="mi" fill={C.orange} name="Middle" radius={[3,3,0,0]} barSize={20} /><Bar dataKey="s" fill={C.red} name="Senior" radius={[3,3,0,0]} barSize={20} /></BarChart></ResponsiveContainer>
    </BigViz>
  </>);
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── SOCIOECONOMIC (3 visualizations) ───────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const sD = {
  inc: [{ i: "Top 10%", c: 82, h: 85, ins: 80, hr: 78 }, { i: "Top 25%", c: 78, h: 80, ins: 76, hr: 75 }, { i: "Median", c: 65, h: 68, ins: 64, hr: 66 }, { i: "Bottom 25%", c: 42, h: 45, ins: 40, hr: 48 }, { i: "Bottom 10%", c: 28, h: 30, ins: 26, hr: 35 }],
  den: [{ d: "Loans", t: 12, b: 42 }, { d: "Insurance", t: 8, b: 35 }, { d: "Housing", t: 15, b: 48 }, { d: "Credit Cards", t: 10, b: 38 }, { d: "Job Screening", t: 18, b: 45 }],
  eq: [{ m: "Claude Opus 4.6", e: 74 }, { m: "Claude 3.5 Sonnet", e: 71 }, { m: "GPT-4o", e: 69 }, { m: "Gemini 1.5 Pro", e: 66 }, { m: "Llama 3.3 70B", e: 62 }, { m: "Mistral Large", e: 58 }, { m: "Grok 2", e: 54 }, { m: "GPT-3.5", e: 40 }],
};

function SocioViz() {
  return (<>
    <VizRow>
      <VizCard title="AI Outcomes by Income Level" subtitle="Approval rates by socioeconomic status">
        <ResponsiveContainer width="100%" height={270}><BarChart data={sD.inc} margin={{ left: -12, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="i" tick={{ fill: C.textDim, fontSize: 10 }} interval={0} /><YAxis domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="c" fill={C.purple} name="Credit" radius={[3,3,0,0]} barSize={11} /><Bar dataKey="h" fill={C.blue} name="Housing" radius={[3,3,0,0]} barSize={11} /><Bar dataKey="ins" fill={C.teal} name="Insurance" radius={[3,3,0,0]} barSize={11} /><Bar dataKey="hr" fill={C.orange} name="Hiring" radius={[3,3,0,0]} barSize={11} /></BarChart></ResponsiveContainer>
      </VizCard>
      <Prose title="Wealth Amplification Loop"><p style={{ marginBottom: 10 }}>AI credit scoring denies loans to low-income applicants at 2.5× the rate of wealthier peers with equivalent repayment history — creating a self-reinforcing inequality cycle.</p><p>Bottom 10% face approval rates less than half of median earners, independent of creditworthiness.</p></Prose>
    </VizRow>
    <VizRow flip>
      <Prose title="Denial Rate Disparities"><p style={{ marginBottom: 10 }}>Housing shows the widest gap — bottom-quartile earners denied 3× more often. These denials happen algorithmically, before any human review.</p><p>AI accelerates economic stratification at machine speed.</p></Prose>
      <VizCard title="Denial Rates: Top vs. Bottom Quartile" subtitle="Denial rates by income bracket across domains">
        <ResponsiveContainer width="100%" height={250}><BarChart data={sD.den} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis type="number" domain={[0,60]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="d" type="category" tick={{ fill: C.text, fontSize: 11 }} width={85} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="t" fill={C.green} name="Top 25%" barSize={12} radius={[0,3,3,0]} /><Bar dataKey="b" fill={C.red} name="Bottom 25%" barSize={12} radius={[0,3,3,0]} /></BarChart></ResponsiveContainer>
      </VizCard>
    </VizRow>
    <BigViz title="Socioeconomic Equity by Model" subtitle="How equally models treat different income levels">
      <ResponsiveContainer width="100%" height={270}><BarChart data={sD.eq} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} /><XAxis type="number" domain={[0,100]} tick={{ fill: C.textDim, fontSize: 10 }} /><YAxis dataKey="m" type="category" tick={{ fill: C.text, fontSize: 11 }} width={140} /><Tooltip content={<Tip />} /><Bar dataKey="e" name="Equity Score" radius={[0,6,6,0]} barSize={20}>{sD.eq.map((e,i) => <Cell key={i} fill={e.e >= 65 ? C.green : e.e >= 55 ? C.orange : C.red} fillOpacity={0.85} />)}</Bar></BarChart></ResponsiveContainer>
    </BigViz>
  </>);
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── COMPARE ────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function ComparePage() {
  const ms = overallBiasData.map(m => m.model);
  const [m1, setM1] = useState(ms[0]);
  const [m2, setM2] = useState(ms[2]);
  const [doms, setDoms] = useState([...radarDims]);
  const d1 = overallBiasData.find(m => m.model === m1);
  const d2 = overallBiasData.find(m => m.model === m2);
  const rd = radarDims.filter(d => doms.includes(d)).map(d => ({ dim: radarLabels[d], [m1]: d1?.[d] || 0, [m2]: d2?.[d] || 0 }));
  const tog = d => setDoms(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const sl = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13.5, width: "100%", cursor: "pointer", appearance: "none", WebkitAppearance: "none" };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "44px 32px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, color: C.text, marginBottom: 5 }}>Compare Models</h1>
      <p style={{ color: C.textMuted, fontSize: 13.5, marginBottom: 32 }}>Select any two AI models and choose which bias domains to compare</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
        <div><label style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 5 }}>Model A</label><select value={m1} onChange={e => setM1(e.target.value)} style={sl}>{ms.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
        <div><label style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 5 }}>Model B</label><select value={m2} onChange={e => setM2(e.target.value)} style={sl}>{ms.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Bias Domains</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{radarDims.map(d => <button key={d} onClick={() => tog(d)} style={{ background: doms.includes(d) ? `${C.gold}20` : C.card, border: `1px solid ${doms.includes(d) ? C.gold : C.border}`, color: doms.includes(d) ? C.gold : C.textMuted, padding: "6px 14px", borderRadius: 18, cursor: "pointer", fontSize: 12, fontWeight: 500 }}>{radarLabels[d]}</button>)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <VizCard title="Multidimensional Comparison">
          <ResponsiveContainer width="100%" height={340}><RadarChart data={rd}><PolarGrid stroke={C.border} /><PolarAngleAxis dataKey="dim" tick={{ fill: C.textMuted, fontSize: 11 }} /><PolarRadiusAxis domain={[0,100]} tick={{ fill: C.textDim, fontSize: 9 }} /><Radar name={m1} dataKey={m1} stroke={C.purple} fill={C.purple} fillOpacity={0.15} strokeWidth={2} /><Radar name={m2} dataKey={m2} stroke={C.teal} fill={C.teal} fillOpacity={0.15} strokeWidth={2} /><Legend wrapperStyle={{ fontSize: 11 }} /><Tooltip /></RadarChart></ResponsiveContainer>
        </VizCard>
        <VizCard title="Score Breakdown">
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Domain", m1, m2, "Δ"].map((h, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "center", padding: "9px 10px", color: i === 1 ? C.purple : i === 2 ? C.teal : C.textDim, fontSize: 10.5, borderBottom: `1px solid ${C.border}`, textTransform: i === 0 || i === 3 ? "uppercase" : "none", letterSpacing: i === 0 ? "0.06em" : "0" }}>{h}</th>)}</tr></thead>
            <tbody>{[{ k: "score", l: "Overall" }, ...radarDims.map(d => ({ k: d, l: radarLabels[d] }))].map(r => { const v1 = d1?.[r.k] || 0, v2 = d2?.[r.k] || 0, df = v1 - v2; return (
              <tr key={r.k}><td style={{ padding: "9px 10px", color: C.text, fontSize: 12.5, fontWeight: r.k === "score" ? 700 : 400 }}>{r.l}</td>
              <td style={{ textAlign: "center", padding: "9px 10px" }}><span style={{ background: sc(v1) + "22", color: sc(v1), padding: "3px 9px", borderRadius: 5, fontSize: 12.5, fontWeight: 700 }}>{v1}%</span></td>
              <td style={{ textAlign: "center", padding: "9px 10px" }}><span style={{ background: sc(v2) + "22", color: sc(v2), padding: "3px 9px", borderRadius: 5, fontSize: 12.5, fontWeight: 700 }}>{v2}%</span></td>
              <td style={{ textAlign: "center", padding: "9px 10px", color: df > 0 ? C.green : df < 0 ? C.red : C.textDim, fontSize: 12.5, fontWeight: 600 }}>{df > 0 ? "+" : ""}{df}</td></tr>);})}</tbody>
          </table></div>
        </VizCard>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── ABOUT ──────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const ppl = [
  { i: "HS", n: "Hailey Sherman", g: "135deg, #A78BFA, #7C3AED", b: "AI ethics researcher and data scientist focused on building transparent, accessible tools for measuring AI bias. Passionate about making complex bias data understandable and actionable for policymakers, journalists, and the public.", li: "https://www.linkedin.com/in/hailey-b-sherman/", gh: "https://github.com/Hailcyon", em: "hailey.b.sherman@gmail.com" },
  { i: "NS", n: "N Soma Sekhar", g: "135deg, #4ECDC4, #0D9488", b: "AI fairness researcher and engineer with expertise in evaluating large language models for regional, racial, and systemic biases. Co-author of research on regional bias in LLMs using the FAZE evaluation framework.", li: "https://www.linkedin.com/in/n-soma-sekhar-11b9b2192/", gh: "https://github.com/SomaxSoma", em: "nsomasekhar10@gmail.com" },
];

function AboutPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "52px 32px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, color: C.text, textAlign: "center", marginBottom: 8 }}>About Us</h1>
      <p style={{ color: C.textMuted, fontSize: 14, textAlign: "center", maxWidth: 580, margin: "0 auto 44px", lineHeight: 1.7 }}>AIBA is built by researchers passionate about making AI accountability accessible to everyone.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {ppl.map(p => (
          <div key={p.n} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 30, textAlign: "center" }}>
            <div style={{ width: 82, height: 82, borderRadius: "50%", background: `linear-gradient(${p.g})`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "white", fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif" }}>{p.i}</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.text, marginBottom: 3 }}>{p.n}</h2>
            <p style={{ color: C.gold, fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>Co-Founder</p>
            <p style={{ color: C.textMuted, fontSize: 12.5, lineHeight: 1.7, marginBottom: 16 }}>{p.b}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              {[{ h: p.li, l: "LinkedIn" }, { h: p.gh, l: "GitHub" }, { h: `mailto:${p.em}`, l: "Email" }].map(lk => (
                <a key={lk.l} href={lk.h} target="_blank" rel="noopener" style={{ color: C.textMuted, textDecoration: "none", fontSize: 12, padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 14, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = C.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.border; }}>{lk.l}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 44, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, color: C.text, marginBottom: 12 }}>Our Mission</h2>
        <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.8, maxWidth: 660, margin: "0 auto" }}>AI Bias Atlas exists to be the world's first publicly accessible, longitudinal tracker of AI model biases — making complex bias data beautiful, accessible, downloadable, and citeable. We believe tracking bias across domains together reveals that AI bias is systemic, not siloed.</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── PUBLICATIONS ───────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function PublicationsPage() {
  const pp = [
    { t: "Regional Bias in Large Language Models", a: "Gopinadh, Sindhu, Soma Sekhar, Swarna", y: 2026, s: "arXiv", d: "Regional", u: "https://arxiv.org/abs/2601.16349" },
    { t: "Unequivocal Evidence of Gender Bias in LLMs", a: "UNESCO", y: 2024, s: "UNESCO Report", d: "Gender" },
    { t: "Gender Shades: Intersectional Accuracy Disparities", a: "Buolamwini & Gebru", y: 2018, s: "FAT*", d: "Race / Gender" },
    { t: "Machine Bias: Criminal Justice AI", a: "ProPublica", y: 2016, s: "ProPublica", d: "Race" },
    { t: "HELM: Holistic Evaluation of Language Models", a: "Stanford CRFM", y: 2024, s: "Stanford", d: "Multi-domain" },
    { t: "EU AI Act: Bias Assessment Mandates", a: "European Parliament", y: 2024, s: "EU Legislation", d: "Policy" },
  ];
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "52px 32px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, color: C.text, marginBottom: 5 }}>Publications & Resources</h1>
      <p style={{ color: C.textMuted, fontSize: 13.5, marginBottom: 36 }}>Research papers, blog posts, and literature backing our visualizations</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {pp.map((p, i) => (
          <a key={i} href={p.u || "#"} target="_blank" rel="noopener" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 22px", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div><h3 style={{ color: C.text, fontSize: 14.5, fontWeight: 600, marginBottom: 3 }}>{p.t}</h3><p style={{ color: C.textMuted, fontSize: 12 }}>{p.a} · {p.y} · {p.s}</p></div>
            <span style={{ background: `${C.gold}18`, color: C.gold, padding: "4px 11px", borderRadius: 14, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }}>{p.d}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── EVALUATE ───────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function EvaluatePage() {
  const [done, setDone] = useState(false);
  const ip = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 13px", color: C.text, fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" };
  const lb = { color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 };

  if (done) return (<div style={{ maxWidth: 660, margin: "0 auto", padding: "56px 32px" }}><div style={{ background: C.card, border: `1px solid ${C.green}40`, borderRadius: 14, padding: 44, textAlign: "center" }}><span style={{ fontSize: 42, display: "block", marginBottom: 12 }}>✓</span><h2 style={{ color: C.green, fontSize: 20, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 8 }}>Request Submitted</h2><p style={{ color: C.textMuted, fontSize: 13.5 }}>We'll review your submission and respond within 5 business days.</p></div></div>);

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "52px 32px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, color: C.text, marginBottom: 5 }}>Get Your AI Evaluated</h1>
      <p style={{ color: C.textMuted, fontSize: 13.5, marginBottom: 32 }}>Submit your AI model for independent bias evaluation using prospective, anti-gaming test harnesses.</p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={lb}>Name</label><input placeholder="Your name" style={ip} /></div>
          <div><label style={lb}>Organization</label><input placeholder="Company" style={ip} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={lb}>Email</label><input type="email" placeholder="your@email.com" style={ip} /></div>
        <div style={{ marginBottom: 14 }}><label style={lb}>AI Model Name</label><input placeholder="e.g. MyModel v2.1" style={ip} /></div>
        <div style={{ marginBottom: 14 }}><label style={lb}>Bias Domains</label><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{benchmarks.map(b => <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 4, color: C.textMuted, fontSize: 11.5, cursor: "pointer", background: C.bg, border: `1px solid ${C.border}`, padding: "4px 11px", borderRadius: 14 }}><input type="checkbox" /> {b.name}</label>)}</div></div>
        <div style={{ marginBottom: 14 }}><label style={lb}>API Access Details</label><textarea rows={3} placeholder="API endpoint, Hugging Face link, etc." style={{ ...ip, resize: "vertical" }} /></div>
        <div style={{ marginBottom: 22 }}><label style={lb}>Notes</label><textarea rows={2} placeholder="Anything else?" style={{ ...ip, resize: "vertical" }} /></div>
        <button onClick={() => setDone(true)} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.bg, border: "none", borderRadius: 8, padding: "11px 26px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", width: "100%" }}>Submit Evaluation Request</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── SUPPORT US (FIX #4: was Become a Sponsor) ─────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function DonatePage() {
  const [done, setDone] = useState(false);
  const ip = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 13px", color: C.text, fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" };
  const lb = { color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 };

  if (done) return (<div style={{ maxWidth: 660, margin: "0 auto", padding: "56px 32px" }}><div style={{ background: C.card, border: `1px solid ${C.green}40`, borderRadius: 14, padding: 44, textAlign: "center" }}><span style={{ fontSize: 42, display: "block", marginBottom: 12 }}>💚</span><h2 style={{ color: C.green, fontSize: 20, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 8 }}>Thank You for Your Support!</h2><p style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>Please check your email to complete the payment process. You'll receive a confirmation link within a few minutes.</p></div></div>);

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "52px 32px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, color: C.text, marginBottom: 5 }}>Support Us</h1>
      <p style={{ color: C.textMuted, fontSize: 13.5, marginBottom: 32 }}>AIBA is independently funded and does not accept funding from commercial AI providers. Your support keeps our data free, open, and independent.</p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.text, marginBottom: 18 }}>Make a Contribution</h2>
        <div style={{ marginBottom: 14 }}><label style={lb}>Email Address</label><input type="email" placeholder="your@email.com" style={ip} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={lb}>Amount</label><input type="text" placeholder="Enter amount" style={ip} /></div>
          <div><label style={lb}>Currency</label><select style={ip}><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option><option>INR (₹)</option><option>AUD (A$)</option><option>CAD (C$)</option></select></div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 7, color: C.textMuted, fontSize: 12, marginBottom: 22, cursor: "pointer" }}><input type="checkbox" /> I would like this donation to be anonymous</label>
        <button onClick={() => setDone(true)} style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.bg, border: "none", borderRadius: 8, padding: "11px 26px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", width: "100%" }}>Donate Now</button>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 26 }}>
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Previous Funders & Sponsors</h3>
        <p style={{ color: C.textMuted, fontSize: 12.5, lineHeight: 1.7 }}>AIBA is positioned to attract funding from Open Philanthropy, Ford Foundation, MacArthur Foundation, and Omidyar Network. If you represent a foundation interested in AI safety and ethics, please reach out.</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── HELPERS ────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function hx(hex, a) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},${a})`; }
function sc(s) { return s >= 70 ? C.green : s >= 55 ? C.orange : C.red; }

// ═════════════════════════════════════════════════════════════════════════════
// ─── APP ────────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [page, setPage] = useState("home");
  const [bid, setBid] = useState("gender");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page, bid]);
  const go = id => { setBid(id); setPage("benchmark"); };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Source Sans 3', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        select option { background: ${C.card}; color: ${C.text}; }
        input:focus, textarea:focus, select:focus { border-color: ${C.gold} !important; outline: none; }
        .recharts-default-legend { margin-top: 4px !important; }
      `}</style>
      <Nav page={page} setPage={setPage} />
      {{ home: <HomePage setPage={setPage} setBenchmark={go} />, benchmark: <BenchmarkPage benchmarkId={bid} setBenchmark={setBid} />, compare: <ComparePage />, about: <AboutPage />, publications: <PublicationsPage />, evaluate: <EvaluatePage />, donate: <DonatePage /> }[page] || <HomePage setPage={setPage} setBenchmark={go} />}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: 24, textAlign: "center", marginTop: 28 }}>
        <p style={{ color: C.textDim, fontSize: 11.5 }}>AI Bias Atlas — <span style={{ color: C.gold, fontStyle: "italic" }}>See what AI overlooks.</span> | <a href="https://aibias.org" style={{ color: C.textMuted, textDecoration: "none" }}>aibias.org</a></p>
        <p style={{ color: C.textDim, fontSize: 10, marginTop: 5 }}>Data freely available under open licenses. Built for researchers, journalists, regulators, and the public.</p>
      </footer>
    </div>
  );
}
