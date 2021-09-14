
let roiRect;
const gridXY = [3, 5];

function openCvReady() {

    cv['onRuntimeInitialized'] = () => {
        setTimeout(navigator.splashscreen.hide, 100);
        roiRect = getRoi();
        let img = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        let gray = new cv.Mat();
        let imgRoi = new cv.Mat();
        let median = new cv.Mat();
        let thresh = new cv.Mat();
        let sgmt = new cv.Mat();
        let label = new cv.Mat();
        let stats = new cv.Mat();
        let centroids = new cv.Mat();
        let cap = new cv.VideoCapture(video);

        const FPS = 10;
        function processVideo() {
            let begin = Date.now();
            cap.read(img);
            imgRoi = img.roi(roiRect);
            cv.cvtColor(imgRoi, gray, cv.COLOR_RGBA2GRAY);
            cv.medianBlur(gray, median, 5);
            cv.threshold(median, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
            auto_inv(thresh);
            cv.connectedComponentsWithStats(thresh, label, stats, centroids, 8, cv.CV_32S);
            let statsArray = statsToArray(stats);
            let filtered = statFilter(statsArray);

            let num = "";
            let acc = [];

            if (filtered[0].length) {
                let toSegments = thresh.clone();
                filtered[0].forEach(segment => {
                    sgmt = toSegments.roi(new cv.Rect(...segment));
                    let result = detect(sgmt);
                    num += result[0];
                    acc.push(result[1]);
                });
            }

            (num.length && math.mean(acc) >= 65) ? updateValues(outputFilter(num, filtered[1])) : updateValues(0);
            setTimeout(processVideo, 100);
        }
        setTimeout(processVideo, 0);
    };
}

function outputFilter(num, dec) {
    num.startsWith('.') ? num = num.slice(1) : false;
    num.endsWith('.') ? num = num.slice(0, num.length - 1) : false;
    if (num.includes(".")) {
        let parts = num.split('.');
        let lastElement = parts[parts.length - 1];
        if (lastElement.length >= 3 || !lastElement.length) {
            return num.replaceAll('.', '');
        }
        else {
            return `${num.slice(0, num.length - lastElement.length).replaceAll('.', '')}.${lastElement}`;
        }
    }
    else {
        return num;
    }
}

function getRoi() {
    const videoElementWidth = video.offsetWidth;
    const videoElementHeight = Math.round(document.body.offsetHeight * 0.988 * 0.64 * 0.89);
    const roiHeight = Math.round(videoElementHeight / videoElementWidth * video.width / 2) * 2;
    return new cv.Rect(0, (video.height - roiHeight) / 2, video.width, roiHeight);
}

function auto_inv(frame) {
    (cv.countNonZero(frame) / (frame.cols * frame.rows)) > 0.5 ? cv.bitwise_not(frame, frame) : false;
}

function statsToArray(stats) {
    return math.reshape(Array.from(stats.data32S), [stats.rows, stats.cols]).slice(1).map(i => i.slice(0, 4));
}

function statFilter(stats) {
    let decimalIndex = 0;
    stats = nanoFilter(edgeFilter(stats));
    if (stats.length >= 2) {
        const maxHeight = math.max(math.column(stats, 3));
        let big = sizeFilter(stats, maxHeight);

        let xMin = math.min(math.column(big, 0));
        let yMin = math.min(math.column(big, 1)) - maxHeight * 0.1;
        let yMax = math.max(math.add(math.column(big, 1), math.column(big, 3))) + maxHeight * 0.1;

        stats = stats.filter(e => e[0] >= xMin);
        stats = stats.filter(e => e[1] >= yMin);
        stats = stats.filter(e => (e[1] + e[3]) <= yMax);
        stats = rightFilter(stats, maxHeight);

        if (stats.length >= 3) {
            decimalIndex = findDecimal(stats);
        }
    }
    return [stats.slice(0, 8), decimalIndex];
}

function edgeFilter(stats) {
    return stats.filter(e => !e.includes(0) && (roiRect.width - e[0] - e[2]) && (roiRect.height - e[1] - e[3]));
}

function nanoFilter(stats) {
    return stats.filter(e => e[2] > gridXY[0] && e[3] > gridXY[1]);
}

function sizeFilter(stats, maxHeight) {
    return stats.filter(e => e[3] >= maxHeight * 0.9);
}

function rightFilter(stats, maxHeight) {
    if (stats.length >= 2) {
        stats.sort((a, b) => a[0] - b[0]);
        const spaceBetween = math.subtract(math.column(stats, 0).slice(1), (math.add(math.column(stats, 0).slice(0, -1), math.column(stats, 2).slice(0, -1))));
        const lastChar = spaceBetween.findIndex(e => e > maxHeight * 0.38);
        if (lastChar != -1) {
            stats = stats.slice(0, lastChar + 1);
        }
    }
    return stats;
}

function findDecimal(stats) {
    const heights = math.column(stats, 3);
    let smallIndex = heights.findIndex(e => e <= math.max(heights) * 0.8);
    if (smallIndex == -1) {
        smallIndex = 0;
    }
    return smallIndex;
}

function detect(sgmt) {
    resizeSegment(sgmt);
    let sgmtData = normalizeData(segmentToData(sgmt));
    return decoder(sgmtData);
}

function resizeSegment(sgmt) {
    let gridN = 0;
    let newSize = [];
    sgmt.matSize.reverse().forEach(e => {
        let remainder = e % gridXY[gridN];
        remainder ? e += gridXY[gridN] - remainder : false;
        newSize.push(e);
        gridN++;
    });
    cv.resize(sgmt, sgmt, new cv.Size(...newSize), 0, 0, cv.INTER_AREA);
    cv.threshold(sgmt, sgmt, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
}

function segmentToData(sgmt) {
    let gridN = 0;
    let slices = [];
    let steps = [];
    let dataOut = [];

    sgmt.matSize.reverse().forEach(e => {
        let step = e / gridXY[gridN];
        steps.push(step);
        slices.push(math.range(0, e, step)._data);
        gridN++;
    });

    slices[1].forEach(i => {
        slices[0].forEach(j => {
            let white = cv.countNonZero(sgmt.roi(new cv.Rect(j, i, steps[0], steps[1])));
            dataOut.push(math.round(white / math.prod(steps) * 100));
        });
    });
    return dataOut;
}

function normalizeData(sgmtData) {
    const minimum = math.min(sgmtData);
    const maximum = math.max(sgmtData);
    if (minimum != maximum) {
        return math.round(sgmtData.map(e => (e - minimum) / (maximum - minimum) * 100));
    }
    else {
        return sgmtData;
    }
}

function decoder(sgmtData) {
    let diff = [];
    data.forEach(line => {
        diff.push(math.sum(math.abs(math.subtract(line.slice(1), sgmtData))));
    });
    const diffMin = math.min(diff);
    return [data[diff.indexOf(diffMin)][0], math.round(100 - (diffMin / math.max(diff) * 100))];
}

