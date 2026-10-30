// Replace this demonstration set with the approved question list before sending to doctors.
// Keep stable IDs when editing wording after responses have been collected.
export const questions = [
  { id: "q01", text: "Как правильно подготовиться к общему анализу крови?", group: "Подготовка" },
  { id: "q02", text: "Какие вопросы стоит задать врачу перед началом нового лечения?", group: "Лечение" },
  { id: "q03", text: "В каких случаях после приёма лекарства нужна срочная медицинская помощь?", group: "Безопасность" },
  { id: "q04", text: "Что делать, если я пропустил приём назначенного лекарства?", group: "Лечение" },
  { id: "q05", text: "Как подготовиться к дистанционной консультации с врачом?", group: "Консультация" },
  { id: "q06", text: "Какие данные полезно записывать в дневник симптомов?", group: "Самонаблюдение" },
  { id: "q07", text: "Когда стоит повторно обратиться к врачу, если симптомы сохраняются?", group: "Безопасность" },
  { id: "q08", text: "Как сообщить врачу о принимаемых лекарствах и добавках?", group: "Консультация" },
] as const;

if (questions.length > 100) throw new Error("Question limit is 100");
