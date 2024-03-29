import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, map, switchMap, tap } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { ProfileUser } from 'src/app/models/user-profile';
import { ChatsService } from 'src/app/services/chats.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChild('endOfChat')
  endOfChat!: ElementRef;

  user$ = this.usersService.currentUserProfile$;

  searchControl = new FormControl('');
  chatListControl = new FormControl();
  messageControl = new FormControl('');

  users$ = combineLatest([
    this.usersService.allUsers$,
    this.user$,
    this.searchControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([users, user, searchString]) =>
      users.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(searchString.toLowerCase()) &&
          u.uid !== user?.uid
      )
    )
  );

  myChats$ = this.chatsService.myChats$;

  selectedChat$ = combineLatest([
    this.chatListControl.valueChanges,
    this.myChats$,
  ]).pipe(map(([value, chats]) => chats.find((c) => c.id === value[0])));

  messages$ = this.chatListControl.valueChanges.pipe(
    map((value) => value[0]),
    switchMap((chatId) => this.chatsService.getChatMessages$(chatId)),
    tap(() => {
      this.scrollToBottom();
    })
  );

  constructor(
    private usersService: UsersService,
    private chatsService: ChatsService
  ) {}

  ngOnInit(): void {}

  createChat(otherUser: ProfileUser) {
    this.chatsService.createChat(otherUser).subscribe();
  }

  sendMessage() {
    const message = this.messageControl.value;
    const selectedChatId = this.chatListControl.value[0];

    if (message && selectedChatId) {
      this.chatsService
        .addChatMessage(selectedChatId, message)
        .subscribe(() => {
          this.scrollToBottom();
        });
      this.messageControl.setValue('', { emitEvent: false });
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.endOfChat) {
        this.endOfChat.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
}
