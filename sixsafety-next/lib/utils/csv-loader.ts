export interface NeighbourhoodCrime {
  neighbourhood: string;
  offenceGroup: string;
  safetyRisk: 'Low' | 'Medium' | 'High';
}

export interface NeighbourhoodStats {
  neighbourhood: string;
  crimes: Array<{
    type: string;
    risk: string;
  }>;
}

export async function loadNeighbourhoodData(): Promise<NeighbourhoodCrime[]> {
  const response = await fetch('/data/neighbourhood-crimes.csv');
  const csvText = await response.text();

  const lines = csvText.split('\n').slice(1); // Skip header
  const data: NeighbourhoodCrime[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const [neighbourhood, offenceGroup, safetyRisk] = line.split(',');
    data.push({
      neighbourhood: neighbourhood.trim(),
      offenceGroup: offenceGroup.trim(),
      safetyRisk: safetyRisk.trim() as 'Low' | 'Medium' | 'High'
    });
  }

  return data;
}

export function getNeighbourhoodList(data: NeighbourhoodCrime[]): string[] {
  const unique = new Set(data.map(item => item.neighbourhood));
  return Array.from(unique).sort();
}

export function getNeighbourhoodStats(
  neighbourhood: string,
  data: NeighbourhoodCrime[]
): NeighbourhoodStats {
  const crimes = data
    .filter(item => item.neighbourhood === neighbourhood)
    .map(item => ({
      type: item.offenceGroup,
      risk: item.safetyRisk
    }));

  return { neighbourhood, crimes };
}

export function formatNeighbourhoodString(stats: NeighbourhoodStats): string {
  const crimesStr = stats.crimes
    .map(c => `${c.type}: ${c.risk}`)
    .join(', ');

  return `Neighbourhood: ${stats.neighbourhood} - ${crimesStr}`;
}
