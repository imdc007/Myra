export type AppMode = 'voice' | 'chat';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface AssistantState {
  emotion?: string;
  tone?: string;
  visual_state?: VoiceState;
  speaking_style?: string;
}

export interface VerificationRequirement {
  name_required?: boolean;
  purpose_required?: boolean;
  context_required?: boolean;
  phone_optional?: boolean;
  email_optional?: boolean;
}

export interface VerificationData {
  name: string;
  purpose: string;
  context: string;
  phone?: string;
  email?: string;
}

export interface PersonalizationSettings {
  personality: 'warm' | 'professional' | 'visionary' | 'concise';
  tone: 'conversational' | 'formal' | 'technical' | 'casual';
  language: string;
  responseLength: 'concise' | 'balanced' | 'comprehensive';
  speakingStyle: 'natural' | 'calm' | 'energetic';
  customInstructions: string;
}

export interface MyraRequest {
  session_id: string;
  input_mode: 'voice' | 'chat';
  input: string;
  audio?: string;
  conversation_context?: string;
  personalization?: PersonalizationSettings;
}

export interface MyraResponse {
  success: boolean;
  session_id: string;
  input_mode: 'voice' | 'chat';
  response_mode: 'voice' | 'chat';
  response_text: string;
  audio?: {
    available: boolean;
    url?: string;
  };
  sources?: string[];
  assistant_state?: AssistantState;
  requires_requester_info?: boolean;
  verification?: VerificationRequirement;
  error?: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'myra';
  text: string;
  timestamp: Date;
  mode: 'voice' | 'chat';
  audioUrl?: string;
  sources?: string[];
  requiresVerification?: boolean;
  verificationRequirements?: VerificationRequirement;
  verificationSubmitted?: boolean;
  pendingQuery?: string;
}

export interface N8nChatRequest {
  session_id: string;
  input_mode: string;
  text: string;
  raw_text: string;
  voice_id?: string;
  tts_model?: string;
}

export interface N8nChatResponse {
  success: boolean;
  session_id?: string;
  input_mode?: string;
  response_text: string;
  output_mode?: string;
  source?: string;
  assistant_state?: AssistantState;
  error?: any;
}

