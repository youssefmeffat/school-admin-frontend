import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, tap } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface AiChatConnectResponse {
  success: boolean;
  sessionId: string;
  tables: string[];
  message: string;
}

export interface AiChatAskResponse {
  success: boolean;
  answer: string;
  sql: string | null;
  tablesUsed: string[];
  rows: Record<string, unknown>[];
  repairAttempts: number;
  fromCache: boolean;
}

interface AiChatConnectRequest {
  sessionId: string;
}

interface AiChatAskRequest {
  sessionId: string;
  question: string;
  conversationContext: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly baseUrl =
    `${environment.apiUrl}/AiChat`;

  private readonly sessionStorageKey =
    'flairschool-ai-session-id';

  private connectedSessionId: string | null = null;

  constructor(
    private http: HttpClient,
  ) {}

  getSessionId(): string {
    const existing =
      sessionStorage.getItem(this.sessionStorageKey);

    if (existing) {
      return existing;
    }

    const sessionId =
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `chat-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    sessionStorage.setItem(
      this.sessionStorageKey,
      sessionId,
    );

    return sessionId;
  }

  connect(): Observable<AiChatConnectResponse> {
    const sessionId = this.getSessionId();

    if (this.connectedSessionId === sessionId) {
      return of({
        success: true,
        sessionId,
        tables: [],
        message: 'The AI assistant is ready.',
      });
    }

    const body: AiChatConnectRequest = {
      sessionId,
    };

    return this.http
      .post<AiChatConnectResponse>(
        `${this.baseUrl}/connect`,
        body,
      )
      .pipe(
        tap(() => {
          this.connectedSessionId = sessionId;
        }),
      );
  }

  ask(
    question: string,
    conversationContext: string | null,
  ): Observable<AiChatAskResponse> {
    const sessionId = this.getSessionId();

    const body: AiChatAskRequest = {
      sessionId,
      question,
      conversationContext,
    };

    return this.connect().pipe(
      switchMap(() =>
        this.http.post<AiChatAskResponse>(
          `${this.baseUrl}/ask`,
          body,
        ),
      ),
    );
  }

  closeSession(): Observable<void> {
    const sessionId = this.getSessionId();

    return this.http
      .delete<void>(
        `${this.baseUrl}/session/${encodeURIComponent(sessionId)}`,
      )
      .pipe(
        tap(() => {
          this.connectedSessionId = null;
          sessionStorage.removeItem(
            this.sessionStorageKey,
          );
        }),
      );
  }
}
