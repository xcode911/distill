const { app, BrowserWindow } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('disable-http-cache');
function createWindow(){
  const win=new BrowserWindow({width:1280,height:720,minWidth:960,minHeight:540,backgroundColor:'#111',autoHideMenuBar:true,webPreferences:{contextIsolation:true,sandbox:true}});
  win.loadFile(path.join(__dirname,'index.html'));
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
