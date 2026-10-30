"use client";

import { useEffect, useMemo, useState } from "react";

type Question = { id: string; text: string; group: string };
type Verdict = "ready" | "clarify" | "reject" | "unsure";
const choices: { id: Verdict; label: string; hint: string }[] = [
  { id: "ready", label: "Подходит", hint: "Вопрос понятен и уместен" },
  { id: "clarify", label: "Нужно уточнить", hint: "Не хватает контекста или точности" },
  { id: "reject", label: "Не подходит", hint: "Вопрос следует исключить" },
  { id: "unsure", label: "Не могу оценить", hint: "Вне моей компетенции" },
];

export default function Review({ questions }: { questions: readonly Question[] }) {
  const [answers, setAnswers] = useState<Record<string, Verdict>>({});
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [participantId, setParticipantId] = useState("");
  const storageKey = "norma-question-review-v1";
  const signature = questions.map(q => q.id).join("|");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (saved.signature !== signature) {
        setParticipantId(crypto.randomUUID());
        return;
      }
      setAnswers(saved.answers || {});
      setIndex(Math.min(Number(saved.index) || 0, questions.length - 1));
      setParticipantId(saved.participantId || crypto.randomUUID());
      if (saved.done) setStatus("done");
    } catch { setParticipantId(crypto.randomUUID()); }
  }, [signature, questions.length]);

  useEffect(() => {
    if (participantId) localStorage.setItem(storageKey, JSON.stringify({ signature, answers, index, participantId, done: status === "done" }));
  }, [signature, answers, index, participantId, status]);

  const count = useMemo(() => questions.filter(q => answers[q.id]).length, [answers, questions]);
  const current = questions[index];
  const complete = count === questions.length;

  function answer(value: Verdict) {
    if (status === "done") return;
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
      const response = await fetch("/api/responses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, answers }),
      });
      if (!response.ok) throw new Error(response.status === 409 ? "Ответ уже сохранён. Можно начать новый проход." : "Не удалось сохранить ответ. Попробуйте ещё раз.");
      setStatus("done");
    } catch (cause) { setStatus("error"); setError(cause instanceof Error ? cause.message : "Не удалось отправить ответ."); }
  }

  function restart() {
    setAnswers({}); setIndex(0); setParticipantId(crypto.randomUUID()); setStatus("idle"); setError("");
  }

  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner"><a className="brand" href="/" aria-label="НОРМА — главная"><span className="brand-mark">✳</span> НОРМА<span className="brand-sub">/ Исследование</span></a><span className="topbar-tag">Экспертная разметка</span></div></header>
    <main className="page" id="main">
      <div className="eyebrow"><span className="eyebrow-dot"/> ОПРОС ДЛЯ ВРАЧЕЙ <span className="eyebrow-rule"/> ДО {questions.length} ВОПРОСОВ</div>
      <div className="heading-row"><div><h1>Оценка вопросов</h1><p className="lead">Помогите отобрать понятные и уместные вопросы для НОРМЫ. Выберите один вариант для каждого пункта — вводить текст не нужно.</p></div><div className="set-badge"><strong>{questions.length}</strong><span>вопросов<br/>в наборе</span></div></div>
      <div className="context-strip"><span className="context-icon">i</span><p>Это шаблон с демонстрационными вопросами. Не включайте в ответы персональные данные пациентов.</p></div>
      {status === "done" ? <section className="done-card" aria-live="polite"><div className="done-icon">✓</div><p className="overline">ОТВЕТ СОХРАНЁН</p><h2>Спасибо за участие</h2><p>Ваши оценки записаны. Другой врач может пройти тест по этой же ссылке.</p><button className="button-secondary" onClick={restart}>Начать новый проход на этом устройстве</button></section> : <div className="survey-layout">
        <aside className="rail"><div className="rail-card"><p className="overline">ПРОГРЕСС</p><div className="progress-count"><strong>{count}</strong><span> / {questions.length}</span></div><div className="progress-track"><div style={{ width: `${count / questions.length * 100}%` }}/></div><p className="rail-note">Оценено вопросов</p><div className="rail-divider"/><p className="overline">ПЕРЕХОД К ВОПРОСУ</p><div className="question-grid">{questions.map((q, i) => <button key={q.id} type="button" className={`question-step ${i === index ? "active" : ""} ${answers[q.id] ? "answered" : ""}`} onClick={() => setIndex(i)} aria-label={`Вопрос ${i + 1}${answers[q.id] ? ", оценён" : ""}`} aria-current={i === index ? "step" : undefined}>{i + 1}</button>)}</div></div><p className="rail-foot">Ответы сохраняются на этом устройстве до отправки.</p></aside>
        <div className="survey-main"><section className="question-card" aria-labelledby="question-title"><div className="question-meta"><span className="question-number">ВОПРОС {String(index + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span><span className="group-pill">{current.group}</span></div><h2 id="question-title">{current.text}</h2><p className="prompt">Как вы оцениваете этот вопрос?</p><div className="choices" role="radiogroup" aria-label="Оценка вопроса">{choices.map((choice, i) => <button key={choice.id} type="button" role="radio" aria-checked={answers[current.id] === choice.id} className={`choice ${answers[current.id] === choice.id ? "selected" : ""}`} onClick={() => answer(choice.id)}><span className="choice-radio"><span/></span><span className="choice-copy"><strong>{choice.label}</strong><small>{choice.hint}</small></span><kbd>{i + 1}</kbd></button>)}</div></section><div className="nav-row"><button className="text-button" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Предыдущий</button><span>{index + 1} из {questions.length}</span><button className="text-button" disabled={index === questions.length - 1} onClick={() => setIndex(index + 1)}>Следующий →</button></div>{complete && <div className="submit-card"><div><strong>Все вопросы оценены</strong><p>Проверьте ответы или отправьте их.</p></div><button className="button-primary" disabled={status === "sending"} onClick={submit}>{status === "sending" ? "Сохраняем…" : "Отправить ответы"} <span>↗</span></button></div>}{error && <p className="error" role="alert">{error}</p>}</div>
      </div>}
    </main><footer className="footer"><span>НОРМА · экспертная разметка</span><span>Демонстрационный набор · {questions.length} вопросов</span></footer>
  </div>;
}
