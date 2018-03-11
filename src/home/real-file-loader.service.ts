import { Injectable } from '@angular/core';
import { File as IonicFileService, FileEntry, IFile } from '@ionic-native/file';

@Injectable()
export class RealFileLoaderService {

  constructor(private ionicFileService: IonicFileService) {}

  async getMultipleFiles(filePaths: string[]): Promise<File[]> {
    // Get FileEntry array from the array of image paths
    const fileEntryPromises: Promise<FileEntry>[] = filePaths.map(filePath => {
      return this.ionicFileService.resolveLocalFilesystemUrl(filePath);
    }) as Promise<FileEntry>[];

    const fileEntries: FileEntry[] = await Promise.all(fileEntryPromises);

    // Get a File array from the FileEntry array. NOTE that while this looks like a regular File, it does
    // not have any actual data in it. Only after we use a FileReader will the File object contain the actual
    // file data
    const CordovaFilePromises: Promise<IFile>[] = fileEntries.map(fileEntry => {
      return this.convertFileEntryToCordovaFile(fileEntry);
    });

    const cordovaFiles: IFile[] = await Promise.all(CordovaFilePromises);

    // Use FileReader on each File object to read the actual file data into the file object
    const filePromises: Promise<File>[] = cordovaFiles.map(cordovaFile => {
      return this.convertCordovaFileToJavascriptFile(cordovaFile)
    });

    // When this resolves, it will return a list of File objects, just as if you had used the regular web
    // file input. These can then be appended to FormData and uploaded.
    return await Promise.all(filePromises);
  }

  async getSingleFile(filePath: string): Promise<File> {
    // Get FileEntry from image path
    const fileEntry: FileEntry = await this.ionicFileService.resolveLocalFilesystemUrl(filePath) as FileEntry;

    // Get File from FileEntry. Again note that this file does not contain the actual file data yet.
    const cordovaFile: IFile = await this.convertFileEntryToCordovaFile(fileEntry);

    // Use FileReader on each object to populate it with the true file contents.
    return this.convertCordovaFileToJavascriptFile(cordovaFile);
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
