import { useState, useMemo, useEffect } from "react";

const C = {
  bg: "#F0F4FF", card: "#FFFFFF", purple: "#6C63FF", purpleLight: "#EEEDff",
  green: "#22C987", greenLight: "#DFFAF1", red: "#FF5C7A", redLight: "#FFE8ED",
  blue: "#3B9EFF", blueLight: "#E3F1FF", yellow: "#FFB830", yellowLight: "#FFF4DC",
  text: "#1E1B4B", muted: "#7C7A9E", border: "#E2E0F9", white: "#FFFFFF",
};
const SF = "'Plus Jakarta Sans', sans-serif";
const fmtCOP = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);
const fmtUSD = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v || 0);

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const YEARS = ["2025","2026","2027"];

const emptyMonth = (fijosExtra = [], variablesExtra = []) => ({
  ingresos: { plexo: "", freelance1: "", freelance2: "", otros: "", cur1: "COP", cur2: "COP", cur3: "COP" },
  fijos: { alquiler: "", agua: "", luz: "", gas: "", internet: "", telefono: "", netflix: "", googleone: "", spotify: "", adobe: "", claude: "", cloud: "", transporte: "", prestamos: "" },
  variables: { comida: "", salidas: "", ropa: "", salud: "", mascotas: "", otros: "" },
  fijosExtra: fijosExtra.map(c => ({ ...c, valor: "" })),
  variablesExtra: variablesExtra.map(c => ({ ...c, valor: "" })),
});

const aprilDefaults = {
  ingresos: { plexo: "1728.45", freelance1: "", freelance2: "", otros: "", cur1: "COP", cur2: "COP", cur3: "COP" },
  fijos: {
    alquiler: "500000",
    agua: "25000", luz: "150000", gas: "15000",
    internet: "27000", telefono: "47000",
    netflix: "30000", googleone: "44900", spotify: "18000", adobe: "63700", claude: "80000", cloud: "10000",
    transporte: "150000", prestamos: "",
  },
  variables: { comida: "800000", salidas: "", ropa: "", salud: "830000", mascotas: "128000", otros: "140000" },
  fijosExtra: [], variablesExtra: [],
};

const InputField = ({ label, value, onChange, prefix = "$", note, isText }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, fontFamily: SF, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, marginBottom: 5 }}>{label}</label>
    <div style={{ display: "flex", alignItems: "center", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <span style={{ padding: "9px 11px", color: C.muted, fontSize: 13, fontFamily: SF, fontWeight: 600, background: C.border, minWidth: 34, textAlign: "center" }}>{prefix}</span>
      <input type={isText ? "text" : "number"} value={value} onChange={e => onChange(e.target.value)} placeholder={isText ? "Nombre…" : "0"}
        style={{ flex: 1, border: "none", background: "transparent", padding: "9px 12px", fontSize: 14, fontFamily: SF, fontWeight: 600, color: C.text, outline: "none" }} />
    </div>
    {note && <p style={{ fontSize: 11, color: C.muted, fontFamily: SF, marginTop: 4 }}>{note}</p>}
  </div>
);

const SectionCard = ({ title, emoji, color, colorLight, children, total }) => (
  <div style={{ background: C.white, borderRadius: 18, border: `1.5px solid ${C.border}`, overflow: "hidden", marginBottom: 16, boxShadow: "0 2px 12px rgba(108,99,255,0.06)" }}>
    <div style={{ padding: "14px 20px", borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: colorLight }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontFamily: SF, fontWeight: 800, fontSize: 15, color: C.text }}>{title}</span>
      </div>
      <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 700, color, background: C.white, padding: "3px 10px", borderRadius: 20, border: `1px solid ${color}33` }}>{fmtCOP(total)}</span>
    </div>
    <div style={{ padding: "18px 20px" }}>{children}</div>
  </div>
);

const ProgressBar = ({ label, value, max, color, colorLight }) => {
  const p = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontFamily: SF, color: C.text, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: SF, color, fontWeight: 700 }}>{p.toFixed(0)}%</span>
      </div>
      <div style={{ height: 8, background: colorLight, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
};

export default function BudgetTracker() {
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [tab, setTab] = useState("ingresos");
  const [mes, setMes] = useState("Abril");
  const [year, setYear] = useState("2026");
  const [tasa, setTasa] = useState("3600");
  // months: { "Abril-2026": { ingresos, fijos, variables, fijosExtra, variablesExtra } }
  const [months, setMonths] = useState({ "Abril-2026": aprilDefaults });
  const [ahorros, setAhorros] = useState([{ id: 1, mes: "Antes de Abril 2026", monto: "", tipo: "suma", nota: "Saldo inicial" }]);
  const [newMonto, setNewMonto] = useState("");
  const [newNota, setNewNota] = useState("");
  const [newTipo, setNewTipo] = useState("suma");
  const [deudas, setDeudas] = useState([]);
  const [newDeuda, setNewDeuda] = useState({ nombre: "", monto: "", notas: "" });
  const [pagoModal, setPagoModal] = useState(null);
  const [pagoFuente, setPagoFuente] = useState("");
  const [newMesModal, setNewMesModal] = useState(false);
  const [newMesSel, setNewMesSel] = useState("Mayo");
  const [newYearSel, setNewYearSel] = useState("2026");
  // extra categories
  const [newFijoLabel, setNewFijoLabel] = useState("");
  const [newVarLabel, setNewVarLabel] = useState("");

  const mesKey = `${mes}-${year}`;
  const current = months[mesKey] || emptyMonth();

  // Load from localStorage
  useEffect(() => {
    try {
      const d1 = localStorage.getItem("budget-main");
      if (d1) {
        const d = JSON.parse(d1);
        if (d.months) setMonths(d.months);
        if (d.tasa) setTasa(d.tasa);
        if (d.mes) setMes(d.mes);
        if (d.year) setYear(d.year);
      }
    } catch (e) {}
    try {
      const d2 = localStorage.getItem("budget-extra");
      if (d2) {
        const d = JSON.parse(d2);
        if (d.ahorros) setAhorros(d.ahorros);
        if (d.deudas) setDeudas(d.deudas);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem("budget-main", JSON.stringify({ months, tasa, mes, year }));
        localStorage.setItem("budget-extra", JSON.stringify({ ahorros, deudas }));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (e) {
        setSaveStatus("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [months, ahorros, deudas, tasa, mes, year, loaded]);

  const updateCurrent = (patch) => setMonths(prev => ({ ...prev, [mesKey]: { ...current, ...patch } }));

  const tc = parseFloat(tasa) || 3600;
  const plexoCOP = (parseFloat(current.ingresos.plexo) || 0) * tc;
  const toCP = (val, curKey) => { const n = parseFloat(val)||0; return current.ingresos[curKey]==="USD" ? n*tc : n; };

  const totalIngresos = useMemo(() =>
    plexoCOP + toCP(current.ingresos.freelance1,"cur1") + toCP(current.ingresos.freelance2,"cur2") + toCP(current.ingresos.otros,"cur3"),
    [current.ingresos, tc]);

  const totalFijosBase = useMemo(() => Object.values(current.fijos).reduce((s,v) => s+(parseFloat(v)||0), 0), [current.fijos]);
  const totalFijosExtra = useMemo(() => (current.fijosExtra||[]).reduce((s,c) => s+(parseFloat(c.valor)||0), 0), [current.fijosExtra]);
  const totalFijos = totalFijosBase + totalFijosExtra;

  const totalVarsBase = useMemo(() => Object.values(current.variables).reduce((s,v) => s+(parseFloat(v)||0), 0), [current.variables]);
  const totalVarsExtra = useMemo(() => (current.variablesExtra||[]).reduce((s,c) => s+(parseFloat(c.valor)||0), 0), [current.variablesExtra]);
  const totalVariables = totalVarsBase + totalVarsExtra;

  const totalAhorros = useMemo(() => ahorros.reduce((s,a) => a.tipo==="suma" ? s+(parseFloat(a.monto)||0) : s-(parseFloat(a.monto)||0), 0), [ahorros]);
  const totalEgresos = totalFijos + totalVariables;
  const balance = totalIngresos - totalEgresos;

  const existingMonths = Object.keys(months).sort();

  const handleNewMonth = () => {
    const key = `${newMesSel}-${newYearSel}`;
    if (months[key]) { setMes(newMesSel); setYear(newYearSel); setNewMesModal(false); return; }
    // Copy fijos/variables values + carry extra categories
    const prev = months[mesKey];
    const newData = {
      ingresos: { plexo: prev.ingresos.plexo, freelance1: "", freelance2: "", otros: "", cur1: "COP", cur2: "COP", cur3: "COP" },
      fijos: { ...prev.fijos },
      variables: { ...prev.variables, comida: "", salidas: "", ropa: "", salud: "", mascotas: "", otros: "" },
      fijosExtra: (prev.fijosExtra||[]).map(c => ({ ...c })),
      variablesExtra: (prev.variablesExtra||[]).map(c => ({ ...c, valor: "" })),
    };
    setMonths(prev2 => ({ ...prev2, [key]: newData }));
    setMes(newMesSel); setYear(newYearSel); setNewMesModal(false);
  };

  const tabs = [
    { id: "ingresos", label: "Ingresos", emoji: "💼" },
    { id: "fijos", label: "Fijos", emoji: "🏠" },
    { id: "variables", label: "Variables", emoji: "🛒" },
    { id: "ahorros", label: "Ahorros", emoji: "🐷" },
    { id: "deudas", label: "Deudas", emoji: "💳" },
    { id: "resumen", label: "Resumen", emoji: "📊" },
    { id: "comparar", label: "Comparar", emoji: "📈" },
  ];

  if (!loaded) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ fontSize: 40 }}>💜</div>
      <p style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: C.purple }}>Cargando tu presupuesto…</p>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: SF, padding: "0 0 48px" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.purple} 0%, #9B8CFF 100%)`, padding: "24px 20px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -10, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <p style={{ fontFamily: SF, color: "rgba(255,255,255,0.75)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>Plan Personal · Colombia</p>
          {saveStatus && <span style={{ fontFamily: SF, fontSize: 10, fontWeight: 700, color: saveStatus==="saved" ? "#A7F3D0" : saveStatus==="error" ? "#FCA5A5" : "rgba(255,255,255,0.6)" }}>
            {saveStatus==="saving" ? "💾 guardando…" : saveStatus==="saved" ? "✓ guardado" : "⚠ error"}
          </span>}
        </div>
        {/* Month selector row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <select value={mes} onChange={e => setMes(e.target.value)}
            style={{ fontFamily: SF, fontSize: 18, fontWeight: 800, color: C.purple, background: "#FFF", border: "none", borderRadius: 12, padding: "6px 12px", outline: "none", cursor: "pointer" }}>
            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)}
            style={{ fontFamily: SF, fontSize: 18, fontWeight: 800, color: C.purple, background: "#FFF", border: "none", borderRadius: 12, padding: "6px 12px", outline: "none", cursor: "pointer" }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setNewMesModal(true)}
            style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "6px 12px", color: "#FFF", fontFamily: SF, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Nuevo mes
          </button>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ label: "Ingresos", val: fmtCOP(totalIngresos) }, { label: "Egresos", val: fmtCOP(totalEgresos) }, { label: "Balance", val: fmtCOP(balance) }].map((item, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 10px 8px", border: "1px solid rgba(255,255,255,0.18)" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 11, color: "#FFF", fontWeight: 800, lineHeight: 1.2 }}>{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TRM banner */}
      <div style={{ background: C.yellowLight, padding: "10px 20px", borderBottom: `1px solid ${C.yellow}44`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontFamily: SF, fontWeight: 700, color: C.text }}>💱 TRM USD → COP:</span>
        <input type="number" value={tasa} onChange={e => setTasa(e.target.value)}
          style={{ width: 80, border: `1.5px solid ${C.yellow}`, borderRadius: 8, padding: "4px 8px", fontSize: 13, fontFamily: SF, fontWeight: 700, color: C.text, background: C.white, outline: "none" }} />
        <span style={{ fontSize: 11, fontFamily: SF, color: C.muted }}>COP · tasa referencial</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", overflowX: "auto", background: C.white, borderBottom: `1.5px solid ${C.border}`, padding: "0 8px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: "0 0 auto", padding: "12px 12px", border: "none", background: "transparent", cursor: "pointer", fontFamily: SF, fontSize: 12, fontWeight: tab===t.id ? 800 : 500, color: tab===t.id ? C.purple : C.muted, borderBottom: tab===t.id ? `2.5px solid ${C.purple}` : "2.5px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "18px 16px" }}>

        {/* INGRESOS */}
        {tab === "ingresos" && (
          <SectionCard title="Ingresos del Mes" emoji="💼" color={C.green} colorLight={C.greenLight} total={totalIngresos}>
            <div style={{ background: C.purpleLight, borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: `1px solid ${C.purple}22` }}>
              <p style={{ fontSize: 12, fontFamily: SF, fontWeight: 700, color: C.purple }}>💡 El salario Plexo se ingresa en USD y se convierte con la TRM.</p>
            </div>
            <InputField label="Salario Plexo Analytics (USD)" prefix="$" value={current.ingresos.plexo}
              onChange={v => updateCurrent({ ingresos: { ...current.ingresos, plexo: v } })}
              note={current.ingresos.plexo ? `≈ ${fmtCOP((parseFloat(current.ingresos.plexo)||0)*tc)} COP` : "Ingresa en dólares"} />
            {[
              { key: "freelance1", label: "Freelance / cliente 1", curKey: "cur1" },
              { key: "freelance2", label: "Freelance / cliente 2", curKey: "cur2" },
              { key: "otros", label: "Otros ingresos", curKey: "cur3" },
            ].map(({ key, label, curKey }) => {
              const isUSD = current.ingresos[curKey] === "USD";
              const cop = isUSD ? (parseFloat(current.ingresos[key])||0)*tc : (parseFloat(current.ingresos[key])||0);
              return (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, fontFamily: SF, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, marginBottom: 5 }}>{label}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ display: "flex", flex: 1, alignItems: "center", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                      <span style={{ padding: "9px 11px", color: C.muted, fontSize: 13, background: C.border, fontWeight: 600 }}>$</span>
                      <input type="number" value={current.ingresos[key]} onChange={e => updateCurrent({ ingresos: { ...current.ingresos, [key]: e.target.value } })} placeholder="0"
                        style={{ flex: 1, border: "none", background: "transparent", padding: "9px 12px", fontSize: 14, fontFamily: SF, fontWeight: 600, color: C.text, outline: "none" }} />
                    </div>
                    <button onClick={() => updateCurrent({ ingresos: { ...current.ingresos, [curKey]: isUSD ? "COP" : "USD" } })}
                      style={{ padding: "0 12px", borderRadius: 10, border: `1.5px solid ${isUSD ? C.purple : C.border}`, background: isUSD ? C.purpleLight : C.white, color: isUSD ? C.purple : C.muted, fontFamily: SF, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {isUSD ? "USD" : "COP"}
                    </button>
                  </div>
                  {current.ingresos[key] && isUSD && <p style={{ fontSize: 11, color: C.muted, fontFamily: SF, marginTop: 4 }}>≈ {fmtCOP(cop)} COP</p>}
                </div>
              );
            })}
            <div style={{ marginTop: 6, background: C.greenLight, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.green}33` }}>
              <p style={{ fontSize: 12, fontFamily: SF, color: C.green, fontWeight: 700 }}>Total en COP: {fmtCOP(totalIngresos)}</p>
            </div>
          </SectionCard>
        )}

        {/* FIJOS */}
        {tab === "fijos" && (
          <div>
            {/* Vivienda */}
            <SectionCard title="Vivienda" emoji="🏠" color={C.blue} colorLight={C.blueLight} total={parseFloat(current.fijos.alquiler)||0}>
              <InputField label="Arriendo" prefix="$" value={current.fijos.alquiler} onChange={v => updateCurrent({ fijos: { ...current.fijos, alquiler: v } })} />
            </SectionCard>
            {/* Servicios */}
            <SectionCard title="Servicios" emoji="💡" color={C.blue} colorLight={C.blueLight}
              total={(parseFloat(current.fijos.agua)||0)+(parseFloat(current.fijos.luz)||0)+(parseFloat(current.fijos.gas)||0)}>
              <InputField label="Agua" prefix="$" value={current.fijos.agua} onChange={v => updateCurrent({ fijos: { ...current.fijos, agua: v } })} />
              <InputField label="Luz" prefix="$" value={current.fijos.luz} onChange={v => updateCurrent({ fijos: { ...current.fijos, luz: v } })} />
              <InputField label="Gas" prefix="$" value={current.fijos.gas} onChange={v => updateCurrent({ fijos: { ...current.fijos, gas: v } })} />
            </SectionCard>
            {/* Comunicaciones */}
            <SectionCard title="Comunicaciones" emoji="📡" color={C.blue} colorLight={C.blueLight}
              total={(parseFloat(current.fijos.internet)||0)+(parseFloat(current.fijos.telefono)||0)}>
              <InputField label="Internet" prefix="$" value={current.fijos.internet} onChange={v => updateCurrent({ fijos: { ...current.fijos, internet: v } })} />
              <InputField label="Teléfono" prefix="$" value={current.fijos.telefono} onChange={v => updateCurrent({ fijos: { ...current.fijos, telefono: v } })} />
            </SectionCard>
            {/* Suscripciones */}
            <SectionCard title="Suscripciones" emoji="📱" color={C.purple} colorLight={C.purpleLight}
              total={["netflix","googleone","spotify","adobe","claude","cloud"].reduce((s,k)=>s+(parseFloat(current.fijos[k])||0),0)}>
              <InputField label="Netflix" prefix="$" value={current.fijos.netflix} onChange={v => updateCurrent({ fijos: { ...current.fijos, netflix: v } })} />
              <InputField label="Google One" prefix="$" value={current.fijos.googleone} onChange={v => updateCurrent({ fijos: { ...current.fijos, googleone: v } })} />
              <InputField label="Spotify" prefix="$" value={current.fijos.spotify} onChange={v => updateCurrent({ fijos: { ...current.fijos, spotify: v } })} />
              <InputField label="Adobe" prefix="$" value={current.fijos.adobe} onChange={v => updateCurrent({ fijos: { ...current.fijos, adobe: v } })} />
              <InputField label="Claude" prefix="$" value={current.fijos.claude} onChange={v => updateCurrent({ fijos: { ...current.fijos, claude: v } })} />
              <InputField label="Cloud" prefix="$" value={current.fijos.cloud} onChange={v => updateCurrent({ fijos: { ...current.fijos, cloud: v } })} />
            </SectionCard>
            {/* Transporte y deudas */}
            <SectionCard title="Transporte y créditos" emoji="🚌" color={C.blue} colorLight={C.blueLight}
              total={(parseFloat(current.fijos.transporte)||0)+(parseFloat(current.fijos.prestamos)||0)}>
              <InputField label="Transporte" prefix="$" value={current.fijos.transporte} onChange={v => updateCurrent({ fijos: { ...current.fijos, transporte: v } })} />
              <InputField label="Créditos / deudas" prefix="$" value={current.fijos.prestamos} onChange={v => updateCurrent({ fijos: { ...current.fijos, prestamos: v } })} />
            </SectionCard>
            {/* Extras */}
            {(current.fijosExtra||[]).length > 0 && (
              <SectionCard title="Otros fijos" emoji="📌" color={C.blue} colorLight={C.blueLight}
                total={(current.fijosExtra||[]).reduce((s,c)=>s+(parseFloat(c.valor)||0),0)}>
                {(current.fijosExtra||[]).map((cat, i) => (
                  <div key={cat.id} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <InputField label={cat.label} prefix="$" value={cat.valor} onChange={v => {
                        const updated = [...current.fijosExtra]; updated[i] = { ...cat, valor: v };
                        updateCurrent({ fijosExtra: updated });
                      }} />
                    </div>
                    <button onClick={() => updateCurrent({ fijosExtra: current.fijosExtra.filter((_,j) => j!==i) })}
                      style={{ marginBottom: 14, background: C.redLight, border: "none", borderRadius: 8, padding: "9px 10px", color: C.red, fontFamily: SF, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </SectionCard>
            )}
            {/* Agregar categoría */}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <div style={{ display: "flex", flex: 1, alignItems: "center", background: C.white, border: `1.5px dashed ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <span style={{ padding: "9px 11px", color: C.muted, fontSize: 13, background: C.border, fontWeight: 600 }}>+</span>
                <input type="text" value={newFijoLabel} onChange={e => setNewFijoLabel(e.target.value)} placeholder="Nueva categoría fija…"
                  style={{ flex: 1, border: "none", background: "transparent", padding: "9px 12px", fontSize: 13, fontFamily: SF, color: C.text, outline: "none" }} />
              </div>
              <button onClick={() => { if (!newFijoLabel.trim()) return; updateCurrent({ fijosExtra: [...(current.fijosExtra||[]), { id: Date.now(), label: newFijoLabel.trim(), valor: "" }] }); setNewFijoLabel(""); }}
                style={{ padding: "0 14px", borderRadius: 10, border: "none", background: C.blue, color: "#FFF", fontFamily: SF, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Agregar</button>
            </div>
            {/* Total fijos */}
            <div style={{ marginTop: 16, background: C.blueLight, borderRadius: 12, padding: "12px 16px", border: `1.5px solid ${C.blue}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 800, color: C.text }}>Total gastos fijos</span>
                <span style={{ fontFamily: SF, fontSize: 14, fontWeight: 800, color: C.blue }}>{fmtCOP(totalFijos)}</span>
              </div>
            </div>
          </div>
        )}

        {/* VARIABLES */}
        {tab === "variables" && (
          <SectionCard title="Gastos Variables" emoji="🛒" color={C.yellow} colorLight={C.yellowLight} total={totalVariables}>
            {[["comida","Mercado / domicilios"],["salidas","Salidas / restaurantes"],["ropa","Ropa / accesorios"],["salud","Salud / bienestar / cuidado personal"],["mascotas","Mascota 🐱"],["otros","Otros / imprevistos"]].map(([k,l]) => (
              <InputField key={k} label={l} prefix="$" value={current.variables[k]} onChange={v => updateCurrent({ variables: { ...current.variables, [k]: v } })} />
            ))}
            {(current.variablesExtra||[]).map((cat, i) => (
              <div key={cat.id} style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <InputField label={cat.label} prefix="$" value={cat.valor} onChange={v => {
                    const updated = [...current.variablesExtra]; updated[i] = { ...cat, valor: v };
                    updateCurrent({ variablesExtra: updated });
                  }} />
                </div>
                <button onClick={() => updateCurrent({ variablesExtra: current.variablesExtra.filter((_,j) => j!==i) })}
                  style={{ marginBottom: 14, background: C.redLight, border: "none", borderRadius: 8, padding: "9px 10px", color: C.red, fontFamily: SF, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <div style={{ display: "flex", flex: 1, alignItems: "center", background: C.bg, border: `1.5px dashed ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <span style={{ padding: "9px 11px", color: C.muted, fontSize: 13, background: C.border, fontWeight: 600 }}>+</span>
                <input type="text" value={newVarLabel} onChange={e => setNewVarLabel(e.target.value)} placeholder="Nueva categoría variable…"
                  style={{ flex: 1, border: "none", background: "transparent", padding: "9px 12px", fontSize: 13, fontFamily: SF, color: C.text, outline: "none" }} />
              </div>
              <button onClick={() => { if (!newVarLabel.trim()) return; updateCurrent({ variablesExtra: [...(current.variablesExtra||[]), { id: Date.now(), label: newVarLabel.trim(), valor: "" }] }); setNewVarLabel(""); }}
                style={{ padding: "0 14px", borderRadius: 10, border: "none", background: C.yellow, color: "#FFF", fontFamily: SF, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Agregar</button>
            </div>
          </SectionCard>
        )}

        {/* AHORROS */}
        {tab === "ahorros" && (
          <div>
            <div style={{ background: `linear-gradient(135deg, ${C.green}, #5EEAD4)`, borderRadius: 18, padding: "20px", marginBottom: 16, boxShadow: "0 4px 16px rgba(34,201,135,0.25)" }}>
              <p style={{ fontFamily: SF, color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>💰 Total ahorrado</p>
              <p style={{ fontFamily: SF, color: "#FFF", fontSize: 32, fontWeight: 800 }}>{fmtCOP(totalAhorros)}</p>
              <p style={{ fontFamily: SF, color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 }}>💡 Meta 20% este mes: {fmtCOP(totalIngresos*0.2)}</p>
            </div>
            <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, padding: "18px", marginBottom: 16 }}>
              <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 14 }}>Agregar movimiento</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["suma","resta"].map(t => (
                  <button key={t} onClick={() => setNewTipo(t)}
                    style={{ flex: 1, padding: "8px", borderRadius: 10, border: `1.5px solid ${newTipo===t ? (t==="suma" ? C.green : C.red) : C.border}`, background: newTipo===t ? (t==="suma" ? C.greenLight : C.redLight) : C.white, color: newTipo===t ? (t==="suma" ? C.green : C.red) : C.muted, fontFamily: SF, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {t==="suma" ? "➕ Depositar" : "➖ Retirar"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                <span style={{ padding: "9px 11px", background: C.border, color: C.muted, fontFamily: SF, fontWeight: 600, fontSize: 13 }}>$</span>
                <input type="number" value={newMonto} onChange={e => setNewMonto(e.target.value)} placeholder="Monto en COP"
                  style={{ flex: 1, border: "none", background: "transparent", padding: "9px 12px", fontSize: 14, fontFamily: SF, fontWeight: 600, color: C.text, outline: "none" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                <span style={{ padding: "9px 11px", background: C.border, color: C.muted, fontFamily: SF, fontSize: 13 }}>📝</span>
                <input type="text" value={newNota} onChange={e => setNewNota(e.target.value)} placeholder="Nota (ej: ahorro abril, viaje…)"
                  style={{ flex: 1, border: "none", background: "transparent", padding: "9px 12px", fontSize: 13, fontFamily: SF, color: C.text, outline: "none" }} />
              </div>
              <button onClick={() => { if (!newMonto) return; setAhorros([...ahorros, { id: Date.now(), mes: `${mes} ${year}`, monto: newMonto, tipo: newTipo, nota: newNota || `${mes} ${year}` }]); setNewMonto(""); setNewNota(""); }}
                style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: C.purple, color: "#FFF", fontFamily: SF, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                Guardar movimiento
              </button>
            </div>
            <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1.5px solid ${C.border}`, background: C.purpleLight }}>
                <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 14, color: C.purple }}>📋 Historial</p>
              </div>
              {[...ahorros].reverse().map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", padding: "12px 18px", borderBottom: `1px solid ${C.border}`, gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{a.tipo==="suma" ? "💚" : "🔴"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: SF, fontSize: 13, fontWeight: 700, color: C.text }}>{a.nota}</p>
                    <p style={{ fontFamily: SF, fontSize: 11, color: C.muted, marginTop: 2 }}>{a.mes}</p>
                  </div>
                  <p style={{ fontFamily: SF, fontSize: 14, fontWeight: 800, color: a.tipo==="suma" ? C.green : C.red }}>{a.tipo==="suma" ? "+" : "-"}{fmtCOP(parseFloat(a.monto)||0)}</p>
                  <button onClick={() => setAhorros(ahorros.filter(x => x.id!==a.id))}
                    style={{ background: C.redLight, border: "none", borderRadius: 8, padding: "4px 8px", color: C.red, fontFamily: SF, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✕</button>
                </div>
              ))}
              {ahorros.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", background: C.greenLight }}>
                  <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 800, color: C.text }}>Total acumulado</span>
                  <span style={{ fontFamily: SF, fontSize: 14, fontWeight: 800, color: C.green }}>{fmtCOP(totalAhorros)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEUDAS */}
        {tab === "deudas" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: C.redLight, borderRadius: 14, padding: "14px 16px", border: `1.5px solid ${C.red}33` }}>
                <p style={{ fontFamily: SF, fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Pendientes</p>
                <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: C.red }}>{fmtCOP(deudas.filter(d=>!d.pagada).reduce((s,d)=>s+(parseFloat(d.monto)||0),0))}</p>
                <p style={{ fontFamily: SF, fontSize: 11, color: C.muted, marginTop: 2 }}>{deudas.filter(d=>!d.pagada).length} deuda(s)</p>
              </div>
              <div style={{ flex: 1, background: C.greenLight, borderRadius: 14, padding: "14px 16px", border: `1.5px solid ${C.green}33` }}>
                <p style={{ fontFamily: SF, fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Pagadas</p>
                <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: C.green }}>{fmtCOP(deudas.filter(d=>d.pagada).reduce((s,d)=>s+(parseFloat(d.monto)||0),0))}</p>
                <p style={{ fontFamily: SF, fontSize: 11, color: C.muted, marginTop: 2 }}>{deudas.filter(d=>d.pagada).length} pagada(s)</p>
              </div>
            </div>
            <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, padding: "18px", marginBottom: 16 }}>
              <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 14 }}>Agregar deuda</p>
              {[["📌","text","nombre","Nombre (ej: tarjeta, préstamo…)"],["$","number","monto","Monto total en COP"],["📝","text","notas","Notas opcionales"]].map(([pre,type,key,ph]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                  <span style={{ padding: "9px 11px", background: C.border, color: C.muted, fontFamily: SF, fontWeight: 600, fontSize: 13 }}>{pre}</span>
                  <input type={type} value={newDeuda[key]} onChange={e => setNewDeuda({...newDeuda,[key]:e.target.value})} placeholder={ph}
                    style={{ flex: 1, border: "none", background: "transparent", padding: "9px 12px", fontSize: 13, fontFamily: SF, color: C.text, outline: "none" }} />
                </div>
              ))}
              <button onClick={() => { if (!newDeuda.nombre||!newDeuda.monto) return; setDeudas([...deudas,{id:Date.now(),...newDeuda,pagada:false,mesPago:null}]); setNewDeuda({nombre:"",monto:"",notas:""}); }}
                style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: C.purple, color: "#FFF", fontFamily: SF, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Agregar deuda</button>
            </div>
            {deudas.filter(d=>!d.pagada).length > 0 && (
              <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "13px 18px", borderBottom: `1.5px solid ${C.border}`, background: C.redLight }}>
                  <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 13, color: C.red }}>🔴 Pendientes</p>
                </div>
                {deudas.filter(d=>!d.pagada).map(d => (
                  <div key={d.id} style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: SF, fontSize: 13, fontWeight: 700, color: C.text }}>{d.nombre}</p>
                      {d.notas && <p style={{ fontFamily: SF, fontSize: 11, color: C.muted, marginTop: 2 }}>{d.notas}</p>}
                    </div>
                    <p style={{ fontFamily: SF, fontSize: 14, fontWeight: 800, color: C.red }}>{fmtCOP(parseFloat(d.monto)||0)}</p>
                    <button onClick={() => { setPagoModal(d.id); setPagoFuente(""); }}
                      style={{ background: C.greenLight, border: `1.5px solid ${C.green}`, borderRadius: 8, padding: "5px 10px", color: C.green, fontFamily: SF, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>✓ Pagada</button>
                    <button onClick={() => setDeudas(deudas.filter(x=>x.id!==d.id))}
                      style={{ background: C.redLight, border: "none", borderRadius: 8, padding: "5px 8px", color: C.red, fontFamily: SF, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {deudas.filter(d=>d.pagada).length > 0 && (
              <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "13px 18px", borderBottom: `1.5px solid ${C.border}`, background: C.greenLight }}>
                  <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 13, color: C.green }}>✅ Pagadas</p>
                </div>
                {deudas.filter(d=>d.pagada).map(d => (
                  <div key={d.id} style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, opacity: 0.75 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: SF, fontSize: 13, fontWeight: 700, color: C.text, textDecoration: "line-through" }}>{d.nombre}</p>
                      <p style={{ fontFamily: SF, fontSize: 11, color: C.muted, marginTop: 2 }}>Pagada en {d.mesPago}{d.fuente ? ` · ${d.fuente}` : ""}</p>
                    </div>
                    <p style={{ fontFamily: SF, fontSize: 13, fontWeight: 700, color: C.green }}>{fmtCOP(parseFloat(d.monto)||0)}</p>
                    <button onClick={() => setDeudas(deudas.filter(x=>x.id!==d.id))}
                      style={{ background: C.redLight, border: "none", borderRadius: 8, padding: "5px 8px", color: C.red, fontFamily: SF, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {deudas.length === 0 && (
              <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
                <p style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: C.text }}>Sin deudas registradas</p>
              </div>
            )}
            {pagoModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(30,27,75,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480 }}>
                  <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6 }}>💳 ¿De dónde salió el dinero?</p>
                  <p style={{ fontFamily: SF, fontSize: 12, color: C.muted, marginBottom: 18 }}>{deudas.find(d=>d.id===pagoModal)?.nombre} · {fmtCOP(parseFloat(deudas.find(d=>d.id===pagoModal)?.monto)||0)}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {["💰 Ahorros","💼 Sueldo Plexo","🎨 Freelance","💳 Crédito","👤 Préstamo personal","🏦 Otro"].map(f => (
                      <button key={f} onClick={() => setPagoFuente(f)}
                        style={{ padding: "11px 16px", borderRadius: 12, border: `1.5px solid ${pagoFuente===f ? C.purple : C.border}`, background: pagoFuente===f ? C.purpleLight : C.white, color: pagoFuente===f ? C.purple : C.text, fontFamily: SF, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>{f}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPagoModal(null)} style={{ flex: 1, padding: "11px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontFamily: SF, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                    <button onClick={() => { if (!pagoFuente) return; setDeudas(deudas.map(x => x.id===pagoModal ? {...x,pagada:true,mesPago:`${mes} ${year}`,fuente:pagoFuente} : x)); setPagoModal(null); }}
                      style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", background: pagoFuente ? C.purple : C.border, color: "#FFF", fontFamily: SF, fontSize: 14, fontWeight: 800, cursor: pagoFuente ? "pointer" : "default" }}>Confirmar pago</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESUMEN */}
        {tab === "resumen" && (
          <div>
            <div style={{ background: balance>=0 ? `linear-gradient(135deg,${C.green},#5EEAD4)` : `linear-gradient(135deg,${C.red},#FF8FA3)`, borderRadius: 18, padding: "22px 20px", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <p style={{ fontFamily: SF, color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{balance>=0 ? "✅ Balance positivo" : "⚠️ Déficit"}</p>
              <p style={{ fontFamily: SF, color: "#FFF", fontSize: 30, fontWeight: 800, margin: "0 0 4px" }}>{fmtCOP(Math.abs(balance))}</p>
              <p style={{ fontFamily: SF, color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{mes} {year} · {balance>=0 ? "disponibles" : "en déficit"}</p>
            </div>
            {current.ingresos.plexo && (
              <div style={{ background: C.purpleLight, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1.5px solid ${C.purple}33` }}>
                <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 13, color: C.purple, marginBottom: 8 }}>💱 Conversión Plexo</p>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><p style={{ fontSize: 11, color: C.muted, fontFamily: SF, fontWeight: 600 }}>USD</p><p style={{ fontSize: 16, color: C.purple, fontFamily: SF, fontWeight: 800 }}>{fmtUSD(parseFloat(current.ingresos.plexo))}</p></div>
                  <div style={{ fontSize: 20, alignSelf: "center", color: C.muted }}>→</div>
                  <div style={{ textAlign: "right" }}><p style={{ fontSize: 11, color: C.muted, fontFamily: SF, fontWeight: 600 }}>COP (TRM {parseInt(tc).toLocaleString("es-CO")})</p><p style={{ fontSize: 16, color: C.purple, fontFamily: SF, fontWeight: 800 }}>{fmtCOP(plexoCOP)}</p></div>
                </div>
              </div>
            )}
            <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, padding: "18px 20px", marginBottom: 16 }}>
              <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 14 }}>Distribución</p>
              <ProgressBar label="🏠 Gastos Fijos" value={totalFijos} max={totalIngresos} color={C.blue} colorLight={C.blueLight} />
              <ProgressBar label="🛒 Gastos Variables" value={totalVariables} max={totalIngresos} color={C.yellow} colorLight={C.yellowLight} />
              <ProgressBar label="🐷 Ahorros acumulados" value={totalAhorros} max={totalIngresos} color={C.green} colorLight={C.greenLight} />
            </div>
            <div style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
              {[{ label:"💼 Ingresos",value:totalIngresos,color:C.green,bg:C.greenLight,sign:"+" },{ label:"🏠 Fijos",value:totalFijos,color:C.blue,bg:C.white,sign:"-" },{ label:"🛒 Variables",value:totalVariables,color:C.yellow,bg:C.bg,sign:"-" },{ label:"🐷 Ahorros",value:totalAhorros,color:C.green,bg:C.white,sign:"=" }].map((row,i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", background: row.bg, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: SF, fontSize: 13, color: C.text, fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontFamily: SF, fontSize: 13, color: row.color, fontWeight: 700 }}>{row.sign} {fmtCOP(row.value)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", background: balance>=0 ? C.greenLight : C.redLight }}>
                <span style={{ fontFamily: SF, fontSize: 14, color: C.text, fontWeight: 800 }}>Balance final</span>
                <span style={{ fontFamily: SF, fontSize: 14, color: balance>=0 ? C.green : C.red, fontWeight: 800 }}>{fmtCOP(balance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* COMPARAR */}
        {tab === "comparar" && (
          <div>
            <div style={{ background: C.purpleLight, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1.5px solid ${C.purple}33` }}>
              <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 13, color: C.purple }}>📈 Comparativa de meses guardados</p>
              <p style={{ fontFamily: SF, fontSize: 12, color: C.muted, marginTop: 4 }}>Todos los meses que hayas creado aparecen aquí.</p>
            </div>
            {existingMonths.length === 0 ? (
              <p style={{ fontFamily: SF, fontSize: 13, color: C.muted, textAlign: "center", padding: 20 }}>Todavía no hay meses guardados.</p>
            ) : (
              existingMonths.map(key => {
                const m = months[key];
                const tc2 = parseFloat(tasa)||3600;
                const ingP = (parseFloat(m.ingresos.plexo)||0)*tc2;
                const ing = ingP + (parseFloat(m.ingresos.freelance1)||0) + (parseFloat(m.ingresos.freelance2)||0) + (parseFloat(m.ingresos.otros)||0);
                const fij = Object.values(m.fijos).reduce((s,v)=>s+(parseFloat(v)||0),0) + (m.fijosExtra||[]).reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
                const vari = Object.values(m.variables).reduce((s,v)=>s+(parseFloat(v)||0),0) + (m.variablesExtra||[]).reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
                const bal = ing - fij - vari;
                const isActive = key === mesKey;
                return (
                  <div key={key} style={{ background: C.white, borderRadius: 16, border: `1.5px solid ${isActive ? C.purple : C.border}`, padding: "16px 18px", marginBottom: 12, boxShadow: isActive ? `0 0 0 3px ${C.purpleLight}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 15, color: isActive ? C.purple : C.text }}>{key} {isActive && <span style={{ fontSize: 10, background: C.purple, color: "#FFF", borderRadius: 20, padding: "2px 8px", marginLeft: 6 }}>actual</span>}</p>
                      <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 800, color: bal>=0 ? C.green : C.red }}>{fmtCOP(bal)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[{ l:"Ingresos",v:ing,c:C.green,cl:C.greenLight },{ l:"Fijos",v:fij,c:C.blue,cl:C.blueLight },{ l:"Variables",v:vari,c:C.yellow,cl:C.yellowLight }].map(item => (
                        <div key={item.l} style={{ flex: 1, background: item.cl, borderRadius: 10, padding: "8px 10px" }}>
                          <p style={{ fontFamily: SF, fontSize: 9, color: item.c, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.l}</p>
                          <p style={{ fontFamily: SF, fontSize: 11, color: C.text, fontWeight: 800 }}>{fmtCOP(item.v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Nuevo mes modal */}
      {newMesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30,27,75,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480 }}>
            <p style={{ fontFamily: SF, fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6 }}>📅 Nuevo mes</p>
            <p style={{ fontFamily: SF, fontSize: 12, color: C.muted, marginBottom: 20 }}>Se copiarán los gastos fijos y variables. Los ingresos freelance empezarán en cero.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <select value={newMesSel} onChange={e => setNewMesSel(e.target.value)}
                style={{ flex: 2, fontFamily: SF, fontSize: 14, fontWeight: 700, color: C.text, background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", outline: "none" }}>
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={newYearSel} onChange={e => setNewYearSel(e.target.value)}
                style={{ flex: 1, fontFamily: SF, fontSize: 14, fontWeight: 700, color: C.text, background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", outline: "none" }}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setNewMesModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontFamily: SF, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleNewMonth} style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", background: C.purple, color: "#FFF", fontFamily: SF, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Crear mes →</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input::placeholder { color: #B0AECF; }
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
