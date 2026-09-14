export default function probe() {
  throw new Error("deliberate: proves a crashing probe becomes exit 2, never a silent pass")
}
