export function Part({ part }: { part: { type: string } }) {
  switch (part.type) {
    case "text": return <p data-slot="part-text" />
    case "reasoning": return <details data-slot="part-reasoning" />
    case "source-url":
    case "source-document": return <a data-slot="part-source" />
    case "file": return <figure data-slot="part-file" />
    case "step-start": return <hr data-slot="part-step" />
    case "dynamic-tool": return <section data-slot="part-tool" />
    default:
      if (part.type.startsWith("tool-")) return <section data-slot="part-tool" />
      if (part.type.startsWith("data-")) return <pre data-slot="part-data" />
      return null
  }
}
