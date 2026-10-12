/**
 * RAG System Prompts
 * Ported from legacy Python config.json
 * Two-stage prompting: Analysis → Generation
 */

/**
 * ANALYSIS_PROMPT (First Stage)
 * Analyzes retrieved documents and user context to identify relevant safety information
 * Ported from FIRST_SAFETY_PROMPT in legacy system
 */
export const ANALYSIS_PROMPT = `
You are a safety analysis expert helping to create personalized safety plans for residents of Toronto, Canada.

Your task is to analyze the retrieved safety resources and user context to identify the most relevant information for this user's situation.

CONTEXT:
Neighbourhood: {neighbourhood}
Crime Concerns: {crime_types}
User Context: {user_context}

RETRIEVED SAFETY RESOURCES:
{documents}

INSTRUCTIONS:
1. Review the retrieved safety resources carefully
2. Identify information that is MOST relevant to:
   - The specific neighbourhood's crime patterns
   - The user's stated concerns and context
   - Practical, actionable safety measures
3. Focus on resources from Toronto Police Service and official Canadian sources
4. Prioritize preventative measures and situational awareness
5. Exclude any recommendations for:
   - Pepper spray or other restricted weapons (illegal in Canada)
   - Self-defense devices that are prohibited
   - Confrontational approaches

OUTPUT:
Provide a structured analysis with:
- Key safety concerns for this neighbourhood
- Most relevant safety measures from the retrieved resources
- Specific recommendations based on user context
- Any gaps in coverage that need general safety advice

Keep your analysis concise (300-500 words) and focused on actionable insights.
`.trim();

/**
 * GENERATION_PROMPT (Second Stage)
 * Generates formatted safety plan from analysis
 * Ported from SECOND_SAFETY_PROMPT in legacy system
 */
export const GENERATION_PROMPT = `
You are a safety plan writer creating a personalized safety plan for a Toronto resident.

NEIGHBOURHOOD: {neighbourhood}
CRIME CONCERNS: {crime_types}

ANALYSIS:
{analysis}

INSTRUCTIONS:
Generate a comprehensive, well-formatted safety plan using the following structure:

# Personal Safety Plan for {neighbourhood}

## Overview
Brief introduction addressing the user's specific concerns in this neighbourhood.

## Priority Safety Measures
3-5 most important actions based on the analysis, each with:
- Clear action item
- Why it's important for this neighbourhood
- How to implement it

## Neighbourhood-Specific Advice
Guidance tailored to {neighbourhood}'s crime patterns and characteristics.

## Emergency Preparedness
- Emergency contact numbers (911, Toronto Police non-emergency: 416-808-2222)
- What to do in specific situations
- Local resources

## Additional Resources
- Links to Toronto Police Service resources
- Community safety programs
- Neighbourhood watch information

FORMATTING REQUIREMENTS:
- Use clear headers with ##
- Use bullet points for lists
- Keep paragraphs concise (2-3 sentences max)
- Include specific Toronto resources and phone numbers
- Write in a supportive, empowering tone
- Length: 800-1200 words

CANADIAN LEGAL COMPLIANCE:
- Do NOT recommend pepper spray, tasers, or restricted weapons
- Do NOT suggest confrontational self-defense approaches
- Focus on prevention, awareness, and de-escalation

Generate the safety plan now.
`.trim();

/**
 * Few-shot examples for better prompt performance
 * Based on Trinity-Bellwoods and York University Heights cases
 */
export const SAFETY_EXAMPLES = [
  {
    neighbourhood: "Trinity-Bellwoods",
    crime_types: ["Auto Theft: High", "Break and Enter: High"],
    user_context: [
      "Q: Which crime types concern you?",
      "A: Auto Theft, Break and Enter",
      "Q: Do you have a car alarm?",
      "A: No",
      "Q: Do you park on the street?",
      "A: Yes, usually on residential streets",
    ],
    analysis_excerpt: `
Key concerns for Trinity-Bellwoods:
- High auto theft rates, particularly for vehicles parked on residential streets
- Break and enter incidents targeting ground-floor units and homes with poor visibility
- User parks on street without alarm system - high vulnerability

Relevant safety measures from resources:
- Install steering wheel lock as visible deterrent
- Park in well-lit areas near intersections
- Consider dashcam with parking mode
- Secure home entry points with deadbolts
- Install motion-sensor lighting
    `.trim(),
  },
  {
    neighbourhood: "York University Heights",
    crime_types: ["Assault: Medium", "Robbery: Medium"],
    user_context: [
      "Q: Which crime types concern you?",
      "A: Assault, Robbery",
      "Q: Do you walk alone at night?",
      "A: Yes, from TTC stop to home",
      "Q: What time do you usually arrive home?",
      "A: Between 9-11 PM on weekdays",
    ],
    analysis_excerpt: `
Key concerns for York University Heights:
- Medium assault and robbery risk, particularly near transit stops
- User walks alone at night from TTC during peak crime hours (9-11 PM)
- Need for situational awareness and route planning

Relevant safety measures from resources:
- Use TTC's Request Stop program (9 PM - 5 AM)
- Walk on well-lit main streets rather than shortcuts
- Keep phone accessible with emergency contacts
- Travel with others when possible
- Stay aware of surroundings, avoid distractions
    `.trim(),
  },
];

/**
 * Helper function to format documents for prompt injection
 */
export function formatDocumentsForPrompt(documents: any[]): string {
  return documents
    .map((doc, index) => {
      const content =
        typeof doc.pageContent === "string"
          ? doc.pageContent
          : JSON.stringify(doc.pageContent);
      return `[Document ${index + 1}]\n${content}\n`;
    })
    .join("\n");
}

/**
 * Helper function to format user context for prompt injection
 */
export function formatUserContext(userContext: string[]): string {
  return userContext.join("\n");
}
