import { Injectable } from '@angular/core';
import { File as IonicFile, FileEntry, IFile } from '@ionic-native/file';

@Injectable()
export class FilePathToJavaScriptFileConverter {

  constructor(private ionicFile: IonicFile) {}

  async getMultipleImageFiles(imagePaths: string[]): Promise<File[]> {
    // Get FileEntry array from the array of image paths
    const fileEntryPromises: Promise<FileEntry>[] = imagePaths.map(imagePath => {
      return this.ionicFile.resolveLocalFilesystemUrl(imagePath);
    }) as Promise<FileEntry>[];

    const imageEntries: FileEntry[] = await Promise.all(fileEntryPromises);

    // Get a File array from the FileEntry array. NOTE that while this looks like a regular File, it does
    // not have any actual data in it. Only after we use a FileReader will the File object contain the actual
    // file data
    const imageCordovaFilePromises: Promise<IFile>[] = imageEntries.map(imageEntry => {
      return this.convertFileEntryToCordovaFile(imageEntry);
    });

    const imageCordovaFiles: IFile[] = await Promise.all(imageCordovaFilePromises);

    // Use FileReader on each File object to read the actual file data into the file object
    const imageFilePromises: Promise<File>[] = imageCordovaFiles.map(cordovaFile => {
      return this.convertCordovaFileToJavascriptFile(cordovaFile)
    });

    // When this resolves, it will return a list of File objects, just as if you had used the regular web
    // file input. These can then be appended to FormData and uploaded.
    return await Promise.all(imageFilePromises);
  }

  async getSingleImageFile(imagePath: string): Promise<File> {
    // Get FileEntry from image path
    const imageEntry: FileEntry = await this.ionicFile.resolveLocalFilesystemUrl(imagePath) as FileEntry;

    // Get File from FileEntry. Again note that this file does not contain the actual file data yet.
    const imageCordovaFile: IFile = await this.convertFileEntryToCordovaFile(imageEntry);

    // Use FileReader on each object to populate it with the true file contents.
    return this.convertCordovaFileToJavascriptFile(imageCordovaFile);
  }

  private convertFileEntryToCordovaFile(fileEntry: FileEntry): Promise<IFile> {
    return new Promise<IFile>((resolve, reject) => {
      fileEntry.file(resolve, reject);
    })
  }

  private convertCordovaFileToJavascriptFile(cordovaFile: IFile): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.error) {
          reject(reader.error);
        } else {
          const blob: any = new Blob([reader.result], { type: cordovaFile.type });
          blob.lastModifiedDate = new Date();
          blob.name = cordovaFile.name;
          resolve(blob as File);
        }
      };

      reader.readAsArrayBuffer(cordovaFile);
    });
  }
}
