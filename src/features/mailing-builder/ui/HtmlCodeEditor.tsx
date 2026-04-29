import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { autocompletion, type CompletionContext, type Completion } from "@codemirror/autocomplete";
import { ViewPlugin, Decoration, type DecorationSet, type ViewUpdate, EditorView } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { forwardRef } from "react";

// ─── AMPscript decoration overlay ────────────────────────────────────────────
// Highlights %%[...block...]%% and %%inline_var%% on top of the HTML editor.

const ampBlockMark  = Decoration.mark({ class: "cm-amp-block" });
const ampVarMark    = Decoration.mark({ class: "cm-amp-var" });
const ampFuncMark   = Decoration.mark({ class: "cm-amp-func" });

const BLOCK_RE  = /%%\[[\s\S]*?]%%/g;
const VAR_RE    = /%%(?!\[)[^%\s][^%]*%%/g;
const FUNC_RE   = /\b(AttributeValue|Lookup|LookupRows|IIf|Format|Now|DateAdd|DateDiff|Substring|Concat|Trim|Uppercase|Lowercase|Length|Replace|RegExMatch|HTTPGet|HTTPPost|SET|IF|THEN|ELSE|ELSEIF|ENDIF|FOR|NEXT|SCRIPT)\b/g;

function buildAmpDecorations(text: string, docOffset = 0): Array<{ from: number; to: number; deco: ReturnType<typeof Decoration.mark> }> {
  const result: Array<{ from: number; to: number; deco: ReturnType<typeof Decoration.mark> }> = [];
  let m: RegExpExecArray | null;

  BLOCK_RE.lastIndex = 0;
  while ((m = BLOCK_RE.exec(text)) !== null) {
    result.push({ from: docOffset + m.index, to: docOffset + m.index + m[0].length, deco: ampBlockMark });
  }

  VAR_RE.lastIndex = 0;
  while ((m = VAR_RE.exec(text)) !== null) {
    result.push({ from: docOffset + m.index, to: docOffset + m.index + m[0].length, deco: ampVarMark });
  }

  FUNC_RE.lastIndex = 0;
  while ((m = FUNC_RE.exec(text)) !== null) {
    result.push({ from: docOffset + m.index, to: docOffset + m.index + m[0].length, deco: ampFuncMark });
  }

  result.sort((a, b) => a.from - b.from);
  return result;
}

const ampscriptPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const { from, to } = view.viewport;
      const text = view.state.doc.sliceString(from, to);
      const marks = buildAmpDecorations(text, from);

      for (const { from: f, to: t, deco } of marks) {
        // Clamp to viewport
        if (f >= from && t <= to) builder.add(f, t, deco);
      }
      return builder.finish();
    }
  },
  { decorations: (v) => v.decorations },
);

// ─── SFMC autocomplete ────────────────────────────────────────────────────────

const SFMC_COMPLETIONS: Completion[] = [
  // Inline variables
  { label: "%%emailaddr%%",       type: "variable", detail: "Email del suscriptor" },
  { label: "%%_subscriberkey%%",  type: "variable", detail: "Subscriber Key" },
  { label: "%%firstname%%",       type: "variable", detail: "Nombre" },
  { label: "%%lastname%%",        type: "variable", detail: "Apellido" },
  { label: "%%fullname%%",        type: "variable", detail: "Nombre completo" },
  { label: "%%member_addr%%",     type: "variable", detail: "Dirección del miembro" },
  { label: "%%jobid%%",           type: "variable", detail: "ID del job de envío" },
  { label: "%%listid%%",          type: "variable", detail: "ID de la lista" },
  { label: "%%unsub_center_url%%",type: "variable", detail: "URL de baja de suscripción" },
  { label: "%%view_email_url%%",  type: "variable", detail: "URL ver en navegador" },
  // AMPscript functions
  { label: "AttributeValue(\"\")", type: "function", detail: "Obtiene atributo del suscriptor", boost: 10 },
  { label: "Lookup(\"DE\",\"return_col\",\"match_col\",\"match_val\")", type: "function", detail: "Busca en Data Extension" },
  { label: "LookupRows(\"DE\",\"match_col\",\"match_val\")", type: "function", detail: "Devuelve filas de DE" },
  { label: "IIf(condition,true_val,false_val)", type: "function", detail: "Condicional inline" },
  { label: "Format(@var,\"format\")", type: "function", detail: "Formatea número/fecha" },
  { label: "Now()",               type: "function", detail: "Fecha/hora actual" },
  { label: "DateAdd(@date,n,\"type\")", type: "function", detail: "Suma a una fecha (D/M/Y/H)" },
  { label: "DateDiff(@date1,@date2,\"type\")", type: "function", detail: "Diferencia entre fechas" },
  { label: "Substring(@str,start,len)", type: "function", detail: "Subcadena" },
  { label: "Concat(val1,val2)",   type: "function", detail: "Concatena valores" },
  { label: "Trim(@str)",          type: "function", detail: "Elimina espacios" },
  { label: "Uppercase(@str)",     type: "function", detail: "Mayúsculas" },
  { label: "Lowercase(@str)",     type: "function", detail: "Minúsculas" },
  { label: "HTTPGet(\"url\")",    type: "function", detail: "GET HTTP (SFMC server-side)" },
  // AMPscript blocks (snippets)
  {
    label: "%%[ SET ]%%",
    type: "keyword",
    detail: "Bloque SET de variable",
    apply: "%%[\nSET @var = AttributeValue(\"campo\")\n]%%",
  },
  {
    label: "%%[ IF / ELSE ]%%",
    type: "keyword",
    detail: "Bloque condicional AMPscript",
    apply: "%%[\nIF @var == \"valor\" THEN\n]%%\n\n%%[\nELSE\n]%%\n\n%%[\nENDIF\n]%%",
  },
  {
    label: "%%[ FOR loop ]%%",
    type: "keyword",
    detail: "Bucle AMPscript",
    apply: "%%[\nSET @rows = LookupRows(\"DE\",\"col\",\"val\")\nSET @count = RowCount(@rows)\nFOR @i = 1 TO @count DO\n  SET @row = Row(@rows, @i)\n  SET @field = Field(@row, \"campo\")\nNEXT @i\n]%%",
  },
];

function sfmcCompleter(context: CompletionContext) {
  const word = context.matchBefore(/%%[\w_]*/);
  if (!word && !context.explicit) return null;
  return {
    from: word ? word.from : context.pos,
    options: SFMC_COMPLETIONS,
    validFor: /%%[\w_]*/,
  };
}

// ─── Tema oscuro propio (VS Code Dark+) — control total sin oneDark ──────────

const vscodeDark = EditorView.theme({
  "&": { backgroundColor: "#1e1e1e", color: "#d4d4d4", height: "100%", fontSize: "14px" },
  ".cm-content": {
    caretColor: "#aeafad",
    color: "#d4d4d4",
    fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
    fontSize: "14px",
    lineHeight: "1.7",
    WebkitFontSmoothing: "antialiased",
    padding: "8px 0",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#aeafad", borderLeftWidth: "2px" },
  ".cm-selectionBackground": { backgroundColor: "#264f78 !important" },
  "&.cm-focused .cm-selectionBackground": { backgroundColor: "#264f78" },
  ".cm-gutters": {
    backgroundColor: "#1e1e1e",
    color: "#858585",
    border: "none",
    borderRight: "1px solid #3e3e42",
    fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
    fontSize: "13px",
  },
  ".cm-gutterElement": { padding: "0 10px !important" },
  ".cm-activeLine": { backgroundColor: "#2a2d2e" },
  ".cm-activeLineGutter": { backgroundColor: "#2a2d2e", color: "#c6c6c6" },
  ".cm-matchingBracket": { backgroundColor: "#0d3a58", outline: "1px solid #888" },
  ".cm-tooltip": { backgroundColor: "#252526", border: "1px solid #454545", color: "#d4d4d4" },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
    fontSize: "13px",
  },
  ".cm-completionLabel": { color: "#d4d4d4" },
  ".cm-completionDetail": { color: "#9d9d9d", fontStyle: "italic" },
  ".cm-completionMatchedText": { color: "#18a3ff", fontWeight: "bold", textDecoration: "none" },
  ".cm-scroller": { overflow: "auto" },
}, { dark: true });

// ─── Syntax highlighting — colores VS Code para HTML + AMPscript ──────────────

const htmlHighlight = HighlightStyle.define([
  { tag: t.angleBracket,          color: "#808080" },
  { tag: t.tagName,               color: "#4ec9b0", fontWeight: "bold" },
  { tag: t.attributeName,         color: "#9cdcfe" },
  { tag: t.attributeValue,        color: "#ce9178" },
  { tag: t.string,                color: "#ce9178" },
  { tag: t.processingInstruction, color: "#569cd6", fontWeight: "bold" },
  { tag: t.meta,                  color: "#569cd6" },
  { tag: t.comment,               color: "#6a9955", fontStyle: "italic" },
  { tag: t.propertyName,          color: "#9cdcfe" },
  { tag: t.number,                color: "#b5cea8" },
  { tag: t.keyword,               color: "#c586c0", fontWeight: "bold" },
  { tag: t.operator,              color: "#d4d4d4" },
  { tag: t.punctuation,           color: "#808080" },
  { tag: t.special(t.string),     color: "#569cd6", fontWeight: "bold" },
]);

// ─── AMPscript CSS injected once ─────────────────────────────────────────────

const AMP_STYLE_ID = "cm-ampscript-styles";
if (typeof document !== "undefined" && !document.getElementById(AMP_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = AMP_STYLE_ID;
  style.textContent = `
    .cm-amp-block { color: #569cd6 !important; font-weight: 700; }
    .cm-amp-var   { color: #9cdcfe !important; }
    .cm-amp-func  { color: #dcdcaa !important; font-style: italic; }
  `;
  document.head.appendChild(style);
}

// ─── Extensions (stable reference) ───────────────────────────────────────────

const EXTENSIONS = [
  html({ selfClosingTags: true, matchClosingTags: true }),
  vscodeDark,
  syntaxHighlighting(htmlHighlight),
  ampscriptPlugin,
  autocompletion({ override: [sfmcCompleter], defaultKeymap: true }),
];

// ─── HtmlCodeEditor ───────────────────────────────────────────────────────────

export interface HtmlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export const HtmlCodeEditor = forwardRef<ReactCodeMirrorRef, HtmlCodeEditorProps>(
  ({ value, onChange, readOnly = false }, ref) => {
    return (
      <CodeMirror
        ref={ref}
        value={value}
        height="100%"
        style={{ height: "100%" }}
        extensions={EXTENSIONS}
        readOnly={readOnly}
        onChange={onChange}
        aria-label="Editor HTML para Salesforce Marketing Cloud"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          autocompletion: false, // handled by our custom extension
          closeBrackets: true,
          searchKeymap: true,
          indentOnInput: true,
        }}
      />
    );
  },
);

HtmlCodeEditor.displayName = "HtmlCodeEditor";
