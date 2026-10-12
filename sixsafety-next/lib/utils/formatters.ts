interface Crime {
  type: string;
  risk: string;
}

/**
 * Formats crime risk information into natural language
 * Example: "In the Annex neighbourhood, you're facing high risks for Assault,
 * Break and Enter, and Robbery, with a lower risk for Auto Theft."
 */
export function formatCrimeRiskMessage(
  neighbourhood: string,
  crimes: Crime[]
): string {
  const highRisks = crimes.filter(c => c.risk === 'High').map(c => c.type);
  const mediumRisks = crimes.filter(c => c.risk === 'Medium').map(c => c.type);
  const lowRisks = crimes.filter(c => c.risk === 'Low').map(c => c.type);

  if (crimes.length === 0) {
    return `The ${neighbourhood} neighbourhood has no specific crime risk data available.`;
  }

  let message = `In the ${neighbourhood} neighbourhood, you're facing `;
  const parts: string[] = [];

  if (highRisks.length > 0) {
    parts.push(`high risks for ${formatList(highRisks)}`);
  }

  if (mediumRisks.length > 0) {
    parts.push(`medium risks for ${formatList(mediumRisks)}`);
  }

  if (lowRisks.length > 0) {
    const riskText = lowRisks.length > 1 ? 'lower risks' : 'a lower risk';
    parts.push(`${riskText} for ${formatList(lowRisks)}`);
  }

  // Join parts with proper grammar
  if (parts.length === 1) {
    message += parts[0];
  } else if (parts.length === 2) {
    message += `${parts[0]}, with ${parts[1]}`;
  } else {
    const last = parts.pop();
    message += `${parts.join(', ')}, with ${last}`;
  }

  message += '.';
  return message;
}

/**
 * Formats a list of items with proper grammar
 * Examples: "Item1", "Item1 and Item2", "Item1, Item2, and Item3"
 */
function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  const last = items[items.length - 1];
  const rest = items.slice(0, -1);
  return `${rest.join(', ')}, and ${last}`;
}

/**
 * Formats neighbourhood display with crime count
 * Example: "Agincourt North (129)"
 */
export function formatNeighbourhoodDisplay(
  neighbourhood: string,
  crimeCount: number
): string {
  return `${neighbourhood} (${crimeCount})`;
}
