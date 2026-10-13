export interface HealthResponse {
  status: string;
  version: string;
  app: string;
  mock_mode: boolean;
}

export interface TacticsOptionOutcome {
  label: string;
  probability: number;
}

export interface TacticalOptionModel {
  id: string;
  action: string;
  expected_value: number;
  risk: number;
  confidence: number;
  family: string;
  target_player?: string | null;
  outcomes?: TacticsOptionOutcome[];
  why?: Record<string, string>;
  uncertainty?: string[];
}

export interface TacticsAnalyzeRequest {
  family: string;
  seed: number;
  match_minute?: number;
  score?: [number, number];
}

export interface TacticsAnalyzeResponse {
  recommendation?: TacticalOptionModel | null;
  options: TacticalOptionModel[];
  failure_modes: string[];
  quality: number;
  claim: string;
  provenance: Record<string, any>;
  coach_controls: string[];
  match_minute: number;
  score: [number, number];
  world_origin: string;
  ball_origin: string;
  players_visible: number;
  players_off_camera: number;
  mock?: boolean;
}

export interface FormationOptionModel {
  shape: string;
  score: number;
  why: string;
  family: string;
  claim: string;
}

export interface FormationRecommendRequest {
  team: string;
  identity: string;
  tempo: number;
  risk_appetite: number;
  match_minute: number;
  fatigue: number;
}

export interface FormationRecommendResponse {
  team: string;
  best: string | null;
  options: FormationOptionModel[];
  origin: string;
  claim: string;
  provenance: Record<string, any>;
  mock?: boolean;
}

export interface ScoreDistributionItem {
  home: number;
  away: number;
  probability: number;
}

export interface MatchSimulateRequest {
  home_team: string;
  away_team: string;
  home_elo?: number;
  away_elo?: number;
  home_xg?: number;
  away_xg?: number;
  simulations: number;
  seed?: number;
  auto_lookup?: boolean;
}

export interface MatchSimulateResponse {
  home_team: string;
  away_team: string;
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  expected_home_goals: number;
  expected_away_goals: number;
  simulations: number;
  most_likely_score: [number, number];
  score_distribution: ScoreDistributionItem[];
  home_elo: number;
  away_elo: number;
  home_xg: number;
  away_xg: number;
  mock?: boolean;
}

export interface PlayerEvaluationRequest {
  player_id: string;
  name: string;
  team: string;
  role: string;
  preferred_foot: string;
  finishing: number;
  passing: number;
  dribbling: number;
  tactical_intelligence: number;
  risk_appetite: number;
  creativity: number;
  max_speed_mps: number;
  accel_limit: number;
  fatigue: number;
}

export interface PlayerEvaluationResponse {
  player_id: string;
  name: string;
  team: string;
  role: string;
  overall_rating: number;
  role_fit: string;
  strengths: string[];
  weaknesses: string[];
  recommended_actions: string[];
  metrics: Record<string, number>;
  claim: string;
  provenance: Record<string, any>;
  mock?: boolean;
}

export interface DrillModel {
  name: string;
  focus: string;
  difficulty: number;
  repetitions: number;
  visual_cues: string[];
  audio_cues: string[];
  team?: boolean;
}

export interface TrainingAdaptiveDrillRequest {
  success: boolean;
  error?: string | null;
  current_difficulty?: number;
}

export interface TrainingAdaptiveDrillResponse {
  weakness: string;
  drill: DrillModel;
  feedback: string;
  failure_mode?: string | null;
  next_difficulty: number;
  audio_required: boolean;
  claim: string;
  provenance: Record<string, any>;
  mock?: boolean;
}

export interface CoachDecisionModel {
  action: string;
  option_id?: string | null;
  note: string;
  alternative_family?: string | null;
  provenance: Record<string, any>;
}

export interface CoachOverrideRequest {
  action: string;
  option_id?: string | null;
  note: string;
  family?: string | null;
  seed: number;
}

export interface CoachOverrideResponse {
  coach: CoachDecisionModel;
  recommendation?: TacticalOptionModel | null;
  options: TacticalOptionModel[];
  failure_modes: string[];
  quality: number;
  claim: string;
  provenance: Record<string, any>;
  mock?: boolean;
}

export interface CoachLogEntry {
  id: string;
  timestamp: string;
  action: string;
  option_id?: string | null;
  note: string;
  family?: string;
  provenance: Record<string, any>;
}

export interface PitchPlayer {
  id: string;
  name: string;
  team: "home" | "away";
  x: number; // 0-105 meters
  y: number; // 0-68 meters
  number: number;
  energy: number; // 0-1
  fatigue: number; // 0-1
  current_action?: string;
}

export interface PassingVector {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  ev: number;
  probability: number;
  label?: string;
}
