import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Directory, Encoding, Filesystem, WriteFileResult } from '@capacitor/filesystem';
import { MessageComponent } from '../message/message.component';
import { StorageService } from '../storage.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageComponent, RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  importError: string | null = null;
  importSuccess: boolean = false;
  deleteSuccess: boolean = false;

  @ViewChild('deleteMessage') deleteMessage!: MessageComponent;
  @ViewChild('exportMessage') exportMessage!: MessageComponent;
  @ViewChild('importMessage') importMessage!: MessageComponent;

  constructor(private storageService: StorageService) { }

  importData(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          this.storageService.importData(content);
          this.importMessage.showSuccess("Data imported successfully!");
        } catch (error) {
          this.importMessage.showError("Invalid JSON file format");
        }
      };
      reader.readAsText(file);
    } else {
      this.importMessage.showError("Please select a valid JSON file");
    }
  }

  exportData(): void {
    this.saveOnDeviceStorage().then(() => {
      this.exportMessage.showSuccess("Data exported successfully!");
    }).catch((error) => {
      this.exportMessage.showError("Failed to export data: " + error);
    });
  }

  saveOnDeviceStorage(): Promise<WriteFileResult> {
    const jsonData = this.storageService.exportData();
    if (jsonData) {
      return Filesystem.writeFile({
        path: `grandma-backup-${new Date().toISOString().split('T')[0]}.json`,
        data: jsonData,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
    } else {
      return new Promise<WriteFileResult>((resolve, reject) => {
        reject("No data to export");
      });
    }
  }

  deleteData(): void {
    this.storageService.clearData();
    this.deleteMessage.showSuccess("All data deleted successfully!");
  }
}
