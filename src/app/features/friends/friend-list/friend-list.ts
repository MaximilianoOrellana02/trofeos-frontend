import { Component, inject, OnInit, signal } from '@angular/core';
import { FriendService } from '../../../core/services/friend.service';
import { FriendListItem } from '../../../core/models/api.models';

@Component({
  selector: 'app-friend-list',
  imports: [],
  templateUrl: './friend-list.html',
  styleUrl: './friend-list.css',
})
export class FriendList implements OnInit {
  private readonly friendService = inject(FriendService);

  friends = signal<FriendListItem[]>([]);
  cargando = signal(false)

  ngOnInit(): void {
    this.loadFriends()
  }

  loadFriends() {
    this.cargando.set(true),
      this.friendService.getFriends().subscribe({
        next: (data) => {
          this.friends.set(data),
            console.log(this.friends());
          this.cargando.set(false)
        },
        error: (e) => {
          console.error(e);
          this.cargando.set(false)
        }
      })
  }
}
