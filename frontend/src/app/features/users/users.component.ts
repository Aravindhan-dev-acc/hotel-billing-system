import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, UserRole } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  users = signal<User[]>([]);
  showModal = signal(false);

  newUser = { name: '', email: '', password: '', role: 'STAFF' as UserRole };

  ngOnInit() {
    this.load();
  }

  load() {
    this.userService.list().subscribe({ next: (res) => this.users.set(res.data) });
  }

  openCreate() {
    this.newUser = { name: '', email: '', password: '', role: 'STAFF' };
    this.showModal.set(true);
  }

  save() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      this.notify.error('All fields are required.');
      return;
    }
    this.userService.create(this.newUser).subscribe({
      next: () => {
        this.notify.success('User created.');
        this.showModal.set(false);
        this.load();
      },
    });
  }

  toggleActive(user: User) {
    this.userService.update(user.id, { isActive: !user.is_active }).subscribe({
      next: () => { this.notify.success('User updated.'); this.load(); },
    });
  }

  changeRole(user: User, role: string) {
    this.userService.update(user.id, { role }).subscribe({
      next: () => { this.notify.success('Role updated.'); this.load(); },
    });
  }

  resetPassword(user: User) {
    const newPassword = prompt(`Enter a new password for ${user.name}:`);
    if (!newPassword) return;
    this.userService.resetPassword(user.id, newPassword).subscribe({
      next: () => this.notify.success('Password reset successfully.'),
    });
  }
}
