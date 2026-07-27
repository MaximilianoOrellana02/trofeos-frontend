import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { Observable } from "rxjs";
import { GameList } from "../../features/games/game-list/game-list";
import { GameDetailResponse, GameListItem } from "../models/api.models";

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
}