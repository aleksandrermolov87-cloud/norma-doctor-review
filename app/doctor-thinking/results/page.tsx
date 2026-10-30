"use client";

import { useState } from "react";

export default function ThinkingResults() {
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");
  async function download() {
    setMessage("");
    const response = await fetch("/api/doctor-thinking/export", { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!response.ok) { setMessage("Не удалось открыть выгрузку. Проверьте ключ доступа."); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url; link.download = "norma-doctor-thinking.csv"; link.click();
    URL.revokeObjectURL(url);
  }
  return <main className="results-page"><a href="/doctor-thinking">← К опросу</a><p className="overline">НОРМА · ИССЛЕДОВАНИЕ ВРАЧЕБНОГО МЫШЛЕНИЯ</p><h1>Выгрузка ответов</h1><p>Результаты этого опроса хранятся отдельно от разметки пациентских вопросов. Для скачивания CSV нужен ключ организатора.</p><label htmlFor="key">Ключ доступа</label><input id="key" type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} /><button className="button-primary" onClick={download} disabled={!key}>Скачать CSV</button>{message && <p role="alert">{message}</p>}</main>;
}
