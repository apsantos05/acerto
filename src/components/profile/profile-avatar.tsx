type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "md" | "lg";
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileAvatar({
  name,
  avatarUrl,
  size = "lg",
}: ProfileAvatarProps) {
  const sizeClass = size === "lg" ? "h-24 w-24 text-3xl" : "h-14 w-14 text-lg";

  if (avatarUrl) {
    return (
      <div
        className={`${sizeClass} shrink-0 rounded-2xl bg-cover bg-center ring-4 ring-white`}
        style={{ backgroundImage: `url(${avatarUrl})` }}
        aria-label={`Foto de ${name}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-2xl bg-slate-950 font-semibold text-cyan-300 ring-4 ring-white`}
    >
      {initials(name)}
    </div>
  );
}
