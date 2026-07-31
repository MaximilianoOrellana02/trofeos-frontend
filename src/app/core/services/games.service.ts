import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { Observable } from "rxjs";
import { GameList } from "../../features/games/game-list/game-list";
import { GameDetailResponse, GameListItem, GoalGame, GuideResponse, SuggestionsResponse } from "../models/api.models";

@Injectable({
    providedIn: 'root'
})

export class GamesService {
    private readonly http = inject(HttpClient)
    private apiUrl = environment.apiUrl

    getAllGames(): Observable<GameListItem[]> {
        return this.http.get<GameListItem[]>(`${this.apiUrl}/games`)
    }

    getGame(id: string): Observable<GameDetailResponse> {
        return this.http.get<GameDetailResponse>(`${this.apiUrl}/games/${id}`);
    }

    getGuide(id: string, force = false): Observable<GuideResponse> {
        let params = new HttpParams();
        if (force) {
            params = params.set('force', 'true');
        }
        return this.http.get<GuideResponse>(`${this.apiUrl}/games/${id}/guide`, { params });
    }

    getSuggestions(): Observable<SuggestionsResponse> {
        return this.http.get<SuggestionsResponse>(`${this.apiUrl}/games/suggestions`);
    }

    getGoals(): Observable<GoalGame[]> {
        return this.http.get<GoalGame[]>(`${this.apiUrl}/games/goals`);
    }

    toggleGoal(id: string, isGoal: boolean): Observable<{ id: string; isGoal: boolean }> {
        return this.http.put<{ id: string; isGoal: boolean }>(
            `${this.apiUrl}/games/${id}/goal`,
            { isGoal }
        );
    }
}