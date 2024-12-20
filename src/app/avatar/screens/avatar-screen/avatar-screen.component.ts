import { Component, OnDestroy, OnInit } from '@angular/core';
import { AvatarService } from '../../services/avatar.service';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SpinnerComponent } from '../../../core/components/spinner/spinner.component';
import { UtilService } from '../../../core/services/util.service';

@Component({
  selector: 'app-avatar-screen',
  standalone: true,
  imports: [RouterLink, MatButtonModule, SpinnerComponent],
  templateUrl: './avatar-screen.component.html',
  styleUrl: './avatar-screen.component.scss',
})
export class AvatarScreenComponent implements OnInit, OnDestroy {
  loading!: boolean;
  avatars!: string[];
  selectedAvatar!: string;
  avatarSub = new Subscription();

  constructor(
    private avatarService: AvatarService,
    private authService: AuthService,
    private utilService: UtilService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.listAvatars();
  }

  listAvatars() {
    this.loading = true;
    this.avatarSub = this.avatarService.listAvatars().subscribe({
      next: (res) => {
        this.avatars = res;
      },
      complete: () => {
        this.loading = false;
      },
      error: () => {
        this.utilService.openSnackBar(
          'Something went wrong, please try again later.',
        );
      },
    });
  }

  onSelectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
  }

  onUpdateAvatar() {
    this.authService.updateAvatar(this.selectedAvatar).subscribe({
      next: () => {
        localStorage.setItem('photoURL', this.selectedAvatar ?? '');
        this.authService.profileChanged$.next(this.selectedAvatar as string);
        this.utilService.openSnackBar('Avatar updated successfully.');
        this.router.navigate(['/']);
      },
    });
  }

  ngOnDestroy(): void {
    this.avatarSub.unsubscribe();
  }
}
