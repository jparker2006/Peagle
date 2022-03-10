var HashThis = (sText, nRounds) => {
    for (let x = 0; x < nRounds; x++) {
        sText = sha3_256(sText);
    }
    return sText;
}

function setCookie(c_name, value, exdays) {
  var exdate=new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value=escape(value) + ((exdays===null) ? '' : '; expires='+exdate.toUTCString());
  document.cookie=c_name + '=' + c_value;
}

function getCookie(c_name) {
  var i,x,y,ARRcookies = document.cookie.split(';');
  for (i=0;i<ARRcookies.length;i++) {
    x=ARRcookies[i].substr(0,ARRcookies[i].indexOf('='));
    y=ARRcookies[i].substr(ARRcookies[i].indexOf('=')+1);
    x=x.replace(/^\s+|\s+$/g,'');
    if (x===c_name)
      return unescape(y);
  }
}

function postFileFromServer(url, sData, doneCallback) {
    var xhr;
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = handleStateChange;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(sData);
    function handleStateChange() {
        if (xhr.readyState === 4) {
            doneCallback(xhr.status == 200 ? xhr.responseText : null);
        }
    }
}

function getRandomInt(min, max) {
    var rval = 0;
    var range = max - min;
    var bits_needed = Math.ceil(Math.log2(range));
    if (bits_needed > 53) {
        throw new Exception("We cannot generate numbers larger than 53 bits.")
    }
    var bytes_needed = Math.ceil(bits_needed / 8);
    var mask = Math.pow(2, bits_needed) - 1;
    var byteArray = new Uint8Array(bytes_needed);
    window.crypto.getRandomValues(byteArray);
    var p = (bytes_needed - 1) * 8;
    for (var i = 0; i < bytes_needed; i += 1) {
        rval += byteArray[i] * Math.pow(2, p);
        p -= 8
    }
    rval = rval & mask;
    if (rval >= range) {
        return getRandomInt(min, max);
    }
    return min + rval;
}

function GetRandomCharacter() {
    var sChar = ["a","b","c","d","e",
        "f","g","h","i","j","k","l","m",
        "n","o","p","q","r","s","t","u",
        "v","w","x","y","z",
        "A","B","C","D","E","F","G","H",
        "I","J","K","L","M","N","O","P",
        "Q","R","S","T","U","V","W","X",
        "Y","Z",
        "0","1","2","3","4","5","6","7",
        "8","9","-","~","@",".","*","(",
        ")","_","+","#","="];
    return sChar[getRandomInt(0, sChar.length - 1)]
}

