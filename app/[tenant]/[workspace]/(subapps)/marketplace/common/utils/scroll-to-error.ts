/**
 * react-hook-form's `shouldFocusError` only focuses registered inputs that
 * expose a ref (plain `<input {...register()} />`). Our forms mostly use
 * custom controls (Select, RichTextEditor, tag/icon button groups) which
 * never get focused, so a failed submit silently does nothing.
 *
 * shadcn's `FormControl` marks the offending control with
 * `aria-invalid="true"`, so after validation fails we scroll the first such
 * element into view (and focus it when it can take focus). Pass the form's
 * scroll container so we only look inside the current form.
 */
export function scrollToFirstError(container?: HTMLElement | null) {
  // Defer to the next frame so RHF has painted the `aria-invalid` flags.
  requestAnimationFrame(() => {
    const root: ParentNode = container ?? document;
    const el = root.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!el) return;
    el.scrollIntoView({behavior: 'smooth', block: 'center'});
    el.focus?.({preventScroll: true});
  });
}
