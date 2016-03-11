export function nextYear() {
  return new Date(new Date().setFullYear(new Date().getFullYear() + 1))
}