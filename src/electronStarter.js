// Modules to control application life and create native browser window
const { app, BrowserWindow, session, dialog } = require('electron')
const {version: currentVersion} = require('../package.json');
const path = require('node:path')

if (require('electron-squirrel-startup')) app.quit();

function UpsertKeyValue(obj, keyToChange, value) {
  const keyToChangeLower = keyToChange.toLowerCase();
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      // Reassign old key
      obj[key] = value;
      // Done
      return;
    }
  }
  // Insert at end instead
  obj[keyToChange] = value;
}

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // clear cache so that electron fetches latest changes to effortless_fe
  mainWindow.webContents.session.clearCache();


  //------------------------------------------------------------------

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const { requestHeaders } = details;
      UpsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', ['*']);
      callback({ requestHeaders });
    },
  );

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const { responseHeaders } = details;
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*']);
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*']);
    callback({
      responseHeaders,
    });
  });


  //------------------------------------------------------------------


  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')
  const url = process.env.NODE_ENV === 'local' ? 'http://localhost:3000' : 'https://effortless-test.vercel.app';
  console.info(`Using: ${url}`);
  mainWindow.loadURL(url)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {


  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).then(() => {
  return fetch('https://api.github.com/repos/vaidkaran/effortless_electron/releases/latest')
}).then((res) => {
  return res.json();
}).then((jsonRes) => {
  if(`v${currentVersion}` !== jsonRes.name) dialog.showMessageBox({ title: `You're using an outdated version v${currentVersion}\n\nPlease download and install the latest version ${jsonRes.name}\n\n${jsonRes.html_url}`});
  else console.log('On the latest version of electron app');
}).catch((err) => {
  console.error('Error occured in fetching the latest release version', err);
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.