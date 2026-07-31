/* ==========================================================================
   MODELOS DE LA API
   Cada interfaz espeja la respuesta de un endpoint del backend.
   Ubicación sugerida: src/app/core/models/api.models.ts
   ========================================================================== */

/* --------------------------------------------------------------------------
   TIPOS BASE
   -------------------------------------------------------------------------- */

/** Los cuatro metales. Coincide con el ENUM de la columna `type` en Postgres. */
export type TrophyType = 'bronze' | 'silver' | 'gold' | 'platinum';

/** Escalón de rareza derivado del porcentaje. No viene del backend: se calcula. */
export type RarityTier = 'ultra-rare' | 'very-rare' | 'rare' | 'common';

/** Conteo de trofeos desglosado por metal. Se repite en varias respuestas. */
export interface TrophyCount {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
}

/** Forma de los errores que devuelve el errorHandler del backend. */
export interface ApiError {
    error: string;
    details?: string | string[];
}

/* --------------------------------------------------------------------------
   AUTENTICACIÓN
   -------------------------------------------------------------------------- */

/** POST /auth/register y POST /auth/login */
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        psnLinked: boolean;
        psnOnlineId?: string | null;
    };
}

/** GET /auth/me */
export interface CurrentUser {
    id: string;
    email: string;
    psnOnlineId: string | null;
    lastFullSyncAt: string | null;
    isSyncing: boolean;
    psnLinked: boolean;
    psnNpssoLinkedAt: string | null;
    psnAvatarUrl: string | null
}

/** POST /auth/register y POST /auth/login (cuerpo del request) */
export interface CredentialsRequest {
    email: string;
    password: string;
}

/** POST /auth/psn/link (cuerpo del request) */
export interface PsnLinkRequest {
    /** Token de 64 caracteres que el usuario copia del navegador. */
    npsso: string;
    /** Nickname de PSN. Opcional: sirve para resolver el accountId. */
    onlineId?: string;
}

/** POST /auth/psn/link (respuesta) */
export interface PsnLinkResponse {
    message: string;
    psnLinked: boolean;
}

/* --------------------------------------------------------------------------
   SINCRONIZACIÓN
   -------------------------------------------------------------------------- */

/** POST /sync — responde 202 Accepted y el proceso sigue en background. */
export interface SyncStartResponse {
    message: string;
    status: 'running';
}

/** GET /sync/status — el frontend lo consulta en intervalos hasta que termina. */
export interface SyncStatus {
    isSyncing: boolean;
    lastFullSyncAt: string | null;
}

/** Trofeo detectado como nuevo durante una sincronización. */
export interface NewTrophy {
    trophyName: string;
    trophyType: TrophyType;
    gameName: string;
    earnedAt: string | null;
}

/* --------------------------------------------------------------------------
   JUEGOS
   -------------------------------------------------------------------------- */

/** GET /games — un elemento del array. */
export interface GameListItem {
    id: string;
    name: string;
    iconUrl: string | null;
    /** Texto libre de Sony: 'PS5', 'PS4', 'PS4,PS5', 'PSVITA'... */
    platform: string;
    /** 0 a 100. */
    progress: number;
    earned: TrophyCount;
    total: TrophyCount;
    lastPlayedAt: string | null;
}

/** Query params de GET /games */
export interface GameListQuery {
    platform?: string;
    search?: string;
    sort?: 'progress' | 'name' | 'lastPlayed';
}

/** GET /games/:id — bloque `game` de la respuesta. */
export interface GameDetail {
    id: string;
    name: string;
    iconUrl: string | null;
    platform: string;
    progress: number;
    lastPlayedAt: string | null;
    isGoal: boolean
}

/** GET /games/:id — un elemento del array `trophies`. */
export interface TrophyDetail {
    id: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    type: TrophyType;
    /** Porcentaje de jugadores que lo obtuvo. Ya viene convertido a number. */
    rarity: number | null;
    /** Si es true, Sony vela nombre y descripción hasta obtenerlo. */
    isHidden: boolean;
    earned: boolean;
    earnedAt: string | null;
}

/** GET /games/:id — respuesta completa. */
export interface GameDetailResponse {
    game: GameDetail;
    trophies: TrophyDetail[];
}

/* --------------------------------------------------------------------------
   ESTADÍSTICAS
   -------------------------------------------------------------------------- */

/** GET /stats — bloque `totals`. */
export interface StatsTotals {
    games: number;
    completedGames: number;
    trophiesEarned: number;
    trophiesDefined: number;
    /** 0 a 100, con dos decimales. */
    completionRate: number;
    /** Puntaje calculado: bronce 15, plata 30, oro 90, platino 300. */
    points: number;
}

/** GET /stats — un elemento de `rarestTrophies`. */
export interface RarestTrophy {
    gameId?: string | null;
    name: string;
    type: TrophyType;
    iconUrl: string | null;
    rarity: number | null;
    gameName: string;
    earnedAt: string | null;
}

/** GET /stats — respuesta completa. */
export interface StatsResponse {
    totals: StatsTotals;
    /** Trofeos obtenidos, por metal. */
    earned: TrophyCount;
    /** Trofeos existentes en la colección, por metal. */
    defined: TrophyCount;
    rarestTrophies: RarestTrophy[];
    profile: StatsProfile;
    recentTrophies: RecentTrophy[];
}

/** GET /stats/timeline — un elemento del array. */
export interface TimelinePoint {
    /** Formato 'YYYY-MM'. */
    month: string;
    total: number;
    platinum: number;
}

/* --------------------------------------------------------------------------
   AMIGOS
   -------------------------------------------------------------------------- */

/** GET /friends — un elemento del array. Viene tal cual del modelo Sequelize. */
export interface FriendListItem {
    id: string;
    userId: string;
    friendAccountId: string;
    friendOnlineId: string;
    friendAvatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

/** POST /friends/sync */
export interface FriendsSyncResponse {
    total: number;
    saved: number;
    /** Perfiles que no se pudieron leer, casi siempre por privacidad. */
    failed: number;
}

/** GET /friends/search/:onlineId */
export interface UserSearchResult {
    accountId: string;
    onlineId: string;
}

/** GET /friends/:accountId/compare — bloque `friend`. */
export interface ComparedFriendProfile {
    accountId: string;
    onlineId: string;
    avatarUrl: string | null;
    trophyLevel: number;
    earnedTrophies: TrophyCount;
}

/** GET /friends/:accountId/compare — bloque `summary`. */
export interface ComparisonSummary {
    sharedGames: number;
    onlyMineCount: number;
    onlyFriendCount: number;
    myWins: number;
    friendWins: number;
    ties: number;
}

/** Juego que tienen los dos. */
export interface SharedGame {
    name: string;
    iconUrl: string | null;
    platform: string;
    myProgress: number;
    friendProgress: number;
    myPlatinum: boolean;
    friendPlatinum: boolean;
    /** 1 = gana el usuario, -1 = gana el amigo, 0 = empate. */
    winner: 1 | -1 | 0;
}

/** Juego que solo tiene el usuario. */
export interface OnlyMineGame {
    name: string;
    iconUrl: string | null;
    platform: string;
    myProgress: number;
}

/** Juego que solo tiene el amigo. */
export interface OnlyFriendGame {
    name: string;
    iconUrl: string | null;
    platform: string;
    friendProgress: number;
}

/** GET /friends/:accountId/compare — respuesta completa. */
export interface ComparisonResponse {
    friend: ComparedFriendProfile;
    summary: ComparisonSummary;
    shared: SharedGame[];
    onlyMine: OnlyMineGame[];
    onlyFriend: OnlyFriendGame[];
}

/* --------------------------------------------------------------------------
   HELPERS DE PRESENTACIÓN
   Ubicación sugerida: src/app/core/utils/trophy.utils.ts
   -------------------------------------------------------------------------- */

/**
 * Traduce un porcentaje de rareza al escalón correspondiente.
 *
 * NOTA: los umbrales son una aproximación. Sony expone el escalón real en el
 * campo `trophyRare` de su API, que hoy no guardamos en la base. Si se quiere
 * exactitud, conviene agregar esa columna al modelo Trophy.
 */
export function getRarityTier(rarity: number | null): RarityTier {
    if (rarity === null) return 'common';
    if (rarity <= 5) return 'ultra-rare';
    if (rarity <= 10) return 'very-rare';
    if (rarity <= 25) return 'rare';
    return 'common';
}

/** Etiqueta en español para mostrar en la interfaz. */
export const RARITY_LABELS: Record<RarityTier, string> = {
    'ultra-rare': 'Ultra raro',
    'very-rare': 'Muy raro',
    rare: 'Raro',
    common: 'Común',
};

/** Clase CSS de color, definida en styles.css. */
export const RARITY_CLASSES: Record<RarityTier, string> = {
    'ultra-rare': 'rareza-ultra-raro',
    'very-rare': 'rareza-muy-raro',
    rare: 'rareza-raro',
    common: 'rareza-comun',
};

/** Clase CSS de color por metal, definida en styles.css. */
export const TROPHY_CLASSES: Record<TrophyType, string> = {
    bronze: 'metal-bronze',
    silver: 'metal-silver',
    gold: 'metal-gold',
    platinum: 'metal-platinum',
};

/** Etiqueta en español para cada metal. */
export const TROPHY_LABELS: Record<TrophyType, string> = {
    bronze: 'Bronce',
    silver: 'Plata',
    gold: 'Oro',
    platinum: 'Platino',
};

/** Suma los cuatro metales de un conteo. */
export function sumTrophies(count: TrophyCount): number {
    return count.bronze + count.silver + count.gold + count.platinum;
}

/**
 * Separa el campo `platform` de Sony, que puede traer varias separadas por coma
 * (ej. 'PS4,PS5' cuando un juego tiene lista de trofeos compartida).
 */
export function parsePlatforms(platform: string): string[] {
    return platform.split(',').map((p) => p.trim()).filter(Boolean);
}

export interface StatsProfile {
    onlineId: string | null;
    avatarUrl: string | null;
    trophyLevel: number | null;
    lastFullSyncAt: string | null;
}

export interface RecentTrophy {
    gameId?: string | null;
    name: string;
    type: TrophyType;
    iconUrl: string | null;
    gameName: string;
    gameIconUrl: string | null;
    earnedAt: string;
}

export type Dificultad = 'trivial' | 'facil' | 'media' | 'dificil' | 'muy_dificil';

export interface GuideTrophy {
    nombre: string;
    dificultad: Dificultad;
    consejo: string;
    busquedaYoutube: string;
    youtubeUrl: string;
}

export interface GuideResponse {
    resumen: string;
    orden: GuideTrophy[];
}

export interface SuggestedGame {
    id: string;
    name: string;
    iconUrl: string | null;
    platform: string;
    progress: number;
    platinumRarity: number | null;
}

export interface SuggestionsResponse {
    enProgreso: SuggestedGame[];
    sinEmpezar: SuggestedGame[];
}

export interface GoalGame {
    id: string;
    name: string;
    iconUrl: string | null;
    platform: string;
    progress: number;
    earned: TrophyCount;
}