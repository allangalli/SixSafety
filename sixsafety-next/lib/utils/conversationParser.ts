import type { SurveyResponse } from "@/lib/schemas/ui-schema";

/**
 * Extract section title from AI response
 * Looks for pattern: [SECTION: Title]
 */
export function extractSectionTitle(content: string): string | null {
  const match = content.match(/\[SECTION:\s*(.+?)\]/);
  return match ? match[1].trim() : null;
}

/**
 * Remove section marker from content
 */
export function removeSectionMarker(content: string): string {
  return content.replace(/\[SECTION:\s*.+?\]\n*/g, '');
}

/**
 * Remove UI instruction lines from AI-generated content
 * These instructions are for schema generation only, not for user display
 * Filters: bullets with UI keywords, sentences starting with UI verbs, duplicate sections
 */
export function removeUIInstructions(content: string): string {
  // First, detect and remove duplicate "Given..." sections
  // The AI sometimes generates multiple attempts at the same question set
  const givenPattern = /Given (your|the|you)/gi;
  const matches = [...content.matchAll(givenPattern)];

  if (matches.length > 1) {
    // Keep only content up to the second "Given" occurrence
    // Truncate right before the second "Given" starts
    const secondGivenPosition = matches[1].index;
    if (secondGivenPosition !== undefined) {
      // Remove everything from the second "Given" onward
      content = content.substring(0, secondGivenPosition).trim();
    }
  }

  // Split into lines
  const lines = content.split('\n');

  // UI instruction keywords
  const uiKeywords = [
    'checkbox',
    'radio',
    'dropdown',
    'slider',
    'button',
    'input',
    'field',
    'text area',
    'form',
    'ui element',
    'widget',
  ];

  // UI instruction verbs (sentence starters)
  const uiVerbs = [
    'show',
    'present',
    'display',
    'render',
    'provide',
    'include',
    'add',
    'use a',
    'use an',
    'create',
    'make',
    'offer',
  ];

  // Filter out lines that are UI instructions
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true; // Keep empty lines

    const lowerLine = trimmed.toLowerCase();

    // Check if line is a bullet (•, -, or numbered like "1.", "2.")
    const isBullet = /^[•\-]/.test(trimmed) || /^\d+\./.test(trimmed);

    // Check if line starts with a UI instruction verb
    const startsWithUIVerb = uiVerbs.some(verb =>
      lowerLine.startsWith(verb + ' ') || lowerLine.startsWith(verb + ':')
    );

    // Check if line contains UI component keywords
    const hasUIKeyword = uiKeywords.some(keyword => lowerLine.includes(keyword));

    // Filter out if:
    // 1. It's a bullet with UI keywords, OR
    // 2. It starts with a UI verb (like "Present...", "Show...", etc.)
    if ((isBullet && hasUIKeyword) || startsWithUIVerb) {
      return false;
    }

    return true;
  });

  return cleanedLines.join('\n').trim();
}

/**
 * Check if content has section marker
 */
export function hasSectionMarker(content: string): boolean {
  return /\[SECTION:\s*.+?\]/.test(content);
}

/**
 * Format survey response for display in echo box
 * Format: "Question: Answer; Question2: Answer2;"
 */
export function formatResponseForDisplay(
  response: SurveyResponse,
  labels?: string[]
): string {
  return Object.entries(response)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `'${v}'`).join(', ')}]`;
      }
      return `${key}: ${value}`;
    })
    .join('; ') + ';';
}

/**
 * Format survey response for API conversation
 */
export function formatResponseForAPI(response: SurveyResponse): string {
  return Object.entries(response)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }
      return `${key}: ${value}`;
    })
    .join("; ");
}

/**
 * Generate summary from multiple responses
 * Simple template-based for now - could be AI-generated later
 */
export function generateSummary(responses: SurveyResponse[]): string {
  if (responses.length === 0) {
    return "";
  }

  const parts: string[] = [];

  // Extract key information from responses
  responses.forEach(response => {
    Object.entries(response).forEach(([key, value]) => {
      if (key.toLowerCase().includes('security monitoring')) {
        parts.push(`prefer ${value} security monitoring`);
      } else if (key.toLowerCase().includes('crime types')) {
        const crimes = Array.isArray(value) ? value.join(' and ') : value;
        parts.push(`are concerned about ${crimes}`);
      } else if (key.toLowerCase().includes('neighborhood watch')) {
        if (value === true || value === 'Yes' || value === 'True') {
          parts.push('are interested in participating in a neighborhood watch');
        }
      }
    });
  });

  if (parts.length === 0) {
    return "Your preferences have been recorded.";
  }

  return "You " + parts.join(', ') + ".";
}

/**
 * Extract question labels from UI schema for echo formatting
 */
export function extractQuestionLabels(schema: any): string[] {
  if (!schema || !schema.ui_elements) {
    return [];
  }

  return schema.ui_elements.map((element: any) => element.label || '');
}
