// Initialize app
var myApp = new Framework7();


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    console.log("Device is ready!");
});



//////////////////////////////////////////////////////////////////////////////////////////////////

// section Scanbot SDK

var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  onDeviceReady: function() {
    this.receivedEvent('deviceready');

    initExampleUi();
    initScanbotSdk();
  },

  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
  }

};

app.initialize();


var currentDocumentImage = { imageFileUri: '', originalImageFileUri: '' };
var ocrLanguages = ["eng", "fra"];
var jpgQuality = 70;


function initExampleUi() {
  document.getElementById('start-camera-ui-button').onclick = function(e) {
    startCameraUi();
  };
  document.getElementById('start-cropping-ui-button').onclick = function(e) {
    startCroppingUi();
  };
  document.getElementById('apply-image-filter-button').onclick = function(e) {
    applyImageFilter();
  };
  document.getElementById('perform-ocr-button').onclick = function(e) {
    performOcr();
  };
}

function initScanbotSdk() {
  var options = {
    loggingEnabled: true,
    licenseKey: ''
  };

  ScanbotSdk.initializeSdk(
      function(result) {
        console.log(result);
        document.getElementById('label-ready').innerHTML = '' + result;
        checkPrepareOcrFiles();
      },
      sdkErrorCallback, options
  );
}

function sdkErrorCallback(error) {
  console.log('Error from Scanbot SDK: ' + error);
  alert('Error from Scanbot SDK: ' + error);
}

function startCameraUi() {
  var options = {
    edgeColor: '#0000ff',
    quality: jpgQuality,
    sampleSize: 2 // change to 1 for full resolution images
  };

  ScanbotSdkUi.startCamera(
      function(result) {
        console.log('Camera result: ' + JSON.stringify(result));
        setCurrentDocumentImage(result);
      },
      sdkErrorCallback, options
  );
}

function startCroppingUi() {
  if (!hasDocumentImage()) { return; }

  var options = {
    imageFileUri: currentDocumentImage.originalImageFileUri,
    edgeColor: '#0000ff',
    quality: jpgQuality
  };

  ScanbotSdkUi.startCropping(
      function(result) {
        console.log('Cropping result: ' + JSON.stringify(result));
        setCurrentDocumentImage(result);
      },
      sdkErrorCallback, options
  );
}

function applyImageFilter() {
  if (!hasDocumentImage()) { return; }

  var options = {
    imageFileUri: currentDocumentImage.imageFileUri,
    imageFilter: ScanbotSdk.ImageFilter.BINARIZED,
    quality: jpgQuality
  };

  ScanbotSdk.applyImageFilter(
      function(result) {
        console.log('Image filter result: ' + JSON.stringify(result));
        setCurrentDocumentImage(result);
      },
      sdkErrorCallback, options
  );
}

function checkPrepareOcrFiles() {
  ScanbotSdk.getOcrConfigs(
      function(result) {
        console.log('OCR configs: ' + JSON.stringify(result));
        if (result.installedLanguages.length < ocrLanguages.length) {
          copyOcrFiles(result.languageDataPath);
        } else {
          console.log('Installed OCR languages: ' + result.installedLanguages);
        }
      }, sdkErrorCallback, {}
  );
}

function copyOcrFiles(languageDataPath) {
  window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + '/www/my-tessdata', function(sourceDir) {
    window.resolveLocalFileSystemURL(languageDataPath, function(targetDir) {
      sourceDir.createReader().readEntries(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isFile) {
              console.log("Copying file " + entry.fullPath);
              entry.copyTo(targetDir);
            }
          });
      }, fileSysErrorCallback);
    },fileSysErrorCallback);
  }, fileSysErrorCallback);
}

function fileSysErrorCallback(error) {
  console.log('File system error: ' + JSON.stringify(error));
  alert('File system error: ' + JSON.stringify(error));
}

function performOcr() {
  if (!hasDocumentImage()) { return; }

  var ocrButton = document.getElementById('perform-ocr-button');
  ocrButton.innerHTML = 'Performing OCR ...';
  ocrButton.setAttribute('disabled', 'disabled');

  var options = {
    images: [currentDocumentImage.imageFileUri],
    languages: ocrLanguages,
    outputFormat: ScanbotSdk.OcrOutputFormat.FULL_OCR_RESULT
  };
  ScanbotSdk.performOcr(
      function(result) {
        console.log('OCR result: ' + JSON.stringify(result));

        alert('Please see the OCR results in the console logs. ' +
          (result.pdfFileUri ? '\n\nThe OCR result PDF file can be found here: ' + result.pdfFileUri : ''));

        ocrButton.innerHTML = 'Perform OCR';
        ocrButton.removeAttribute('disabled');
      },
      sdkErrorCallback, options
  );

}

function hasDocumentImage() {
  if (!currentDocumentImage.imageFileUri) {
    alert('Please snap an image via Camera UI.');
    return false;
  }
  return true;
}


function setCurrentDocumentImage(sdkResult) {
  if (hasField(sdkResult, 'imageFileUri') && sdkResult.imageFileUri) {
    currentDocumentImage.imageFileUri = sdkResult.imageFileUri;
  }
  if (hasField(sdkResult, 'originalImageFileUri') && sdkResult.originalImageFileUri) {
    currentDocumentImage.originalImageFileUri = sdkResult.originalImageFileUri;
  }
  if (currentDocumentImage.imageFileUri !== '') {
    document.getElementById('image-result').setAttribute('src', currentDocumentImage.imageFileUri);
  }
}

function hasField(obj, fieldName) {
  return Object.keys(obj).indexOf(fieldName) != -1;
}
