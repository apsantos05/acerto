/**
 * Acerte — Builder do seed de simulados (questões autorais + regras oficiais).
 * Lê content/simulados.json e gera supabase/seed_simulados.sql.
 * Idempotente: ATUALIZA metadados (regras, tempos) de simulados existentes e
 * INSERE os novos (com suas questões) por título.
 */
import { readFileSync, writeFileSync } from "node:fs";

const { simulados } = JSON.parse(readFileSync("content/simulados.json", "utf8"));
const esc = (s) => String(s).replace(/'/g, "''");
const jsonbLit = (obj) => `'${esc(JSON.stringify(obj))}'::jsonb`;
const arrLit = (a) => "ARRAY[" + a.map((s) => `'${esc(s)}'`).join(",") + "]::text[]";

const out = [];
out.push("-- ACERTE — Seed de simulados (questões AUTORAIS + regras oficiais).");
out.push("-- Pré-requisitos: supabase/simulados.sql e supabase/simulado_timer.sql.");
out.push("");

let totalSim = 0;
let totalQ = 0;
for (const sim of simulados) {
  totalSim += 1;
  const subjects = Array.from(new Set(sim.questions.map((q) => q.subject)));
  const qCount = sim.questions.length;
  totalQ += qCount;

  // Atualiza metadados se o simulado já existe (regras/tempos podem mudar)
  out.push(`update public.simulados set
  description = '${esc(sim.description)}', vestibular = '${esc(sim.vestibular)}', faculty = '${esc(sim.faculty)}',
  duration_minutes = ${sim.durationMinutes}, official_minutes = ${sim.officialMinutes}, official_questions = ${sim.officialQuestions},
  difficulty = '${esc(sim.difficulty)}', subjects = ${arrLit(subjects)}, question_count = ${qCount}, rules = '${esc(sim.rules)}'
where title = '${esc(sim.title)}';`);

  const values = sim.questions
    .map(
      (q, i) =>
        `    (sid, '${esc(q.subject)}', '${esc(q.questionText)}', ${jsonbLit(q.alternatives)}, '${esc(q.correctAnswer)}', '${esc(q.explanation)}', '${esc(q.difficulty)}', ${i + 1})`,
    )
    .join(",\n");

  out.push(`do $$
declare sid uuid;
begin
  select id into sid from public.simulados where title = '${esc(sim.title)}';
  if sid is null then
    insert into public.simulados (title, description, vestibular, faculty, duration_minutes, official_minutes, official_questions, difficulty, subjects, question_count, rules, status)
    values ('${esc(sim.title)}', '${esc(sim.description)}', '${esc(sim.vestibular)}', '${esc(sim.faculty)}', ${sim.durationMinutes}, ${sim.officialMinutes}, ${sim.officialQuestions}, '${esc(sim.difficulty)}', ${arrLit(subjects)}, ${qCount}, '${esc(sim.rules)}', 'published')
    returning id into sid;

    insert into public.simulado_questions (simulado_id, subject, question_text, alternatives, correct_answer, explanation, difficulty, order_index) values
${values};
  end if;
end;
$$;`);
  out.push("");
}

out.push("select count(*) as simulados, (select count(*) from public.simulado_questions) as questoes from public.simulados;");
writeFileSync("supabase/seed_simulados.sql", out.join("\n"), "utf8");
console.log(`seed_simulados.sql gerado: ${totalSim} simulados, ${totalQ} questões.`);
