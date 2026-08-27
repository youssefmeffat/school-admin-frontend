import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatMessage, ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
})
export class ChatbotComponent implements AfterViewChecked {

  isOpen = false;
  draft = '';
  isSending = false;
  errorMessage = '';

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'Hello! I\'m the Flairschool assistant. Ask me anything about students, classes, grades, or exams.',
      timestamp: new Date(),
    },
  ];

  private conversationId: string | null = null;
  private shouldScroll = false;

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;


  constructor(
    private chatService: ChatService,
  ) {}


  ngAfterViewChecked(): void {

    if (this.shouldScroll) {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
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

    this.chatService
      .sendMessage(text, this.conversationId)
      .subscribe({

        next: (response) => {

          this.conversationId = response.conversationId;

          this.messages.push({
            role: 'assistant',
            text: response.reply,
            timestamp: new Date(),
          });

          this.isSending = false;
          this.shouldScroll = true;
        },

        error: () => {

          this.errorMessage =
            'Sorry, I couldn\'t reach the assistant. Please try again.';

          this.isSending = false;
          this.shouldScroll = true;
        },

      });
  }


  onKeydown(event: KeyboardEvent): void {

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
