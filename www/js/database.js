const dataStorage = window.localStorage;
const utc = new Date().toJSON()
const timeStamp = utc.slice(0, 10).replace(/-/g, '') + utc.slice(11, 13);


if (!dataStorage.length) {
    readSample();
}

if (navigator.connection.type != 'none' && timeStamp - getData('lastUpdate') >= 6) {
    updateData();
}

function readSample() {
    for (const [alias, currency] of Object.entries(sampleData)) {
        storeData(alias, currency);
    }
}

function updateData() {
    const Http = new XMLHttpRequest();
    const url = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

    Http.open("GET", url);
    Http.send();

    Http.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const xmlDoc = Http.responseXML;
            xmlParser(xmlDoc);
        }
    }
}

function xmlParser(xml) {
    const xmlData = xml.getElementsByTagName("Cube");
    storeData('date', xmlData[1].getAttribute('time'));
    storeData('lastUpdate', timeStamp);
    for (let line = 2; line < xmlData.length; line++) {
        var currency = xmlData[line].getAttribute('currency');
        var rate = xmlData[line].getAttribute('rate');
        storeData(currency, rate)
    }
}

function storeData(key, value) {
    window.localStorage.setItem(key, value);
}

function clearData() {
    dataStorage.clear();
}

function getData(arg) {
    const value = dataStorage.getItem(arg);
    let out = value.split(",")
    out.length == 1 ? out = out[0] : out;
    return out;
}


