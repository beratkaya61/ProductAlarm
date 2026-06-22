export interface WhatsappChatSummary {
  id: string;
  name: string;
  isGroup: boolean;
}

export interface WhatsappStatus {
  enabled: boolean;
  ready: boolean;
  hasQrCode: boolean;
}

export interface WhatsappQrCode {
  available: boolean;
  dataUrl: string | null;
  generatedAt: string | null;
}
