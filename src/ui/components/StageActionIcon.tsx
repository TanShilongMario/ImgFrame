import { Dice5, Download, Save, Upload } from "lucide-react";

type StageActionIconProps = {
  kind: "upload" | "random" | "save" | "download";
};

const iconMap = {
  upload: Upload,
  random: Dice5,
  save: Save,
  download: Download
};

export function StageActionIcon({ kind }: StageActionIconProps) {
  const Icon = iconMap[kind];

  return <Icon aria-hidden="true" className="stage-icon" size={17} strokeWidth={2.4} />;
}
