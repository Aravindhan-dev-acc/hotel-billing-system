import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../core/services/item.service';
import { NotificationService } from '../../core/services/notification.service';
import { Item } from '../../core/models';

interface ItemFormModel {
  id?: number;
  itemCode: string;
  name: string;
  category: string;
  price: number | null;
  taxPercent: number | null;
  isAvailable: boolean;
}

const emptyForm = (): ItemFormModel => ({
  itemCode: '',
  name: '',
  category: 'General',
  price: null,
  taxPercent: 0,
  isAvailable: true,
});

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.css',
})
export class ItemsComponent implements OnInit {
  private itemService = inject(ItemService);
  private notify = inject(NotificationService);

  items = signal<Item[]>([]);
  loading = signal(false);
  search = '';
  page = signal(1);
  totalPages = signal(1);

  showModal = signal(false);
  editing = signal(false);
  form = signal<ItemFormModel>(emptyForm());

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.itemService.list({ page: this.page(), limit: 15, search: this.search }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.totalPages.set(res.pagination.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange() {
    this.page.set(1);
    this.load();
  }

  changePage(delta: number) {
    const next = this.page() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.page.set(next);
    this.load();
  }

  openCreate() {
    this.form.set(emptyForm());
    this.editing.set(false);
    this.showModal.set(true);
  }

  openEdit(item: Item) {
    this.form.set({
      id: item.id,
      itemCode: item.item_code,
      name: item.name,
      category: item.category,
      price: item.price,
      taxPercent: item.tax_percent,
      isAvailable: !!item.is_available,
    });
    this.editing.set(true);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  setField<K extends keyof ItemFormModel>(key: K, value: ItemFormModel[K]) {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  save() {
    const f = this.form();
    if (!f.itemCode || !f.name || f.price === null) {
      this.notify.error('Item code, name and price are required.');
      return;
    }
    const payload = {
      itemCode: f.itemCode,
      name: f.name,
      category: f.category || 'General',
      price: f.price,
      taxPercent: f.taxPercent || 0,
      isAvailable: f.isAvailable,
    };

    const req = this.editing() && f.id
      ? this.itemService.update(f.id, payload)
      : this.itemService.create(payload);

    req.subscribe({
      next: () => {
        this.notify.success(this.editing() ? 'Item updated.' : 'Item created.');
        this.showModal.set(false);
        this.load();
      },
    });
  }

  remove(item: Item) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.itemService.remove(item.id).subscribe({
      next: (res) => {
        this.notify.success(res.message || 'Item removed.');
        this.load();
      },
    });
  }
}
