import { useState, useMemo } from "react";

const FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap";

// ─── Helpers ────────────────────────────────────────────────────────
const money = (x) => `$${Math.round(x).toLocaleString("en-US")}`;
const pct = (x) => `${x.toFixed(2)}%`;

function fixedMonthlyPI(loan, ratePct, years) {
  if (loan <= 0) return 0;
  const n = years * 12;
  const r = ratePct / 100 / 12;
  if (r === 0) return loan / n;
  return loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function ioMonthly(loan, ratePct) {
  if (loan <= 0) return 0;
  return loan * (ratePct / 100 / 12);
}

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Reusable Components ────────────────────────────────────────────

function Field({ label, value, onChange, prefix, suffix, step, min = 0, small, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: small ? "0 0 auto" : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: "#8a8f98", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", background: "#1a1d24", borderRadius: 8, border: "1px solid #2a2e37", overflow: "hidden", height: 40 }}>
        {prefix && <span style={{ padding: "0 0 0 10px", color: "#5a5f6a", fontSize: 14, fontFamily: "'DM Sans'" }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step || 1}
          min={min}
          style={{
            background: "transparent", border: "none", outline: "none", color: "#e8eaed",
            fontSize: 14, fontFamily: "'DM Sans', sans-serif", padding: "0 10px", width: "100%",
            height: "100%", MozAppearance: "textfield",
          }}
        />
        {suffix && <span style={{ padding: "0 10px 0 0", color: "#5a5f6a", fontSize: 13, fontFamily: "'DM Sans'", whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
      {hint && <span style={{ fontSize: 11, color: "#555a63" }}>{hint}</span>}
    </div>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", background: "#1a1d24", borderRadius: 8, border: "1px solid #2a2e37", overflow: "hidden" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "7px 14px", fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans'",
            border: "none", cursor: "pointer", transition: "all .2s",
            background: value === opt.value ? "#2c6fef" : "transparent",
            color: value === opt.value ? "#fff" : "#8a8f98",
          }}
        >{opt.label}</button>
      ))}
    </div>
  );
}

function DynamicList({ items, setItems, defaultName, addLabel }) {
  const add = () => setItems([...items, { id: uid(), name: defaultName, amount: 0 }]);
  const remove = (id) => setItems(items.filter((i) => i.id !== id));
  const update = (id, field, val) => setItems(items.map((i) => (i.id === id ? { ...i, [field]: val } : i)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item) => (
        <div key={item.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            value={item.name}
            onChange={(e) => update(item.id, "name", e.target.value)}
            style={{
              flex: 1, background: "#1a1d24", border: "1px solid #2a2e37", borderRadius: 8,
              color: "#e8eaed", fontSize: 13, fontFamily: "'DM Sans'", padding: "8px 10px", outline: "none",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", background: "#1a1d24", borderRadius: 8, border: "1px solid #2a2e37", overflow: "hidden", width: 120, height: 38 }}>
            <span style={{ padding: "0 0 0 8px", color: "#5a5f6a", fontSize: 13 }}>$</span>
            <input
              type="number"
              value={item.amount}
              onChange={(e) => update(item.id, "amount", parseFloat(e.target.value) || 0)}
              min={0}
              step={25}
              style={{
                background: "transparent", border: "none", outline: "none", color: "#e8eaed",
                fontSize: 13, fontFamily: "'DM Sans'", padding: "0 8px", width: "100%", height: "100%",
              }}
            />
          </div>
          <button
            onClick={() => remove(item.id)}
            style={{
              background: "none", border: "none", color: "#555a63", cursor: "pointer",
              fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 4, transition: "color .15s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.target.style.color = "#555a63")}
          >×</button>
        </div>
      ))}
      <button
        onClick={add}
        style={{
          background: "none", border: "1px dashed #2a2e37", borderRadius: 8, color: "#5a7fcc",
          fontSize: 12, fontFamily: "'DM Sans'", padding: "7px 0", cursor: "pointer",
          transition: "all .15s", marginTop: 2,
        }}
        onMouseEnter={(e) => { e.target.style.borderColor = "#5a7fcc"; e.target.style.background = "#1a1d2488"; }}
        onMouseLeave={(e) => { e.target.style.borderColor = "#2a2e37"; e.target.style.background = "none"; }}
      >+ {addLabel}</button>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #1e2128" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", color: "#c0c4cc", cursor: "pointer",
          padding: "14px 0", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'",
          letterSpacing: "0.03em", textTransform: "uppercase",
        }}
      >
        {title}
        <span style={{ fontSize: 11, color: "#555a63", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>▼</span>
      </button>
      {open && <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>}
    </div>
  );
}

function KPI({ label, value, sub, accent }) {
  return (
    <div style={{
      flex: 1, background: "#13151a", borderRadius: 12, border: "1px solid #1e2128",
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: 6,
      minWidth: 0,
    }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7080", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
      <span style={{
        fontSize: 28, fontWeight: 700, fontFamily: "'Instrument Serif', serif",
        color: accent || "#e8eaed", letterSpacing: "-0.02em", lineHeight: 1.1,
      }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "#555a63" }}>{sub}</span>}
    </div>
  );
}

function BreakdownRow({ label, amount, highlight, indent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: `8px ${indent ? "0 8px 16px" : "0"}`,
      borderBottom: "1px solid #1a1d24",
    }}>
      <span style={{ fontSize: 13, color: highlight ? "#e8eaed" : "#9a9faa", fontWeight: highlight ? 600 : 400 }}>{label}</span>
      <span style={{
        fontSize: 14, fontFamily: "'DM Sans'", fontWeight: highlight ? 700 : 500,
        color: highlight ? "#e8eaed" : "#c0c4cc", fontVariantNumeric: "tabular-nums",
      }}>{money(amount)}</span>
    </div>
  );
}

function BarSegment({ items, total }) {
  const colors = ["#2c6fef", "#5b93f5", "#3dd68c", "#f5c542", "#ef6b4a", "#a78bfa", "#f472b6"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10, background: "#1a1d24" }}>
        {items.filter(i => i.amount > 0).map((item, idx) => (
          <div
            key={idx}
            style={{
              width: `${(item.amount / total) * 100}%`,
              background: colors[idx % colors.length],
              transition: "width .4s ease",
              minWidth: 2,
            }}
            title={`${item.label}: ${money(item.amount)}`}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
        {items.filter(i => i.amount > 0).map((item, idx) => (
          <span key={idx} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8a8f98" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[idx % colors.length], display: "inline-block" }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────

export default function App() {
  // New scenario
  const [homePrice, setHomePrice] = useState(1650000);
  const [downPayment, setDownPayment] = useState(365000);
  const [mortgageType, setMortgageType] = useState("30fixed");
  const [rate, setRate] = useState(5.7);
  const [hoa, setHoa] = useState(330);
  const [pmi, setPmi] = useState(0);
  const [taxMode, setTaxMode] = useState("dollar");
  const [annualTax, setAnnualTax] = useState(24000);
  const [taxRatePct, setTaxRatePct] = useState(1.45);
  const [annualInsurance, setAnnualInsurance] = useState(4000);
  const [addons, setAddons] = useState([{ id: uid(), name: "Pool / other", amount: 130 }]);
  const [newStateTax, setNewStateTax] = useState(0);

  // Baseline
  const [currentMortgage, setCurrentMortgage] = useState(3550);
  const [cars, setCars] = useState([{ id: uid(), name: "Car #1", amount: 1286 }]);
  const [otherFixed, setOtherFixed] = useState([{ id: uid(), name: "Other fixed", amount: 0 }]);
  const [removables, setRemovables] = useState([{ id: uid(), name: "Landscaping", amount: 300 }]);
  const [currentStateTax, setCurrentStateTax] = useState(2000);

  // Active panel on mobile
  const [activePanel, setActivePanel] = useState("scenario");

  // ─── Calculations ─────────────────────────────────────
  const calc = useMemo(() => {
    const loan = Math.max(0, homePrice - downPayment);
    const effectiveTax = taxMode === "dollar" ? annualTax : homePrice * (taxRatePct / 100);
    const monthlyTax = effectiveTax / 12;
    const monthlyIns = annualInsurance / 12;
    const addonTotal = addons.reduce((s, i) => s + i.amount, 0);
    const carTotal = cars.reduce((s, i) => s + i.amount, 0);
    const fixedTotal = otherFixed.reduce((s, i) => s + i.amount, 0);
    const removableTotal = removables.reduce((s, i) => s + i.amount, 0);

    const pi = mortgageType === "30fixed"
      ? fixedMonthlyPI(loan, rate, 30)
      : ioMonthly(loan, rate);

    const postIO = mortgageType !== "30fixed" ? fixedMonthlyPI(loan, rate, 23) : null;

    const newTotal = pi + monthlyTax + monthlyIns + hoa + pmi + addonTotal + newStateTax;
    const baseTotal = currentMortgage + carTotal + fixedTotal + currentStateTax;
    const delta = newTotal - baseTotal + removableTotal;

    return {
      loan, effectiveTax, monthlyTax, monthlyIns, addonTotal, carTotal, fixedTotal,
      removableTotal, pi, postIO, newTotal, baseTotal, delta,
      newBreakdown: [
        { label: mortgageType === "30fixed" ? "P&I (30yr)" : "Interest Only (IO)", amount: pi },
        { label: "Property Tax", amount: monthlyTax },
        { label: "Insurance", amount: monthlyIns },
        { label: "HOA", amount: hoa },
        { label: "PMI", amount: pmi },
        { label: "Add-ons", amount: addonTotal },
        { label: "State Tax", amount: newStateTax },
      ],
      baseBreakdown: [
        { label: "Current Mortgage", amount: currentMortgage },
        { label: "Cars", amount: carTotal },
        { label: "Other Fixed", amount: fixedTotal },
        { label: "State Tax", amount: currentStateTax },
      ],
    };
  }, [homePrice, downPayment, mortgageType, rate, hoa, pmi, taxMode, annualTax, taxRatePct, annualInsurance, addons, newStateTax, currentMortgage, cars, otherFixed, removables, currentStateTax]);

  const deltaColor = calc.delta > 0 ? "#ef4444" : calc.delta < 0 ? "#3dd68c" : "#8a8f98";
  const deltaSign = calc.delta > 0 ? "+" : "";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0f13", color: "#e8eaed", minHeight: "100vh" }}>
      <link href={FONT_URL} rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::selection { background: #2c6fef44; }
        @media (max-width: 860px) {
          .layout { flex-direction: column !important; }
          .sidebar { width: 100% !important; max-height: none !important; position: static !important; }
          .main { padding: 20px 16px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a1d24", padding: "16px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 20, fontFamily: "'Instrument Serif', serif", fontWeight: 400, letterSpacing: "-0.02em" }}>
            Mortgage Simulator
          </span>
          <span style={{ fontSize: 11, color: "#555a63", fontWeight: 500 }}>SCENARIO COMPARE</span>
        </div>
        <span style={{ fontSize: 11, color: "#3a3e48" }}>
          {money(calc.loan)} loan · {pct(rate)}
        </span>
      </div>

      <div className="layout" style={{ display: "flex", minHeight: "calc(100vh - 57px)" }}>
        {/* ─── Sidebar ─── */}
        <div className="sidebar" style={{
          width: 360, background: "#101218", borderRight: "1px solid #1a1d24",
          overflowY: "auto", maxHeight: "calc(100vh - 57px)", position: "sticky", top: 57,
          padding: "4px 20px 40px",
        }}>
          {/* Panel toggle for inputs */}
          <div style={{ display: "flex", gap: 0, margin: "16px 0 8px", borderBottom: "1px solid #1e2128" }}>
            {[["scenario", "New Scenario"], ["baseline", "Current Baseline"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setActivePanel(k)}
                style={{
                  flex: 1, background: "none", border: "none", borderBottom: activePanel === k ? "2px solid #2c6fef" : "2px solid transparent",
                  color: activePanel === k ? "#e8eaed" : "#555a63", cursor: "pointer",
                  padding: "10px 0", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans'",
                  letterSpacing: "0.04em", textTransform: "uppercase", transition: "all .2s",
                }}
              >{l}</button>
            ))}
          </div>

          {activePanel === "scenario" ? (
            <>
              <Section title="Purchase" defaultOpen={true}>
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label="Home Price" prefix="$" value={homePrice} onChange={setHomePrice} step={10000} />
                  <Field label="Down Payment" prefix="$" value={downPayment} onChange={setDownPayment} step={5000} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "#8a8f98", letterSpacing: "0.04em", textTransform: "uppercase" }}>Mortgage Type</label>
                    <Toggle
                      options={[{ value: "30fixed", label: "30yr Fixed" }, { value: "io", label: "7/1 IO" }]}
                      value={mortgageType}
                      onChange={setMortgageType}
                    />
                  </div>
                  <Field label="Rate" suffix="%" value={rate} onChange={setRate} step={0.05} small />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label="HOA" prefix="$" suffix="/mo" value={hoa} onChange={setHoa} step={25} />
                  <Field label="PMI" prefix="$" suffix="/mo" value={pmi} onChange={setPmi} step={25} />
                </div>
              </Section>

              <Section title="Taxes & Insurance" defaultOpen={true}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: "#8a8f98", letterSpacing: "0.04em", textTransform: "uppercase" }}>Property Tax Input</label>
                  <Toggle
                    options={[{ value: "dollar", label: "$/year" }, { value: "pct", label: "% of price" }]}
                    value={taxMode}
                    onChange={setTaxMode}
                  />
                </div>
                {taxMode === "dollar"
                  ? <Field label="Annual Property Tax" prefix="$" suffix="/yr" value={annualTax} onChange={setAnnualTax} step={500} />
                  : <Field label="Tax Rate" suffix="%" value={taxRatePct} onChange={setTaxRatePct} step={0.05} hint={`= ${money(homePrice * taxRatePct / 100)}/yr`} />
                }
                <Field label="Annual Insurance" prefix="$" suffix="/yr" value={annualInsurance} onChange={setAnnualInsurance} step={250} />
                <Field label="New State Income Tax" prefix="$" suffix="/mo" value={newStateTax} onChange={setNewStateTax} step={50} hint="FL = $0" />
              </Section>

              <Section title="Monthly Add-ons" defaultOpen={false}>
                <span style={{ fontSize: 11, color: "#555a63" }}>Pool service, private HOA, extra utilities, etc.</span>
                <DynamicList items={addons} setItems={setAddons} defaultName="Add-on" addLabel="Add item" />
              </Section>
            </>
          ) : (
            <>
              <Section title="Housing" defaultOpen={true}>
                <Field label="Current All-in Mortgage" prefix="$" suffix="/mo" value={currentMortgage} onChange={setCurrentMortgage} step={50} />
                <Field label="Current State Income Tax" prefix="$" suffix="/mo" value={currentStateTax} onChange={setCurrentStateTax} step={50} hint="NJ withholding" />
              </Section>

              <Section title="Cars" defaultOpen={true}>
                <DynamicList items={cars} setItems={setCars} defaultName="Car" addLabel="Add car" />
              </Section>

              <Section title="Other Fixed Bills" defaultOpen={false}>
                <DynamicList items={otherFixed} setItems={setOtherFixed} defaultName="Fixed bill" addLabel="Add bill" />
              </Section>

              <Section title="Removable Expenses" defaultOpen={true}>
                <span style={{ fontSize: 11, color: "#555a63" }}>These go away in the new scenario and reduce your delta.</span>
                <DynamicList items={removables} setItems={setRemovables} defaultName="Removable" addLabel="Add removable" />
              </Section>
            </>
          )}
        </div>

        {/* ─── Main Content ─── */}
        <div className="main" style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
          {/* KPI Cards */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
            <KPI label="New Monthly" value={money(calc.newTotal)} sub="all-in with state tax" accent="#2c6fef" />
            <KPI label="Current Monthly" value={money(calc.baseTotal)} sub="mortgage + cars + fixed + state tax" />
            <KPI
              label="Monthly Delta"
              value={`${deltaSign}${money(Math.abs(calc.delta))}`}
              sub={calc.removableTotal > 0 ? `after ${money(calc.removableTotal)} removables` : undefined}
              accent={deltaColor}
            />
          </div>

          {/* Status banner */}
          <div style={{
            padding: "12px 18px", borderRadius: 10, marginBottom: 28, fontSize: 13,
            background: calc.delta > 0 ? "#ef444412" : calc.delta < 0 ? "#3dd68c12" : "#8a8f9812",
            color: deltaColor, border: `1px solid ${deltaColor}22`,
          }}>
            {calc.delta > 0
              ? `This scenario increases monthly spend by ${money(Math.abs(calc.delta))} after accounting for removables and state tax changes.`
              : calc.delta < 0
                ? `This scenario saves you ${money(Math.abs(calc.delta))}/mo after accounting for removables and state tax changes.`
                : "Net neutral — same monthly spend."}
            {calc.postIO && (
              <span style={{ display: "block", marginTop: 6, color: "#8a8f98", fontSize: 12 }}>
                ⚠ Post-IO estimate (amortize remaining over 23yr @ same rate): ~{money(calc.postIO)}/mo P&I
              </span>
            )}
          </div>

          {/* Breakdowns side by side */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {/* New scenario */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#c0c4cc" }}>New Scenario</span>
                <span style={{ fontSize: 20, fontFamily: "'Instrument Serif'", color: "#2c6fef" }}>{money(calc.newTotal)}</span>
              </div>
              <BarSegment items={calc.newBreakdown} total={calc.newTotal} />
              <div style={{ marginTop: 14 }}>
                {calc.newBreakdown.map((r, i) => (
                  <BreakdownRow key={i} label={r.label} amount={r.amount} />
                ))}
                <BreakdownRow label="Total" amount={calc.newTotal} highlight />
              </div>
            </div>

            {/* Baseline */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#c0c4cc" }}>Current Baseline</span>
                <span style={{ fontSize: 20, fontFamily: "'Instrument Serif'", color: "#e8eaed" }}>{money(calc.baseTotal)}</span>
              </div>
              <BarSegment items={calc.baseBreakdown} total={calc.baseTotal} />
              <div style={{ marginTop: 14 }}>
                {calc.baseBreakdown.map((r, i) => (
                  <BreakdownRow key={i} label={r.label} amount={r.amount} />
                ))}
                {calc.removableTotal > 0 && (
                  <BreakdownRow label="Removables (eliminated)" amount={-calc.removableTotal} />
                )}
                <BreakdownRow label="Total" amount={calc.baseTotal} highlight />
              </div>
            </div>
          </div>

          {/* Loan summary */}
          <div style={{
            marginTop: 32, padding: "16px 20px", background: "#101218", borderRadius: 10,
            border: "1px solid #1a1d24", display: "flex", flexWrap: "wrap", gap: "8px 32px",
            fontSize: 12, color: "#6b7080",
          }}>
            <span>Loan: <strong style={{ color: "#9a9faa" }}>{money(calc.loan)}</strong></span>
            <span>Down: <strong style={{ color: "#9a9faa" }}>{money(downPayment)}</strong> ({((downPayment / homePrice) * 100).toFixed(1)}%)</span>
            <span>Rate: <strong style={{ color: "#9a9faa" }}>{pct(rate)}</strong></span>
            <span>Type: <strong style={{ color: "#9a9faa" }}>{mortgageType === "30fixed" ? "30yr Fixed" : "7/1 IO"}</strong></span>
            <span>Annual Tax: <strong style={{ color: "#9a9faa" }}>{money(calc.effectiveTax)}</strong></span>
            <span>Annual Insurance: <strong style={{ color: "#9a9faa" }}>{money(annualInsurance)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
