"use client";

import { useEffect, useMemo, useState } from "react";

type Option = { id: string; label: string };
type Question = { id: string; group: string; text: string; options: Option[] };
const skip: Option = { id: "na", label: "Не относится к моей практике" };

export default function ReasoningReview({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [participantId, setParticipantId] = useState("");
  const storageKey = "norma-doctor-thinking-v1";
  const signature = questions.map(q => q.id + ":" + q.text).join("|");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (saved.signature !== signature) { setParticipantId(crypto.randomUUID()); return; }
      setAnswers(saved.answers || {});
      setIndex(Math.max(0, Math.min(Number(saved.index) || 0, questions.length - 1)));
      setParticipantId(saved.participantId || crypto.randomUUID());
      if (saved.done) setStatus("done");
    } catch { setParticipantId(crypto.randomUUID()); }
  }, [signature, questions.length]);

  useEffect(() => {
    if (participantId) localStorage.setItem(storageKey, JSON.stringify({ signature, answers, index, participantId, done: status === "done" }));
  }, [signature, answers, index, participantId, status]);

  const count = useMemo(() => questions.filter(q => answers[q.id]).length, [answers, questions]);
  const current = questions[index];
  const choices = [...current.options, skip];
  const complete = count === questions.length;

  function answer(value: string) {
    if (status === "done" || status === "sending") return;
    setAnswers(prev => ({ ...prev, [current.id]: value }));
    if (index < questions.length - 1) setIndex(index + 1);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || status === "done" || status === "sending") return;
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
      const choice = choices[Number(event.key) - 1];
      if (choice) answer(choice.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, status]);

  async function submit() {
    if (!complete || !participantId) return;
    setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/doctor-thinking/responses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, answers }),
      });
      if (!response.ok) throw new Error(response.status === 409 ? "Этот проход уже сохранён. Можно начать новый." : "Не удалось сохранить ответы. Попробуйте ещё раз.");
      setStatus("done");
    } catch (cause) { setStatus("error"); setError(cause instanceof Error ? cause.message : "Не удалось отправить ответы."); }
  }

  function restart() {
    setAnswers({}); setIndex(0); setParticipantId(crypto.randomUUID()); setStatus("idle"); setError("");
  }

  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner"><a className="brand" href="/doctor-thinking" aria-label="НОРМА — опрос врачей"><span className="brand-mark">✳</span> НОРМА<span className="brand-sub">/ Исследование</span></a><span className="topbar-tag">Клиническое мышление</span></div></header>
    <main className="page" id="main">
      <div className="eyebrow"><span className="eyebrow-dot"/> ОПРОС ДЛЯ ВРАЧЕЙ <span className="eyebrow-rule"/> 50 СИТУАЦИЙ</div>
      <div className="heading-row"><div><h1>Как вы принимаете решения</h1><p className="lead">50 коротких ситуаций о вашей обычной последовательности действий. Выберите наиболее близкий вариант. Писать ничего не нужно.</p></div><div className="set-badge"><strong>50</strong><span>ситуаций<br/>в опросе</span></div></div>
      <div className="context-strip"><span className="context-icon">i</span><p>Здесь нет правильных ответов и оценки врача. Опрос анонимный; не используйте сведения о реальных пациентах.</p></div>
      {status === "done" ? <section className="done-card" aria-live="polite"><div className="done-icon">✓</div><p className="overline">ОТВЕТЫ СОХРАНЕНЫ</p><h2>Спасибо за участие</h2><p>Ваш выбор записан. Другой врач может пройти опрос по той же ссылке.</p><button className="button-secondary" onClick={restart}>Начать новый проход на этом устройстве</button></section> : <div className="survey-layout">
        <aside className="rail"><div className="rail-card"><p className="overline">ПРОГРЕСС</p><div className="progress-count"><strong>{count}</strong><span> / {questions.length}</span></div><div className="progress-track"><div style={{ width: `${count / questions.length * 100}%` }}/></div><p className="rail-note">Выбрано ответов</p><div className="rail-divider"/><p className="overline">ПЕРЕХОД К СИТУАЦИИ</p><div className="question-grid">{questions.map((q, i) => <button key={q.id} type="button" className={`question-step ${i === index ? "active" : ""} ${answers[q.id] ? "answered" : ""}`} onClick={() => setIndex(i)} aria-label={`Ситуация ${i + 1}${answers[q.id] ? ", отвечена" : ""}`} aria-current={i === index ? "step" : undefined}>{i + 1}</button>)}</div></div><p className="rail-foot">Ответы сохраняются на этом устройстве до отправки.</p></aside>
        <div className="survey-main"><section className="question-card reasoning-card" aria-labelledby="thinking-question-title"><div className="question-meta"><span className="question-number">СИТУАЦИЯ {String(index + 1).padStart(2, "0")} / 50</span><span className="group-pill">{current.group}</span></div><h2 id="thinking-question-title">{current.text}</h2><p className="prompt">Что ближе к вашей обычной практике?</p><div className="choices" role="radiogroup" aria-label="Вариант ответа">{choices.map((choice, i) => <button key={choice.id} type="button" role="radio" aria-checked={answers[current.id] === choice.id} className={`choice reasoning-choice ${answers[current.id] === choice.id ? "selected" : ""}`} onClick={() => answer(choice.id)}><span className="choice-radio"><span/></span><span className="choice-copy"><strong>{choice.label}</strong></span><kbd>{i + 1}</kbd></button>)}</div></section><div className="nav-row"><button className="text-button" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Предыдущая</button><span>{index + 1} из {questions.length}</span><button className="text-button" disabled={index === questions.length - 1} onClick={() => setIndex(index + 1)}>Следующая →</button></div>{complete && <div className="submit-card"><div><strong>Все ситуации пройдены</strong><p>Проверьте ответы или отправьте их.</p></div><button className="button-primary" disabled={status === "sending"} onClick={submit}>{status === "sending" ? "Сохраняем…" : "Отправить ответы"} <span>↗</span></button></div>}{error && <p className="error" role="alert">{error}</p>}</div>
      </div>}
    </main><footer className="footer"><span>НОРМА · исследование врачебного мышления</span><span>Анонимный опрос · 50 ситуаций</span></footer>
  </div>;
}
