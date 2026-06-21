"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseErrorMessage } from "@/lib/supabase-errors";
import { slugify } from "@/lib/slug";
import type { Plan } from "@/lib/plan";
import type { StudyTrack, TrackWeek } from "@/lib/tracks";

const PLAN_OPTIONS: { value: Plan; label: string }[] = [
  { value: "free", label: "Gratuito" },
  { value: "premium", label: "Premium" },
  { value: "premium_med", label: "Premium Medicina" },
];
const DIFFICULTIES = ["fácil", "médio", "difícil"];

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-sky-500/30";
const labelClass =
  "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

type TrackTaskRow = {
  id: string;
  subject: string | null;
  title: string | null;
  description: string | null;
  material_id: string | null;
  simulado_id: string | null;
  estimated_minutes: number | null;
  order_index: number | null;
};
type TrackWeekRow = {
  id: string;
  week_number: number;
  title: string | null;
  description: string | null;
  study_track_tasks: TrackTaskRow[] | null;
};

export function TrackAdminManager({ tracks }: { tracks: StudyTrack[] }) {
  const router = useRouter();
  const { supabase, user } = useAuth();

  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<TrackWeek[]>([]);
  const [loadingWeeks, setLoadingWeeks] = useState(false);

  function notify(text: string, ok = true) {
    setMessage({ text, ok });
  }

  function ensureClient() {
    if (!supabase || !user) {
      notify("Sessão expirada. Entre novamente.", false);
      return null;
    }
    return supabase;
  }

  // ---------- Criar trilha ----------
  async function createTrack(form: FormData) {
    const client = ensureClient();
    if (!client) return;
    setBusy(true);
    setMessage(null);
    try {
      const title = String(form.get("title") ?? "").trim();
      const slug =
        String(form.get("slug") ?? "").trim() || slugify(title);
      const payload = {
        slug,
        title,
        university: String(form.get("university") ?? "").trim(),
        vestibular: String(form.get("vestibular") ?? "").trim(),
        difficulty: String(form.get("difficulty") ?? "médio"),
        description: String(form.get("description") ?? "").trim(),
        plan_required: String(form.get("plan_required") ?? "premium"),
        priority_subjects: String(form.get("priority_subjects") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        is_premium: String(form.get("plan_required") ?? "premium") !== "free",
        status: "active",
      };
      if (!title) throw new Error("Informe o título da trilha.");
      const { error } = await client.from("study_tracks").insert(payload);
      if (error) throw error;
      notify("Trilha criada.");
      setShowNew(false);
      router.refresh();
    } catch (createError) {
      notify(getSupabaseErrorMessage(createError, "Falha ao criar trilha."), false);
    } finally {
      setBusy(false);
    }
  }

  // ---------- Editar trilha ----------
  async function updateTrack(id: string, form: FormData) {
    const client = ensureClient();
    if (!client) return;
    setBusy(true);
    setMessage(null);
    try {
      const patch = {
        title: String(form.get("title") ?? "").trim(),
        university: String(form.get("university") ?? "").trim(),
        vestibular: String(form.get("vestibular") ?? "").trim(),
        difficulty: String(form.get("difficulty") ?? "médio"),
        description: String(form.get("description") ?? "").trim(),
        plan_required: String(form.get("plan_required") ?? "premium"),
        priority_subjects: String(form.get("priority_subjects") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        is_premium: String(form.get("plan_required") ?? "premium") !== "free",
      };
      const { error } = await client.from("study_tracks").update(patch).eq("id", id);
      if (error) throw error;
      notify("Trilha atualizada.");
      setEditingId(null);
      router.refresh();
    } catch (updateError) {
      notify(getSupabaseErrorMessage(updateError, "Falha ao atualizar."), false);
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(track: StudyTrack) {
    const client = ensureClient();
    if (!client) return;
    setBusy(true);
    try {
      const next = track.status === "active" ? "inactive" : "active";
      const { error } = await client
        .from("study_tracks")
        .update({ status: next })
        .eq("id", track.id);
      if (error) throw error;
      notify(next === "active" ? "Trilha ativada." : "Trilha desativada.");
      router.refresh();
    } catch (statusError) {
      notify(getSupabaseErrorMessage(statusError, "Falha ao alterar status."), false);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTrack(track: StudyTrack) {
    const client = ensureClient();
    if (!client) return;
    if (!window.confirm(`Excluir a trilha "${track.title}" e todo o seu conteúdo?`)) return;
    setBusy(true);
    try {
      const { error } = await client.from("study_tracks").delete().eq("id", track.id);
      if (error) throw error;
      notify("Trilha excluída.");
      if (expandedId === track.id) setExpandedId(null);
      router.refresh();
    } catch (deleteError) {
      notify(getSupabaseErrorMessage(deleteError, "Falha ao excluir."), false);
    } finally {
      setBusy(false);
    }
  }

  // ---------- Semanas e tarefas ----------
  async function loadWeeks(trackId: string) {
    const client = supabase;
    if (!client) return;
    setLoadingWeeks(true);
    try {
      const { data, error } = await client
        .from("study_track_weeks")
        .select(
          "id,week_number,title,description,study_track_tasks(id,subject,title,description,material_id,simulado_id,estimated_minutes,order_index)",
        )
        .eq("track_id", trackId)
        .order("week_number", { ascending: true });
      if (error) throw error;
      const mapped: TrackWeek[] = ((data ?? []) as TrackWeekRow[]).map((w) => ({
        id: w.id,
        weekNumber: w.week_number,
        title: w.title ?? `Semana ${w.week_number}`,
        description: w.description ?? "",
        tasks: (w.study_track_tasks ?? [])
          .slice()
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((t) => ({
            id: t.id,
            subject: t.subject ?? "",
            title: t.title ?? "",
            description: t.description ?? "",
            materialId: t.material_id,
            simuladoId: t.simulado_id,
            estimatedMinutes: t.estimated_minutes ?? 60,
            orderIndex: t.order_index ?? 0,
            completed: false,
          })),
      }));
      setWeeks(mapped);
    } catch (loadError) {
      notify(getSupabaseErrorMessage(loadError, "Falha ao carregar semanas."), false);
      setWeeks([]);
    } finally {
      setLoadingWeeks(false);
    }
  }

  async function toggleExpand(trackId: string) {
    if (expandedId === trackId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(trackId);
    setEditingId(null);
    await loadWeeks(trackId);
  }

  async function addWeek(trackId: string, form: FormData) {
    const client = ensureClient();
    if (!client) return;
    setBusy(true);
    try {
      const payload = {
        track_id: trackId,
        week_number: Number(form.get("week_number")) || weeks.length + 1,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
      };
      const { error } = await client.from("study_track_weeks").insert(payload);
      if (error) throw error;
      notify("Semana adicionada.");
      await loadWeeks(trackId);
    } catch (weekError) {
      notify(getSupabaseErrorMessage(weekError, "Falha ao adicionar semana."), false);
    } finally {
      setBusy(false);
    }
  }

  async function deleteWeek(trackId: string, weekId: string) {
    const client = ensureClient();
    if (!client) return;
    if (!window.confirm("Excluir esta semana e suas tarefas?")) return;
    setBusy(true);
    try {
      const { error } = await client.from("study_track_weeks").delete().eq("id", weekId);
      if (error) throw error;
      await loadWeeks(trackId);
    } catch (weekError) {
      notify(getSupabaseErrorMessage(weekError, "Falha ao excluir semana."), false);
    } finally {
      setBusy(false);
    }
  }

  async function addTask(trackId: string, weekId: string, form: FormData) {
    const client = ensureClient();
    if (!client) return;
    setBusy(true);
    try {
      const payload = {
        week_id: weekId,
        subject: String(form.get("subject") ?? "").trim(),
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        material_id: String(form.get("material_id") ?? "").trim() || null,
        simulado_id: String(form.get("simulado_id") ?? "").trim() || null,
        estimated_minutes: Number(form.get("estimated_minutes")) || 60,
        order_index: Number(form.get("order_index")) || 0,
      };
      if (!payload.title) throw new Error("Informe o título da tarefa.");
      const { error } = await client.from("study_track_tasks").insert(payload);
      if (error) throw error;
      notify("Tarefa adicionada.");
      await loadWeeks(trackId);
    } catch (taskError) {
      notify(getSupabaseErrorMessage(taskError, "Falha ao adicionar tarefa."), false);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask(trackId: string, taskId: string) {
    const client = ensureClient();
    if (!client) return;
    setBusy(true);
    try {
      const { error } = await client.from("study_track_tasks").delete().eq("id", taskId);
      if (error) throw error;
      await loadWeeks(trackId);
    } catch (taskError) {
      notify(getSupabaseErrorMessage(taskError, "Falha ao excluir tarefa."), false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {tracks.length} trilha{tracks.length === 1 ? "" : "s"} cadastrada
          {tracks.length === 1 ? "" : "s"}.
        </p>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Plus size={16} />
          Nova trilha
        </button>
      </div>

      {message ? (
        <p
          className={`rounded-lg px-4 py-2 text-sm ${
            message.ok
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {showNew ? (
        <form
          action={createTrack}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
        >
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Nova trilha</h3>
          <TrackFields />
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <Save size={16} /> Criar
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                    {track.title}
                  </h3>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                    {track.planRequired}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      track.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {track.status === "active" ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {track.university} · {track.vestibular} · {track.difficulty} · /{track.slug}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(track.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {expandedId === track.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Semanas
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === track.id ? null : track.id)}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => toggleStatus(track)}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {track.status === "active" ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteTrack(track)}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {editingId === track.id ? (
              <form
                action={(form) => updateTrack(track.id, form)}
                className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <TrackFields track={track} />
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Save size={16} /> Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}

            {expandedId === track.id ? (
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                {loadingWeeks ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Carregando semanas...</p>
                ) : (
                  <WeeksManager
                    trackId={track.id}
                    weeks={weeks}
                    busy={busy}
                    onAddWeek={addWeek}
                    onDeleteWeek={deleteWeek}
                    onAddTask={addTask}
                    onDeleteTask={deleteTask}
                  />
                )}
              </div>
            ) : null}
          </div>
        ))}

        {tracks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Nenhuma trilha ainda. Rode <code>supabase/study_tracks.sql</code> ou clique em
            &quot;Nova trilha&quot;.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TrackFields({ track }: { track?: StudyTrack }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className={labelClass}>Título</span>
        <input name="title" defaultValue={track?.title ?? ""} className={inputClass} required />
      </label>
      {!track ? (
        <label>
          <span className={labelClass}>Slug (opcional)</span>
          <input name="slug" placeholder="auto a partir do título" className={inputClass} />
        </label>
      ) : null}
      <label>
        <span className={labelClass}>Universidade (= faculdade em materials)</span>
        <input name="university" defaultValue={track?.university ?? ""} className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Vestibular (= vestibular em materials)</span>
        <input name="vestibular" defaultValue={track?.vestibular ?? ""} className={inputClass} />
      </label>
      <label>
        <span className={labelClass}>Dificuldade</span>
        <select name="difficulty" defaultValue={track?.difficulty ?? "médio"} className={inputClass}>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={labelClass}>Plano exigido</span>
        <select
          name="plan_required"
          defaultValue={track?.planRequired ?? "premium"}
          className={inputClass}
        >
          {PLAN_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className={labelClass}>Matérias prioritárias (separadas por vírgula)</span>
        <input
          name="priority_subjects"
          defaultValue={track?.prioritySubjects.join(", ") ?? ""}
          className={inputClass}
        />
      </label>
      <label className="sm:col-span-2">
        <span className={labelClass}>Descrição / objetivo</span>
        <textarea
          name="description"
          defaultValue={track?.description ?? ""}
          rows={3}
          className={inputClass}
        />
      </label>
    </div>
  );
}

function WeeksManager({
  trackId,
  weeks,
  busy,
  onAddWeek,
  onDeleteWeek,
  onAddTask,
  onDeleteTask,
}: {
  trackId: string;
  weeks: TrackWeek[];
  busy: boolean;
  onAddWeek: (trackId: string, form: FormData) => void;
  onDeleteWeek: (trackId: string, weekId: string) => void;
  onAddTask: (trackId: string, weekId: string, form: FormData) => void;
  onDeleteTask: (trackId: string, taskId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {weeks.map((week) => (
        <div key={week.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Semana {week.weekNumber} — {week.title}
            </p>
            <button
              type="button"
              onClick={() => onDeleteWeek(trackId, week.id)}
              disabled={busy}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <ul className="mt-2 space-y-1">
            {week.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50"
              >
                <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">{task.subject}:</span> {task.title}
                  <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                    {task.estimatedMinutes}min
                    {task.materialId ? " · material" : ""}
                    {task.simuladoId ? " · simulado" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteTask(trackId, task.id)}
                  disabled={busy}
                  className="shrink-0 text-red-600 hover:text-red-700 disabled:opacity-60 dark:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>

          <form
            action={(form) => onAddTask(trackId, week.id, form)}
            className="mt-2 grid gap-2 sm:grid-cols-2"
          >
            <input name="subject" placeholder="Matéria" className={inputClass} />
            <input name="title" placeholder="Título da tarefa" className={inputClass} required />
            <input name="description" placeholder="Descrição" className={`${inputClass} sm:col-span-2`} />
            <input name="material_id" placeholder="material_id (opcional)" className={inputClass} />
            <input name="simulado_id" placeholder="simulado_id (opcional)" className={inputClass} />
            <input name="estimated_minutes" type="number" placeholder="min (60)" className={inputClass} />
            <input name="order_index" type="number" placeholder="ordem" className={inputClass} />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60 sm:col-span-2"
            >
              <Plus size={14} /> Adicionar tarefa
            </button>
          </form>
        </div>
      ))}

      <form
        action={(form) => onAddWeek(trackId, form)}
        className="grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700 sm:grid-cols-2"
      >
        <input name="week_number" type="number" placeholder="Nº da semana" className={inputClass} />
        <input name="title" placeholder="Título da semana" className={inputClass} />
        <input name="description" placeholder="Descrição" className={`${inputClass} sm:col-span-2`} />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:col-span-2"
        >
          <Plus size={14} /> Adicionar semana
        </button>
      </form>
    </div>
  );
}
