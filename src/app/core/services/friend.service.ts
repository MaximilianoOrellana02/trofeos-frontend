import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { FriendListItem } from "../models/api.models";

@Injectable({
    providedIn: 'root'
})

export class FriendService {
    private readonly http = inject(HttpClient);
    private apiUrl = environment.apiUrl

    getFriends(): Observable<FriendListItem[]> {
        return this.http.get<FriendListItem[]>(`${this.apiUrl}/friends`)
    }
}