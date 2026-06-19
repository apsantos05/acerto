type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const sizeClasses: Record<NonNullable<ProfileAvatarProps["size"]>, string> = {
  sm: "h-9 w-9 text-sm rounded-lg",
  md: "h-14 w-14 text-lg rounded-2xl",
  lg: "h-24 w-24 text-3xl rounded-2xl",
  xl: "h-28 w-28 text-4xl rounded-3xl sm:h-32 sm:w-32",
};

export function ProfileAvatar({
  name,
  avatarUrl,
  size = "lg",
}: ProfileAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      <div
        className={`${sizeClass} shrink-0 bg-cover bg-center ring-4 ring-white`}
        style={{ backgroundImage: `url(${avatarUrl})` }}
        aria-label={`Foto de ${name}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center bg-slate-950 font-semibold text-cyan-300 ring-4 ring-white`}
    >
      {initials(name) || "?"}
    </div>
  );
}
