const video = document.getElementById("videoInput");
let backdevid = null;


function campermit() {
    const permissions = cordova.plugins.permissions;
    permissions.checkPermission(permissions.CAMERA, function (status) {
        if (!status.hasPermission) {
            permissions.requestPermission(
                permissions.CAMERA,
                function (s) {
                    if (s.hasPermission) {
                        findbackcam();
                    }
                    else {
                        navigator.app.exitApp();
                    }
                },
            );
        }
        else {
            findbackcam();
        }
    });
}

function findbackcam() {
    navigator.mediaDevices
        .enumerateDevices()
        .then(function (devices) {
            const videoInputs = devices.filter(function (device) { return device.kind == "videoinput" });
            backdevid = videoInputs[videoInputs.length - 1].deviceId;
            start_video();
        })
        .catch(function (err) {
            console.log(err.name + ":" + err.message);
        });
}

function start_video() {
    const constraints = {
        audio: false,
        video: { deviceId: backdevid },
    };

    video.setAttribute("id", "videoInput");
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
            video.srcObject = stream;
            video.play();
            // setTimeout(navigator.splashscreen.hide, 100);
        })
        .catch(function (err) {
            console.log("An error occurred! " + err);
        });
}



document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    screen.orientation.lock('portrait');
    // modalButtons();
    campermit();
}
