"use client";

import { useEffect, useState } from "react";

export default function Manage() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const lines = value.split("\n").map(line => line.trim()).filter(Boolean);
  useEffect(() => {
    fetch("/api/questions", { cache: "no-store" }).then(r => r.json()).then(data => { const parsed = data as { questions: { text: string }[] }; setValue(parsed.questions.map(q => q.text).join("\n")); }).catch(() => setMessage("Не удалось загрузить вопросы."));
  }, []);
  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/questions", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ questions: lines }) });
      const data = await response.json() as { error?: string; count?: number };
      if (!response.ok) throw new Error(response.status === 401 ? "Неверный ключ доступа." : data.error || "Не удалось сохранить.");
      setMessage(`Сохранено вопросов: ${data.count}. Общая ссылка обновлена.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось сохранить."); }
    finally { setBusy(false); }
  }
  return <main className="manage-page"><a href="/">← К опросу</a><p className="overline">НОРМА · ОРГАНИЗАТОР</p><h1>Набор вопросов</h1><p className="manage-intro">Вставьте один вопрос на строку. До 100 вопросов. Врачи по общей ссылке увидят обновлённый тест; им вводить текст не нужно.</p><label htmlFor="questions">Вопросы <span>{lines.length} / 100</span></label><textarea id="questions" value={value} onChange={event => setValue(event.target.value)} rows={14} spellCheck={false}/><label htmlFor="key">Ключ организатора</label><input id="key" type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)}/><div className="manage-actions"><button className="button-primary" onClick={save} disabled={!key || busy || lines.length < 1 || lines.length > 100}>{busy ? "Сохраняем…" : "Сохранить набор"}</button><a href="/results">Скачать ответы →</a></div>{message && <p className="manage-message" role="status">{message}</p>}</main>;
}
