/**
 * JSON.stringify does not escape `<`, so a `</script>` inside any
 * user/admin-editable string embedded in JSON-LD could break out of the
 * script tag it's rendered in. Escaping it to < (a valid JSON string
 * escape, semantically identical once parsed) closes that off. Currently
 * all JSON-LD call sites use static content, but this is cheap defense
 * before something editable (e.g. a Product description) feeds one.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
