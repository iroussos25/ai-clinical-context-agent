import { Nunito } from "next/font/google";

type AegisLogoProps = {
  titleClassName?: string;
  subtitleClassName?: string;
  showSubtitle?: boolean;
};

const aegisFont = Nunito({
  subsets: ["latin"],
  weight: ["700", "800"],
});

export function AegisLogo({
  titleClassName = "text-3xl font-extrabold tracking-tight text-violet-700 dark:text-indigo-400 md:text-4xl",
  subtitleClassName = "text-sm text-zinc-500 dark:text-zinc-400",
  showSubtitle = true,
}: AegisLogoProps) {
  return (
    <div>
      <h1 className={`${aegisFont.className} ${titleClassName}`}>AEGIS</h1>
      {showSubtitle ? <p className={subtitleClassName}>AI Clinical Decision Support Agent</p> : null}
    </div>
  );
}
