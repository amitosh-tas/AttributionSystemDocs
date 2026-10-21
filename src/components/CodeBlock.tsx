import { useEffect, useMemo, useRef, useState } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import { copyToClipboard } from "../lib/copyToClipboard";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
// JSX inside the JavaScript grammar is highlighted through the XML grammar.
hljs.registerLanguage("xml", xml);

export type CodeLanguage = "bash" | "tsx" | "js" | "html" | "json";

const HLJS_LANGUAGE: Record<CodeLanguage, string> = {
  bash: "bash",
  tsx: "javascript",
  js: "javascript",
  html: "xml",
  json: "javascript",
};

type CopyState = "idle" | "copied" | "failed";

interface CodeBlockProps {
  code: string;
  language: CodeLanguage;
  /** Optional caption shown before the language label, e.g. "pnpm". */
  title?: string;
  /** Set to false for placeholder snippets that should not be copied. */
  copyable?: boolean;
  /** Override the highlighting grammar (e.g. markup-only JSX snippets). */
  highlightAs?: "javascript" | "xml";
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="7" y="7" width="9" height="9" rx="2" />
      <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

export function CodeBlock({
  code,
  language,
  title,
  copyable = true,
  highlightAs,
}: CodeBlockProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const html = useMemo(
    () =>
      hljs.highlight(code, {
        language: highlightAs ?? HLJS_LANGUAGE[language],
        ignoreIllegals: true,
      }).value,
    [code, language, highlightAs],
  );

  async function handleCopy() {
    const succeeded = await copyToClipboard(code);
    setCopyState(succeeded ? "copied" : "failed");
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), 2000);
  }

  const buttonLabel =
    copyState === "copied" ? "Copied" : copyState === "failed" ? "Failed" : "Copy";

  return (
    <figure className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
      <figcaption className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-3 py-1.5">
        <span className="flex items-center gap-2 text-xs">
          {title ? (
            <span className="font-medium text-neutral-800">{title}</span>
          ) : null}
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-neutral-600">
            {language}
          </span>
        </span>
        {copyable ? (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${title ? `${title} ` : ""}${language} code to clipboard`}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-neutral-600 transition hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
          >
            {copyState === "copied" ? <CheckIcon /> : <CopyIcon />}
            <span>{buttonLabel}</span>
          </button>
        ) : null}
      </figcaption>
      <pre
        tabIndex={0}
        aria-label={`${title ? `${title} ` : ""}${language} code`}
        className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-6"
      >
        <code
          className={`hljs language-${language}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
      <span className="sr-only" role="status" aria-live="polite">
        {copyState === "copied"
          ? "Code copied to clipboard"
          : copyState === "failed"
            ? "Copy failed. Select the code and copy it manually."
            : ""}
      </span>
    </figure>
  );
}
