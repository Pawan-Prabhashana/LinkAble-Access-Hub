export const API_BASE_URL = 'http://192.168.8.141:8000';

export type BackendDetectionItem = {
  object_name: string;
  confidence: number;
  direction: 'left' | 'center' | 'right';
  distance_category: 'near' | 'medium' | 'far';
  bbox: number[];
  guidance: string;
};

export type DetectResponse = {
  success: boolean;
  message: string;
  detections: BackendDetectionItem[];
};

// ── Issue Reports ─────────────────────────────────────────────────────────────

export type IssueReport = {
  id: string;
  title: string;
  description: string;
  transcript: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  timestamp: string;
};

export async function submitIssueReport(transcript: string): Promise<IssueReport> {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Submit failed: ${text}`);
  }

  return response.json();
}

// ── Obstacle Detection ────────────────────────────────────────────────────────

export async function detectFromBackend(imageUri: string): Promise<DetectResponse> {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    name: 'frame.jpg',
    type: 'image/jpeg'
  } as any);

  const response = await fetch(`${API_BASE_URL}/detect`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Detection failed: ${text}`);
  }

  return response.json();
}
