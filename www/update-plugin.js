var Update = function(){};  
  
Update.prototype.openFile = function(fullPath,onSuccess, onFail){  
	cordova.exec(onSuccess, onFail, 'Update', 'openFile', [fullPath]);  
};  
Update.prototype.openApp = function(packageName,onSuccess, onFail){  
	cordova.exec(onSuccess, onFail, 'Update', 'openApp', [packageName]);  
};  
if(!window.plugins) {  
	window.plugins = {};  
}  
if (!window.plugins.update) {  
	window.plugins.update = new Update();  
}