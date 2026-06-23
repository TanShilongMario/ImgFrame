import { Dice5, Download, Save } from "lucide-react";

type StageActionIconProps = {
  kind: "random" | "save" | "download";
};

const iconMap = {
  random: Dice5,
  save: Save,
  download: Download
};

export function StageActionIcon({ kind }: StageActionIconProps) {
  const Icon = iconMap[kind];

  return <Icon aria-hidden="true" className="stage-icon" size={17} strokeWidth={2.4} />;
}
