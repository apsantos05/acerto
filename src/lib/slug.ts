/**
 * Gera um slug seguro (a-z, 0-9 e hifens) a partir de um nome livre.
 * Usado nos lookups de vestibulares/faculties, cujas tabelas exigem slug NOT NULL.
 */
export function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas combinantes)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // tudo que nao for [a-z0-9] vira hifen
    .replace(/^-+|-+$/g, ""); // remove hifens das pontas

  return slug || "item";
}
