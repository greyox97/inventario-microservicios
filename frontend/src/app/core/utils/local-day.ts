/** Start of a local calendar day ("yyyy-MM-dd") as a UTC ISO instant. */
export function startOfLocalDay(date: string, plusDays = 0): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day + plusDays).toISOString();
}
