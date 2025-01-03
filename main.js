const { app, BrowserWindow,ipcMain, desktopCapturer } = require('electron')

const path = require('node:path')
const fs = require('fs')
const { nativeImage } = require('electron');
const { put } = require('@vercel/blob');
require('dotenv').config();


const createWindow = () => {
   const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
      }
    })
  
    mainWindow.loadFile('index.html')
  }

  app.whenReady().then(() => {
    createWindow()
  })

  ipcMain.handle('capture-screen', async () => {
    try{

    
    const sources = await desktopCapturer.getSources({ types: ['screen'],
      thumbnailSize: {
        width: 3840, 
        height: 2160 
      }
     });
  
   
    const screenShotSource = sources[0];

    if(!screenShotSource) {
      throw new Error('Screen source not found');
    }
   
    const image = nativeImage.createFromDataURL(screenShotSource.thumbnail.toDataURL());
    const imageBuffer = image.toPNG();

    const sizeInBytes = Buffer.byteLength(imageBuffer);

    // Create a unique filename
    const filename = `screenshot_${Date.now()}.png`;

    // Upload buffer directly to Vercel Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true
    });

    return {
      url: blob.url,
      size: sizeInBytes
    };

  } catch (error) {
    console.error('Error capturing screen:', error);
    throw error;
  }
  });

  
  app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
