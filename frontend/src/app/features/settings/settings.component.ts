import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { BackupService, BackupFile } from '../../core/services/backup.service';
import { NotificationService } from '../../core/services/notification.service';
import { HotelSettings } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private backupService = inject(BackupService);
  private notify = inject(NotificationService);

  settings = signal<HotelSettings | null>(null);
  saving = signal(false);
  activeTab = signal<'hotel' | 'billing' | 'backup'>('hotel');

  backups = signal<BackupFile[]>([]);
  backingUp = signal(false);

  ngOnInit() {
    this.loadSettings();
    this.loadBackups();
  }

  loadSettings() {
    this.settingsService.getAll().subscribe({ next: (res) => this.settings.set(res.data) });
  }

  loadBackups() {
    this.backupService.list().subscribe({ next: (res) => this.backups.set(res.data) });
  }

  updateField(key: string, value: string) {
    this.settings.update((s) => (s ? { ...s, [key]: value } : s));
  }

  save() {
    const s = this.settings();
    if (!s) return;
    this.saving.set(true);
    this.settingsService.update(s).subscribe({
      next: () => {
        this.notify.success('Settings saved.');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  createBackup() {
    this.backingUp.set(true);
    this.backupService.create().subscribe({
      next: () => {
        this.notify.success('Backup created successfully.');
        this.loadBackups();
        this.backingUp.set(false);
      },
      error: () => this.backingUp.set(false),
    });
  }

  restoreBackup(file: BackupFile) {
    if (!confirm(`Restore database from "${file.fileName}"? Current data will be replaced. The backend must be restarted afterwards.`)) return;
    this.backupService.restore(file.fileName).subscribe({
      next: (res) => this.notify.success(res.message || 'Database restored.'),
    });
  }

  downloadBackup(file: BackupFile) {
    window.open(this.backupService.downloadUrl(file.fileName), '_blank');
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
