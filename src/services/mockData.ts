import { PersonalizationSettings } from '../types/myra';

export const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  personality: 'warm',
  tone: 'conversational',
  language: 'English',
  responseLength: 'balanced',
  speakingStyle: 'natural',
  customInstructions: "Respond as Myra, Dushyant's dedicated AI assistant. Be insightful, articulate, and welcoming.",
};

export const DUSHYANT_KNOWLEDGE = {
  name: 'Dushyant',
  role: 'AI Engineer & Full-Stack Architect',
  summary: `Dushyant is an AI Engineer and Full-Stack Systems Architect specializing in autonomous agent workflows, low-latency voice AI interfaces, and distributed web platforms. He crafts intelligent systems that blend high-speed cloud infrastructure with bespoke, intuitive user experiences.`,
  coreSkills: [
    'AI & Autonomous Systems: Multi-agent orchestration, LLM integration (Gemini, Claude, GPT), n8n workflow automation, RAG pipelines, voice agent architecture',
    'Frontend & Voice UX: Modern React, Next.js, TypeScript, Tailwind CSS, Web Audio API, Web Speech synthesis & real-time audio visualization',
    'Backend & Infrastructure: Node.js, Express, Python, FastAPI, PostgreSQL, Cloud Run, Docker, Redis, WebSocket servers',
    'Product Engineering: End-to-end architecture, developer experience, microservices design, privacy-first data handling',
  ],
  experience: [
    {
      period: '2023 – Present',
      role: 'Lead AI & Full-Stack Architect',
      focus: 'Autonomous Agents & Intelligent Platforms',
      description: 'Architecting enterprise-grade agentic pipelines and voice-first AI interfaces. Pioneered low-latency audio workflows, n8n-driven enterprise automations, and custom RAG implementations that reduce query resolution times by over 60%.',
    },
    {
      period: '2021 – 2023',
      role: 'Senior Full-Stack Engineer',
      focus: 'Scalable Web Architectures & Cloud Microservices',
      description: 'Spearheaded full-stack platform modernization, micro-frontend transitions, and high-throughput real-time event streaming systems for modern SaaS products.',
    },
    {
      period: '2019 – 2021',
      role: 'Software Engineer',
      focus: 'Frontend Engineering & API Systems',
      description: 'Built fluid interactive applications with responsive design systems, accessibility compliance, and robust RESTful / GraphQL backend endpoints.',
    },
  ],
  featuredProjects: [
    {
      title: 'Myra Voice & Multimodal Assistant',
      description: 'An ultra-minimalist, ambient voice assistant featuring real-time audio equalization, smooth state orchestration, and privacy-shielded information delivery.',
      stack: ['React', 'TypeScript', 'Web Audio API', 'n8n Automation Engine', 'Tailwind CSS'],
    },
    {
      title: 'Agentic Workflow Orchestrator',
      description: 'Autonomous multi-model routing engine integrating retrieval-augmented generation and webhook-triggered execution graphs.',
      stack: ['Python', 'FastAPI', 'LangChain', 'PostgreSQL', 'Docker'],
    },
    {
      title: 'Real-Time Audio Stream Processing Hub',
      description: 'Browser-native audio capture and bidirectional synthesis pipeline supporting natural turn-taking and emotion-adaptive voice responses.',
      stack: ['TypeScript', 'Web Speech API', 'AudioContext', 'Node.js'],
    },
  ],
  education: 'B.Tech in Computer Science & Engineering, focused on Distributed Systems and Machine Intelligence.',
};
