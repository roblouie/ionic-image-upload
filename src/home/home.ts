import {Component, OnInit} from '@angular/core';
import {LoadingController, Platform} from 'ionic-angular';

import { ImageManagementService } from './image-management.service';
import { PermissionError } from './permission-error';
import { RealFileLoaderService } from './real-file-loader.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [ImageManagementService, RealFileLoaderService]
})
export class HomePage implements OnInit{
  imagePaths: string[];
  loadingSpinner = this.loadingCtrl.create({ content: 'Loading images...' });
  uploadingSpinner = this.loadingCtrl.create({ content: 'Uploading images...' });
  isDesktop: boolean;

  constructor(
    private imageManagementService: ImageManagementService,
    private loadingCtrl: LoadingController,
    public platform: Platform) {}

  async ngOnInit() {
    this.isDesktop = this.platform.is('core');
    try {
      this.loadingSpinner.present();
      await this.loadImagePaths();
      this.loadingSpinner.dismiss();
    } catch(error) {
      console.log(error);
      this.loadingSpinner.dismiss();
    }
  }

  async uploadFromImagePicker() {
    try {
      this.uploadingSpinner.present();
      await this.imageManagementService.uploadFromImagePicker();
      await this.loadImagePaths();
      this.uploadingSpinner.dismiss();
    } catch(error) {
      console.log(error);
      this.loadingSpinner.dismiss();
      if (error instanceof PermissionError) {
        alert('You must give the app permission for the gallery before you can choose an image');
      }
    }
  }

  async uploadFromCamera() {
    try {
      this.uploadingSpinner.present();
      await this.imageManagementService.uploadFromCamera();
      await this.loadImagePaths();
      this.uploadingSpinner.dismiss();
    } catch(error) {
      console.log(error);
    }
  }

  async uploadWebFile(event) {
    const formData = new FormData();
    Array.from(event.target.files).forEach((file: File) => formData.append('photos', file, file.name));
    await this.imageManagementService.uploadImages(formData);
    await this.loadImagePaths();
  }

  private async loadImagePaths() {
    this.imagePaths = await this.imageManagementService.listImagesOnServer();
  }
}
