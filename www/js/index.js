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


// Now we need to run the code that will be executed only for About page.

// Option 1. Using page callback for page (for "about" page in this case) (recommended way):
myApp.onPageInit('about', function (page) {
    // Do something here for "about" page

})

// Option 2. Using one 'pageInit' event handler for all pages:
$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;

    if (page.name === 'about') {
        // Following code will be executed for page with data-page attribute equal to "about"
        myApp.alert('Here comes About page');
    }
})

// Option 2. Using live 'pageInit' event handlers for each page
$$(document).on('pageInit', '.page[data-page="about"]', function (e) {
    // Following code will be executed for page with data-page attribute equal to "about"
    myApp.alert('Here comes About page');
})

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
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  }

};

app.initialize();


var currentDocumentImage = { imageFileUri: '', originalImageFileUri: '' };
var ocrLanguages = ["en", "de"];
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