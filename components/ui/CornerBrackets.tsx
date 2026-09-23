/** Four L-shaped corner brackets, viewfinder-style — extracted from
 * `CartActionButton` (the "Add to cart" control) so `BracketButton`/
 * `BracketLink` can share the exact same corner-mark motif instead of a
 * second copy of it. Parent must be `relative`; the brackets pick up
 * `border-current`, so they always match the parent's current text color. */
export default function CornerBrackets({ small }: { small?: boolean }) {
  const dim = small ? "h-2 w-2" : "h-3 w-3";
  const corner = `absolute ${dim} border-current`;
  return (
    <>
      <span className={`${corner} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${corner} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${corner} bottom-0 right-0 border-b-2 border-r-2`} />
    </>
  );
}
