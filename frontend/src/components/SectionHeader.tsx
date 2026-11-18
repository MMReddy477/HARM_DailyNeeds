interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export default function SectionHeader({ eyebrow, title, subtitle, align = "left" }: SectionHeaderProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">{eyebrow}</p>
      ) : null}
      <h2 className="mt-1.5 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-2 text-base leading-relaxed text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
