const styles = {
  active: "bg-ok-soft text-ok",
  draft: "bg-warn-soft text-warn",
  archived: "bg-black/5 text-ink/70",
} as const;

export function StatusBadge({ status }: { status: keyof typeof styles }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
