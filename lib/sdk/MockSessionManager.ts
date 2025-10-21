// Copyright (c) 2025 Fabstir
// SPDX-License-Identifier: BUSL-1.1

/**
 * Mock Session Manager for UI Development and Pre-Production Testing
 *
 * This class provides a drop-in replacement for the real SessionManager
 * that returns hardcoded AI responses without connecting to actual GPU nodes.
 *
 * Use Cases:
 * - UI deployment before infrastructure is ready
 * - Frontend testing without backend dependency
 * - Demo mode for presentations
 * - Graceful degradation if all nodes are down
 *
 * Usage:
 *   const sessionManager = process.env.NEXT_PUBLIC_SDK_MODE === 'mock'
 *     ? new MockSessionManager()
 *     : await sdk.getSessionManager();
 */

import { EventEmitter } from 'events';

export interface MockResponse {
  prompt: string;
  response: string;
}

export class MockSessionManager extends EventEmitter {
  private activeSessions: Map<string, any> = new Map();
  private responseDelay: number = 50; // ms between chunks (simulate streaming)

  /**
   * Hardcoded mock responses for common prompts
   */
  private mockResponses: MockResponse[] = [
    {
      prompt: 'hello',
      response: 'Hello! I\'m a mock AI assistant. This is a demonstration response while the real infrastructure is being set up. How can I help you today?',
    },
    {
      prompt: 'what is your name',
      response: 'I\'m Fabstir AI, currently running in demo mode. The real AI nodes are being prepared and will be available soon!',
    },
    {
      prompt: 'tell me a joke',
      response: 'Why did the AI go to therapy? Because it had too many layers of emotional baggage! 😄 (This is a mock response - real AI coming soon!)',
    },
    {
      prompt: 'explain quantum computing',
      response: 'Quantum computing is a revolutionary technology that uses quantum mechanical phenomena like superposition and entanglement to process information. Unlike classical computers that use bits (0 or 1), quantum computers use qubits that can be in multiple states simultaneously.\n\n[Note: This is a demo response. Real AI inference will provide more detailed and dynamic answers.]',
    },
  ];

  /**
   * Default response for prompts not in the mock database
   */
  private defaultResponse = `Thank you for your question! This is currently a demonstration version of Fabstir AI.

The real decentralized AI infrastructure is being deployed and will provide:
- Dynamic AI responses from GPU nodes
- Lower latency through distributed computing
- Verifiable computation via STARK proofs
- Tokenized payments for inference

Stay tuned for the production launch!`;

  constructor() {
    super();
    console.log('🎭 MockSessionManager initialized (SDK running in mock mode)');
  }

  /**
   * Start a mock session
   * Simulates the real startSession API but doesn't connect to any node
   */
  async startSession(params: {
    hostUrl: string;
    jobId: bigint;
    modelName: string;
    chainId: number;
    encryption?: boolean;
  }): Promise<{ sessionId: string }> {
    const sessionId = `mock-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.activeSessions.set(sessionId, {
      ...params,
      status: 'active',
      createdAt: new Date(),
      messageCount: 0,
    });

    console.log(`🎭 Mock session started: ${sessionId}`);
    console.log('   (No real GPU node connection - using hardcoded responses)');

    return { sessionId };
  }

  /**
   * Send prompt and stream back mock response
   * Simulates token-by-token streaming like real LLM inference
   */
  async sendPromptStreaming(
    sessionId: string,
    prompt: string,
    onChunk?: (chunk: string, messageIndex: number) => void
  ): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    console.log(`🎭 Mock inference for session ${sessionId}`);
    console.log(`   Prompt: "${prompt}"`);

    // Find matching mock response or use default
    const mockResponse = this.findMockResponse(prompt);
    console.log(`   Response length: ${mockResponse.length} chars`);

    // Simulate streaming by sending response word by word
    const words = mockResponse.split(' ');
    let fullResponse = '';
    let messageIndex = session.messageCount++;

    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      fullResponse += chunk;

      // Call chunk handler if provided
      if (onChunk) {
        onChunk(chunk, messageIndex);
      }

      // Emit streaming event (compatible with real SessionManager)
      this.emit('stream_chunk', {
        sessionId,
        chunk,
        messageIndex,
        isComplete: i === words.length - 1,
      });

      // Simulate network delay
      await this.sleep(this.responseDelay);
    }

    // Emit completion event
    this.emit('stream_complete', {
      sessionId,
      fullResponse,
      messageIndex,
    });

    return fullResponse;
  }

  /**
   * Send prompt and get full response (non-streaming)
   */
  async sendPrompt(sessionId: string, prompt: string): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    console.log(`🎭 Mock inference (non-streaming) for session ${sessionId}`);

    const mockResponse = this.findMockResponse(prompt);

    // Simulate processing delay
    await this.sleep(500);

    session.messageCount++;

    return mockResponse;
  }

  /**
   * End a mock session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`🎭 Mock session not found: ${sessionId}`);
      return;
    }

    this.activeSessions.delete(sessionId);
    console.log(`🎭 Mock session ended: ${sessionId}`);
    console.log(`   Total messages: ${session.messageCount}`);
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): any {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Find matching mock response for a prompt
   */
  private findMockResponse(prompt: string): string {
    const normalizedPrompt = prompt.toLowerCase().trim();

    // Check for exact matches
    for (const mock of this.mockResponses) {
      if (normalizedPrompt.includes(mock.prompt.toLowerCase())) {
        return mock.response;
      }
    }

    // Check for common keywords
    if (normalizedPrompt.includes('help')) {
      return 'I\'m here to help! This is a demonstration version of Fabstir AI. The real decentralized AI nodes are being deployed. What would you like to know?';
    }

    if (normalizedPrompt.includes('test')) {
      return 'Test successful! ✅ The UI is working correctly. Once the production infrastructure is ready, you\'ll get real AI responses from GPU nodes.';
    }

    // Return default response
    return this.defaultResponse;
  }

  /**
   * Helper: Sleep for ms milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configure mock behavior (optional)
   */
  setResponseDelay(ms: number): void {
    this.responseDelay = ms;
    console.log(`🎭 Mock response delay set to ${ms}ms`);
  }

  /**
   * Add custom mock response
   */
  addMockResponse(prompt: string, response: string): void {
    this.mockResponses.push({ prompt, response });
    console.log(`🎭 Added custom mock response for: "${prompt}"`);
  }
}

/**
 * Type guard to check if SessionManager is mock
 */
export function isMockSessionManager(manager: any): manager is MockSessionManager {
  return manager instanceof MockSessionManager;
}
