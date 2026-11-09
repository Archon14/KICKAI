import type {
  HealthResponse,
  TacticsAnalyzeResponse,
  TacticsAnalyzeRequest,
  MatchSimulateRequest,
  MatchSimulateResponse,
  TrainingAdaptiveDrillRequest,
  TrainingAdaptiveDrillResponse,
  PlayerEvaluationRequest,
  PlayerEvaluationResponse,
  FormationRecommendRequest,
  FormationRecommendResponse,
  CoachOverrideRequest,
  CoachOverrideResponse,
  CoachLogEntry,
} from "./types";

const BASE = "";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error ${res.status}: ${errorText || res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    // If request to localhost fails, attempt 127.0.0.1 fallback to bypass IPv6 DNS resolution issues
    if (url.includes("localhost:8000")) {
      const fallbackUrl = url.replace("localhost:8000", "127.0.0.1:8000");
      try {
        const res2 = await fetch(fallbackUrl, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
          },
          cache: "no-store",
        });
        if (res2.ok) {
          return (await res2.json()) as T;
        }
      } catch {
        // Fall through to original error
      }
    }
    console.error(`Request to ${url} failed:`, err);
    throw err;
  }
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health").catch(async () => {
    // Fallback if router is mounted at root /health
    return request<HealthResponse>("/health");
  });
}

export async function analyzeTactics(
  seed: number = 7,
  family: string = "balanced",
  match_minute: number = 70.0,
  score: [number, number] = [1, 1]
): Promise<TacticsAnalyzeResponse> {
  return request<TacticsAnalyzeResponse>("/api/tactics/analyze", {
    method: "POST",
    body: JSON.stringify({ seed, family, match_minute, score }),
  });
}

export async function simulateMatch(payload: MatchSimulateRequest): Promise<MatchSimulateResponse> {
  return request<MatchSimulateResponse>("/api/match/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDrill(
  success: boolean,
  error_mode?: string | null,
  current_difficulty: number = 0.4,
  success_streak: number = 0
): Promise<TrainingAdaptiveDrillResponse> {
  const body: TrainingAdaptiveDrillRequest = {
    success_streak,
    success,
    error: error_mode || null,
    current_difficulty,
  };
  return request<TrainingAdaptiveDrillResponse>("/api/training/adaptive-drill", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function evaluatePlayer(
  payloadOrId: string | Partial<PlayerEvaluationRequest>
): Promise<PlayerEvaluationResponse> {
  const defaultPayload: PlayerEvaluationRequest = {
    player_id: typeof payloadOrId === "string" ? payloadOrId : payloadOrId.player_id ?? "H10",
    name: typeof payloadOrId === "object" && payloadOrId.name ? payloadOrId.name : "Martin Ødegaard",
    team: typeof payloadOrId === "object" && payloadOrId.team ? payloadOrId.team : "home",
    role: typeof payloadOrId === "object" && payloadOrId.role ? payloadOrId.role : "attacking midfielder",
    preferred_foot: typeof payloadOrId === "object" && payloadOrId.preferred_foot ? payloadOrId.preferred_foot : "left",
    finishing: typeof payloadOrId === "object" && payloadOrId.finishing !== undefined ? payloadOrId.finishing : 0.74,
    passing: typeof payloadOrId === "object" && payloadOrId.passing !== undefined ? payloadOrId.passing : 0.89,
    dribbling: typeof payloadOrId === "object" && payloadOrId.dribbling !== undefined ? payloadOrId.dribbling : 0.85,
    tactical_intelligence: typeof payloadOrId === "object" && payloadOrId.tactical_intelligence !== undefined ? payloadOrId.tactical_intelligence : 0.91,
    risk_appetite: typeof payloadOrId === "object" && payloadOrId.risk_appetite !== undefined ? payloadOrId.risk_appetite : 0.62,
    creativity: typeof payloadOrId === "object" && payloadOrId.creativity !== undefined ? payloadOrId.creativity : 0.93,
    max_speed_mps: typeof payloadOrId === "object" && payloadOrId.max_speed_mps !== undefined ? payloadOrId.max_speed_mps : 8.2,
    accel_limit: typeof payloadOrId === "object" && payloadOrId.accel_limit !== undefined ? payloadOrId.accel_limit : 4.4,
    fatigue: typeof payloadOrId === "object" && payloadOrId.fatigue !== undefined ? payloadOrId.fatigue : 0.25,
    defending: typeof payloadOrId === "object" && payloadOrId.defending !== undefined ? payloadOrId.defending : 0.50,
    physical: typeof payloadOrId === "object" && payloadOrId.physical !== undefined ? payloadOrId.physical : 0.50,
  };

  return request<PlayerEvaluationResponse>("/api/player-evaluation", {
    method: "POST",
    body: JSON.stringify(defaultPayload),
  });
}

export async function recommendFormations(
  payload?: Partial<FormationRecommendRequest>
): Promise<FormationRecommendResponse> {
  const body: FormationRecommendRequest = {
    team: payload?.team ?? "home",
    identity: payload?.identity ?? "progressive",
    tempo: payload?.tempo ?? 0.62,
    risk_appetite: payload?.risk_appetite ?? 0.55,
    match_minute: payload?.match_minute ?? 70.0,
    fatigue: payload?.fatigue ?? 0.35,
  };

  return request<FormationRecommendResponse>("/api/formations/recommend", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function coachOverride(payload: CoachOverrideRequest): Promise<CoachOverrideResponse> {
  return request<CoachOverrideResponse>("/api/coach/override", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCoachHistory(): Promise<{ history: CoachLogEntry[]; count: number }> {
  return request<{ history: CoachLogEntry[]; count: number }>("/api/coach/history").catch(() => {
    // Return deterministic fallback if backend server isn't running yet
    return {
      history: [
        {
          id: "log-001",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          action: "Modify",
          option_id: "pass-diagonal",
          note: "Preferred inverted winger underlap over wide cross due to opposition low block.",
          family: "balanced",
          provenance: { origin: "coach_decision_engine", decision_rule: "tactical_override" },
        },
        {
          id: "log-002",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          action: "Accept",
          option_id: "shoot",
          note: "Approved high-xG shot from central zone under low pressure.",
          family: "aggressive",
          provenance: { origin: "tactical_evaluation", confidence: 0.82 },
        },
        {
          id: "log-003",
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          action: "Reject",
          option_id: "carry",
          note: "Refused dribble carry into congested half-space; demanded ball retention.",
          family: "safe",
          provenance: { origin: "coach_decision_engine", fatigue_mitigation: true },
        },
      ],
      count: 3,
    };
  });
}

// ===================================================================
// NEW BACKEND FEATURES (face acoustic, video analysis, export)
// ===================================================================

export interface FaceAcousticRequest {
  query: string;
  origin?: string;
  failed?: boolean;
  speech_text?: string;
  enable_autoplay?: boolean;
}

export interface FaceAcousticResponse {
  expression: string;
  speech_text: string;
  feedback: string;
  html_embed?: string | null;
  provenance: Record<string, any>;
  mock?: boolean;
}

export async function getFaceFeedback(payload: FaceAcousticRequest): Promise<FaceAcousticResponse> {
  return request<FaceAcousticResponse>("/api/face/acoustic_feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface VideoUploadResponse {
  status: string;
  video_id: string;
  frames_processed: number;
  detections_by_class: Record<string, number>;
  annotated_video_url: string;
  note?: string;
}

export async function uploadVideo(file: File): Promise<VideoUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/video/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upload failed (${response.status})`);
  }

  return response.json() as Promise<VideoUploadResponse>;
}

export interface ExportReportResponse {
  status: string;
  report_type: string;
  format: string;
  note?: string;
}

export async function exportReport(type: string): Promise<ExportReportResponse> {
  return request<ExportReportResponse>(`/api/export/${type}`);
}

export interface PlayerItem {
  rank: number;
  name: string;
  position: string;
  club: string;
  rating: number;
}

export async function getTopPlayers(): Promise<{ source: string; count: number; players: PlayerItem[]; formations_available: number }> {
  return request<{ source: string; count: number; players: PlayerItem[]; formations_available: number }>('/api/players/top');
}

export async function getPopularFormations(): Promise<{ source: string; formations: any[] }> {
  return request<{ source: string; formations: any[] }>('/api/formations/popular');
}
