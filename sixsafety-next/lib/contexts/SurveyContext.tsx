"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import type { Message } from "@/lib/actions";
import type { UISchemaType, SurveyResponse } from "@/lib/schemas/ui-schema";
import type { NeighbourhoodStats } from "@/lib/utils/csv-loader";

// Conversation message types for UI rendering
export interface ConversationMessage {
  id: string;
  type: 'assistant' | 'user-response' | 'section-header' | 'summary';
  content: string | SurveyResponse;
  timestamp: Date;
  metadata?: {
    sectionTitle?: string;
    questionLabels?: string[];
  };
}

// Active question state
export interface ActiveQuestion {
  schema: UISchemaType;
  sectionTitle?: string;
  questionNumber: number;
}

// Main survey state
export interface SurveyState {
  // Core data
  neighbourhood: NeighbourhoodStats | null;

  // UI-renderable conversation
  conversationMessages: ConversationMessage[];

  // Current active question (separate from history)
  activeQuestion: ActiveQuestion | null;

  // Real-time summary
  currentSummary: string | null;

  // API conversation (for generateConversation calls)
  apiHistory: Message[];

  // Collected responses
  responses: SurveyResponse[];

  // State flags
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  exchangeCount: number;
}

// Action types
type SurveyAction =
  | { type: 'SET_NEIGHBOURHOOD'; payload: NeighbourhoodStats }
  | { type: 'ADD_CONVERSATION_MESSAGE'; payload: ConversationMessage }
  | { type: 'ADD_SECTION_HEADER'; payload: string }
  | { type: 'ADD_USER_RESPONSE_ECHO'; payload: { response: SurveyResponse; labels: string[] } }
  | { type: 'SET_ACTIVE_QUESTION'; payload: ActiveQuestion | null }
  | { type: 'UPDATE_SUMMARY'; payload: string }
  | { type: 'ADD_API_MESSAGE'; payload: Message }
  | { type: 'ADD_RESPONSE'; payload: SurveyResponse }
  | { type: 'INCREMENT_EXCHANGE' }
  | { type: 'MARK_COMPLETE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// Initial state
const initialState: SurveyState = {
  neighbourhood: null,
  conversationMessages: [],
  activeQuestion: null,
  currentSummary: null,
  apiHistory: [],
  responses: [],
  isComplete: false,
  isLoading: false,
  error: null,
  exchangeCount: 0,
};

// Generate unique IDs for messages
let messageIdCounter = 0;
function generateMessageId(type: string): string {
  messageIdCounter++;
  return `${type}-${Date.now()}-${messageIdCounter}`;
}

// Reducer
function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'SET_NEIGHBOURHOOD':
      return { ...state, neighbourhood: action.payload };

    case 'ADD_CONVERSATION_MESSAGE':
      return {
        ...state,
        conversationMessages: [...state.conversationMessages, action.payload]
      };

    case 'ADD_SECTION_HEADER':
      return {
        ...state,
        conversationMessages: [
          ...state.conversationMessages,
          {
            id: generateMessageId('section'),
            type: 'section-header',
            content: action.payload,
            timestamp: new Date(),
          }
        ]
      };

    case 'ADD_USER_RESPONSE_ECHO':
      return {
        ...state,
        conversationMessages: [
          ...state.conversationMessages,
          {
            id: generateMessageId('echo'),
            type: 'user-response',
            content: action.payload.response,
            timestamp: new Date(),
            metadata: { questionLabels: action.payload.labels }
          }
        ]
      };

    case 'SET_ACTIVE_QUESTION':
      return { ...state, activeQuestion: action.payload };

    case 'UPDATE_SUMMARY':
      return { ...state, currentSummary: action.payload };

    case 'ADD_API_MESSAGE':
      return {
        ...state,
        apiHistory: [...state.apiHistory, action.payload]
      };

    case 'ADD_RESPONSE':
      return {
        ...state,
        responses: [...state.responses, action.payload]
      };

    case 'INCREMENT_EXCHANGE':
      return { ...state, exchangeCount: state.exchangeCount + 1 };

    case 'MARK_COMPLETE':
      return { ...state, isComplete: true };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context type
export interface SurveyContextType {
  state: SurveyState;
  setNeighbourhood: (neighbourhood: NeighbourhoodStats) => void;
  addConversationMessage: (message: ConversationMessage) => void;
  addSectionHeader: (title: string) => void;
  addUserResponseEcho: (response: SurveyResponse, labels: string[]) => void;
  setActiveQuestion: (question: ActiveQuestion | null) => void;
  updateSummary: (summary: string) => void;
  addApiMessage: (message: Message) => void;
  addResponse: (response: SurveyResponse) => void;
  incrementExchange: () => void;
  markComplete: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(surveyReducer, initialState);

  const contextValue: SurveyContextType = {
    state,
    setNeighbourhood: (neighbourhood) =>
      dispatch({ type: 'SET_NEIGHBOURHOOD', payload: neighbourhood }),
    addConversationMessage: (message) =>
      dispatch({ type: 'ADD_CONVERSATION_MESSAGE', payload: message }),
    addSectionHeader: (title) =>
      dispatch({ type: 'ADD_SECTION_HEADER', payload: title }),
    addUserResponseEcho: (response, labels) =>
      dispatch({ type: 'ADD_USER_RESPONSE_ECHO', payload: { response, labels } }),
    setActiveQuestion: (question) =>
      dispatch({ type: 'SET_ACTIVE_QUESTION', payload: question }),
    updateSummary: (summary) =>
      dispatch({ type: 'UPDATE_SUMMARY', payload: summary }),
    addApiMessage: (message) =>
      dispatch({ type: 'ADD_API_MESSAGE', payload: message }),
    addResponse: (response) =>
      dispatch({ type: 'ADD_RESPONSE', payload: response }),
    incrementExchange: () =>
      dispatch({ type: 'INCREMENT_EXCHANGE' }),
    markComplete: () =>
      dispatch({ type: 'MARK_COMPLETE' }),
    setLoading: (loading) =>
      dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) =>
      dispatch({ type: 'SET_ERROR', payload: error }),
    reset: () =>
      dispatch({ type: 'RESET' }),
  };

  return (
    <SurveyContext.Provider value={contextValue}>
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error("useSurvey must be used within a SurveyProvider");
  }
  return context;
}
