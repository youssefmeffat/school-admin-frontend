import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  conversationId: string | null;
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private readonly baseUrl =
    `${environment.apiUrl}/Chatbot`;


  constructor(
    private http: HttpClient,
  ) {}


  sendMessage(message: string, conversationId: string | null): Observable<ChatResponse> {

    const body: ChatRequest = {
      message,
      conversationId,
    };

    return this.http.post<ChatResponse>(
      `${this.baseUrl}/message`,
      body,
    );
  }
}
