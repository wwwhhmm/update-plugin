# Update App Plugin

This plugin come from internet. Thanks to the author.
      
Update App plugin allows you replace the current running app with new version app. It only support Android platform. 

There is an example of downloading a .apk and updating the APP immediately.

-------------- index.html --------------
<!DOCTYPE HTML>
<html>
<head>
	<meta charset="UTF-8">
	<title>Hello</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0">
	<link rel="shortcut icon" href="images/favicon.png">
	<link rel="apple-touch-icon" href="images/apple-touch-icon.png">
	<link rel="stylesheet" href="jquery/jquery.mobile-1.3.2.css">
	<link rel="stylesheet" href="css/app.css">
</head>
<body id="content" class="container">
	<div data-role="page" id="index_page">
		<div data-role="content" />
	</div>
	
	<script src="jquery/jquery.js"></script>
	<script src="jquery/jquery.mobile-1.3.2.js"></script>
	<script src="phonegap.js"></script>
	<script src="update-plugin.js"></script>
	<script src="app.js"></script>
</body>
</html>

----------- app.js ------------------
var initOptions = {
	updateSite : 'http://xxxx.com/mobile',
};

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	$(document).ready( function() {
	    if (checkConnection() != Connection.NONE ) {
	    	initOptions.updateSite = initOptions.updateSite +'/'+ device.platform;
	    	checkUpdate();
	    }
	});
}

function checkConnection() {
	var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';

    //alert('Connection type: ' + states[networkState]);
    return networkState;
}


var version = {
	v_online: '',
	v_local: '',
	v_description: '',
	v_apk: ''
};

function getUpdatable(url,key) {
	var dtd = $.Deferred();
	if (workingStatus.isConnected) {
		$.mobile.loading( 'show', { theme: "b", text: '检查最新版本信息...', textonly: true, textVisible: true});
		$.get(url)
			.done( function(xml) {
				alert('ret['+ url +']:'+ allPrpos(xml) );
				if (xml.xmlVersion == '1.0' ) {
					version.v_online = $(xml).find(key).text();
					alert('online: '+ version.v_online );
					version.v_apk = $(xml).find("apk").text();
					version.v_description = $(xml).find("description").text();
					//获取本机版本
					version.v_local = window.localStorage.getItem(key);
					if ( version.v_local == null ) {
						version.v_local = '0.0.1';
					}
					
					//比较版本异同
					if ( version.v_local != version.v_online ) {
						$.mobile.loading( 'show', { theme: "b", text: '有新版本可更新.', textonly: true, textVisible: true});
						dtd.resolve();
					}else {
						$.mobile.loading( 'show', { theme: "b", text: '您已经是最新版本.', textonly: true, textVisible: true});
						setTimeout("{ $.mobile.loading('hide'); $.mobile.changePage('views/login.html'); }",5000);
						dtd.reject();
					}
				} else {
					console.log('error file info!');
					dtd.reject();
				}
			})
			.fail( function() {
				$.mobile.loading( 'show', { theme: "b", text: '获取版本信息失败。请检查网络后重试！', textonly: true, textVisible: true});
				setTimeout("$.mobile.loading('hide')",5000);
				dtd.reject();
			});
	} else {
		dtd.reject();
	}
	return dtd.promise();
}


function checkUpdate() {
	$.when(getUpdatable(initOptions.updateSite +'/update.xml?'+(new Date()).valueOf(),'version'))
		.done( function () { alert('update Version!'); updateVersion(); } )
		.fail( function () { alert("don't update!"); } )
		//.always( function () { alert("always to login.html!");} )
}

function reqRoot() {
	var dtd = $.Deferred();
	window.requestFileSystem( LocalFileSystem.PERSISTENT, 0, 
		function(fileSystem) {
			//alert('fs over!');
			dtd.resolve(fileSystem.root);
		},
		function(evt) {
			console.log('reqRoot:' +evt.target.error.code);
			alert('reqRoot:' +evt.target.error.code);
			dtd.reject();
		}
	);
	return dtd.promise();
}

function mkDir( entrydir, dir ) {
	var dtd = $.Deferred();
	entrydir.getDirectory( dir, {create:true,exclusive:false},
		function(currentdir) {
			//alert('mkDir('+ dir+ ') over');
			dtd.resolve(currentdir);
		},
		function(evt) {
			console.log( 'mkDir('+ dir+ '):' + evt.target.error.code);
			dtd.reject();
		}
	);
	return dtd.promise();
}

function createFile( entrydir, fname ) {
	var dtd = $.Deferred();
	entrydir.getFile( fname, {create:true,exclusive:false},
		function(parent) {
			//alert('createFile('+ fname+ ') over');
			dtd.resolve(parent, fname);
		},
		function(evt) {
			console.log( 'createFile('+ fname+ '):' + evt.target.error.code);
			dtd.reject();
		}
	);
	return dtd.promise();
}

function updateVersion() {
	$.mobile.loading( 'show', { theme: "b", text: '准备更新版本...', textonly: true, textVisible: true});
	$.when(reqRoot())
		.done( function (entrydir) {
			$.when(mkDir(entrydir, "dir1")) //下载目录一级
				.done( function (entrydir2) {
					$.when(mkDir(entrydir2, "update")) //下载目录二级
						.done( function (entrydir3) {
							$.when(createFile(entrydir3, version.v_apk ))
								.done( downloadApp ); //下载文件
						});
				});
		})
		.always( function () { setTimeout("$.mobile.loading('hide')",3000); });
}

function downloadApp(parent, fname) {
	alert("start download... "+ fname);
	var fileTransfer = new FileTransfer();
	var uri = encodeURI(initOptions.updateSite +'/'+ fname);

	fileTransfer.onprogress = function(progressEvent) {
		if (progressEvent.lengthComputable) {
			var percentLoaded = Math.round(100 * (progressEvent.loaded / progressEvent.total));  
			$.mobile.loading( 'show', { theme: "b", text: '正在下载... '+ percentLoaded +'% \nload:'+ progressEvent.loaded + "/" + progressEvent.total, textVisible: true});

			if( progressEvent.loaded == progressEvent.total ) {
				$.mobile.loading( 'show', { theme: "b", text: '下载成功！正在准备更新... ', textonly: true, textVisible: true});
			}
		} else {  
			$.mobile.loading( 'show', { theme: "b", text: '正在下载... \nload:'+ progressEvent.loaded, textVisible: true});
		}
	};

	fileTransfer.download( uri, parent.fullPath,
		function(entry){
			//调用自动安装的插件   
			window.plugins.update.openFile(entry.fullPath,null,null); //use the plugin
			window.localStorage.setItem('version',version.v_online);
		},
		function(error) {
			console.log("download error source " + error.source);
			console.log("download error target " + error.target);
			console.log("upload error code" + error.code);
			$.mobile.loading( 'show', { theme: "b", text: "下载失败，请联网重试！ ", textonly: true, textVisible: true});
			setTimeout("$.mobile.loading('hide');",5000);
		}
	);
}