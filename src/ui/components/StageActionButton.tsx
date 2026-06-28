import { StageActionIcon } from "./StageActionIcon";

type StageActionButtonProps =
  | {
      kind: "upload";
      label: string;
      title?: string;
      disabled?: boolean;
      className?: string;
      accept?: string;
      onUpload: (file?: File) => void;
    }
  | {
      kind: "random" | "save" | "download";
      label: string;
      title?: string;
      disabled?: boolean;
      className?: string;
      onClick: () => void;
    };

export function StageActionButton(props: StageActionButtonProps) {
  const className = `stage-action${props.className ? ` ${props.className}` : ""}`;

  if (props.kind === "upload") {
    return (
      <label
        aria-disabled={props.disabled}
        className={`${className}${props.disabled ? " is-disabled" : ""}`}
        title={props.title}
      >
        <input
          accept={props.accept ?? "image/*,video/*"}
          className="stage-action-input"
          disabled={props.disabled}
          type="file"
          onChange={(event) => props.onUpload(event.target.files?.[0])}
        />
        <StageActionIcon kind="upload" />
        <span>{props.label}</span>
      </label>
    );
  }

  return (
    <button
      aria-label={props.title ?? props.label}
      className={className}
      disabled={props.disabled}
      title={props.title}
      type="button"
      onClick={props.onClick}
    >
      <StageActionIcon kind={props.kind} />
      <span>{props.label}</span>
    </button>
  );
}
