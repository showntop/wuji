// 视图装配：M1 起按 INTERFACE.md IA 逐步替换本占位
export default function App() {
  return (
    <main style={{ background: "var(--floor)", color: "var(--ink)", minHeight: "100vh",
                   fontFamily: "var(--f-body)", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--f-cond)", fontWeight: 700, fontSize: 28 }}>无极 · 工程版骨架</div>
        <p style={{ color: "var(--ink-3)" }}>M0 —— model / store / workflow / viewers 就位后此页接真数据</p>
      </div>
    </main>
  );
}
