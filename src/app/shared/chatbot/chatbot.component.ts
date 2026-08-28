import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ChatMessage,
  ChatService,
} from '../../services/chat.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
})
export class ChatbotComponent
  implements AfterViewChecked {

  isOpen = false;
  draft = '';
  isSending = false;
  errorMessage = '';

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text:
        'Hello! I\'m the Flairschool assistant. Ask me anything about students, classes, grades, subjects, teachers, attendance, or exams.',
      timestamp: new Date(),
    },
  ];

  private shouldScroll = false;

  @ViewChild('scrollAnchor')
  private scrollAnchor?:
    ElementRef<HTMLDivElement>;

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollAnchor?.nativeElement
        .scrollIntoView({
          behavior: 'smooth',
        });

      this.shouldScroll = false;
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.shouldScroll = true;
    }
  }

  close(): void {
    this.isOpen = false;
  }

  send(): void {
    const text = this.draft.trim();

    if (!text || this.isSending) {
      return;
    }

    this.messages.push({
      role: 'user',
      text,
      timestamp: new Date(),
    });

    this.draft = '';
    this.isSending = true;
    this.errorMessage = '';
    this.shouldScroll = true;

    const conversationContext =
      this.buildConversationContext();

    this.chatService
      .ask(
        text,
        conversationContext,
      )
      .subscribe({
        next: response => {
          this.messages.push({
            role: 'assistant',
            text:
              response.answer ||
              'I couldn\'t find an answer to that.',
            timestamp: new Date(),
          });

          this.isSending = false;
          this.shouldScroll = true;

          this.cdr.detectChanges();
        },

        error: err => {
          console.error(
            'Failed to contact AI assistant:',
            err,
          );

          this.errorMessage =
            this.extractErrorMessage(err);

          this.isSending = false;
          this.shouldScroll = true;

          this.cdr.detectChanges();
        },
      });
  }

  onKeydown(
    event: KeyboardEvent,
  ): void {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      this.send();
    }
  }

  private buildConversationContext():
    string | null {
    const previousMessages =
      this.messages
        .slice(0, -1)
        .slice(-8);

    if (previousMessages.length === 0) {
      return null;
    }

    return previousMessages
      .map(message =>
        `${message.role === 'user'
          ? 'User'
          : 'Assistant'}: ${message.text}`
      )
      .join('\n');
  }

  private extractErrorMessage(
    err: any,
  ): string {
    const body = err?.error;

    if (
      typeof body === 'string' &&
      body.trim()
    ) {
      return body.trim();
    }

    const message =
      body?.message ??
      body?.detail ??
      body?.title;

    if (
      typeof message === 'string' &&
      message.trim()
    ) {
      return message.trim();
    }

    return (
      'Sorry, I couldn\'t reach the assistant. ' +
      'Please make sure the AI service is running and try again.'
    );
  }
}
