// types.ts
export interface Chat {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Message {
    id: string;
    chat_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
  }
  
  export interface ChatWithLastMessage extends Chat {
    lastMessage?: string;
    lastMessageTime?: string;
  }