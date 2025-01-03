// renderer.js
class ScreenshotUploader {
  constructor() {
    this.statusElement = document.getElementById('status');
    this.status2Element = document.getElementById('status2');
    this.imageElement = document.getElementById('screenshot');
    this.uploadButton = document.getElementById('captureButton');
    this.stopButton = document.getElementById('stopButton');
    this.uploadList = document.getElementById('uploadList');
    
    this.timeId = null;
    this.isUploading = false;
    this.uploads = [];
    
    this.initializeEventListeners();
    this.updateButtonStates();
  }

  initializeEventListeners() {
    this.uploadButton.addEventListener('click', () => this.startUpload());
    this.stopButton.addEventListener('click', () => this.stopUpload());
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  async startUpload() {
    if (this.isUploading) return;
    
    this.isUploading = true;
    this.updateButtonStates();
    
    if (this.timeId !== null) {
      this.stopUpload();
    }

    this.updateStatus2('Uploading...');
    await this.captureAndUpload();
    
    this.timeId = setInterval(() => this.captureAndUpload(), 5000);
  }

  stopUpload() {
    if (this.timeId !== null) {
      clearInterval(this.timeId);
      this.timeId = null;
    }
    this.isUploading = false;
    this.updateButtonStates();
    this.updateStatus2('Upload stopped');
  }

  async captureAndUpload() {
    try {
      const start = performance.now();
      const result = await window.electronAPI.captureScreen();
      const duration = Math.round(performance.now() - start);
      
      this.uploads.unshift({
        url: result.url,
        size: this.formatBytes(result.size),
        timestamp: new Date().toLocaleString(),
        duration
      });
      
      this.updateUploadList();
      this.updateImage(result.url);
      this.updateStatus1(`Upload complete (${duration}ms): ${result.url}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      this.updateStatus2('Failed to upload screenshot');
      this.stopUpload();
    }
  }

  updateUploadList() {
    this.uploadList.innerHTML = this.uploads
      .slice(0, 10) // Keep only last 10 uploads in the list
      .map(upload => `
        <div class="upload-item">
          <div>URL: <a href="${upload.url}" target="_blank">${upload.url}</a></div>
          <div>Size: ${upload.size}</div>
          <div>Time: ${upload.timestamp}</div>
          <div>Duration: ${upload.duration}ms</div>
        </div>
      `)
      .join('');
  }


  updateImage(url) {
    this.imageElement.src = url;
    this.imageElement.style.display = 'block';
    this.imageElement.onerror = () => {
      console.error('Error loading image');
      this.imageElement.style.display = 'none';
    };
  }

  updateStatus2(message) {
    this.status2Element.textContent = message;
  }
  updateStatus1(message) {
    this.statusElement.textContent = message;
  }
  updateButtonStates() {
    this.uploadButton.disabled = this.isUploading;
    this.stopButton.disabled = !this.isUploading;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  cleanup() {
    this.stopUpload();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ScreenshotUploader();
});