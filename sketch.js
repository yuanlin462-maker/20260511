let capture;
let poseNet;
let poses = [];
let handpose;
let hands = [];
let earringImgs = [];
let currentEarringIndex = 0; // 預設顯示第一款耳環

function preload() {
  // 載入「耳環圖片」目錄下的 5 款耳環圖片
  for (let i = 1; i <= 5; i++) {
    let imgPath = '耳環圖片/acc' + i + '_ring.png';
    earringImgs.push(loadImage(imgPath, 
      () => console.log(imgPath + ' 載入成功'),
      () => console.error(imgPath + ' 載入失敗，請確認資料夾名稱是否為「耳環圖片」並包含此檔案')
    ));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 使用 floor 確保數值為整數，避免某些瀏覽器報 NotFoundError
  let captureW = floor(windowWidth * 0.5);
  let captureH = floor(windowHeight * 0.5);

  // 建立攝影機擷取，並加入錯誤處理
  capture = createCapture(VIDEO, (stream) => {
    console.log('攝影機授權成功並啟動');
  });
  capture.size(captureW, captureH);
  // 隱藏預設產生的 HTML5 影片元件，我們要在 canvas 裡繪製
  capture.hide();

  // 初始化 PoseNet 模型
  // 檢查 ml5 是否正確載入
  if (typeof ml5 !== 'undefined') {
    // 確保 capture 存在後再啟動模型
    if (capture) {
      poseNet = ml5.poseNet(capture, { flipHorizontal: false }, () => {
        console.log('模型已載入');
      });
    }
    
    // 當偵測到人體關鍵點時，更新 poses 變數
    poseNet.on('pose', (results) => {
      poses = results;
    });

    // 初始化 Handpose 模型用於手指辨識
    handpose = ml5.handpose(capture, () => console.log('手勢辨識模型已載入'));
    handpose.on('predict', results => {
      hands = results;
    });
  } else {
    console.error('錯誤：找不到 ml5 程式庫，請確保 HTML 中已引入 ml5.js');
  }
}

function draw() {
  background('#e7c6ff');

  let w = width * 0.5;
  let h = height * 0.5;
  let detectedFingers = 0;

  // 偵測手勢並更新耳環索引 (確保 hands[0] 存在且有 landmarks)
  if (hands.length > 0 && hands[0].landmarks) {
    detectedFingers = countFingers(hands[0]);
    // 如果偵測到 1~5 根手指，更新當前耳環索引
    if (detectedFingers >= 1 && detectedFingers <= 5) {
      currentEarringIndex = detectedFingers - 1;
    }
  }

  // 在左上角顯示除錯資訊
  push();
  fill(255, 0, 0);
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  text('偵測手指數量: ' + detectedFingers, 10, 10);
  text('目前使用款式: acc' + (currentEarringIndex + 1), 10, 40);
  pop();

  push();
  // 將座標原點移至畫布中心
  translate(width / 2, height / 2);
  // 水平翻轉以達到左右顛倒（鏡像）效果
  scale(-1, 1);
  // 繪製影像，起點設在負的一半寬高處以確保中心對齊
  image(capture, -w / 2, -h / 2, w, h);

  // 根據手勢選取要顯示的圖片
  let activeEarring = (earringImgs.length > currentEarringIndex) ? earringImgs[currentEarringIndex] : null;

  // 繪製耳垂位置的黃色圓圈 (在 push/pop 內，座標會隨 scale(-1, 1) 自動翻轉)
  if (poses.length > 0) {
    for (let i = 0; i < poses.length; i++) {
      let pose = poses[i].pose;
      // 加入信心值 (confidence) 檢查，門檻設為 0.5
      let confThreshold = 0.5;
      
      // 設定圖片繪製模式為中心
      imageMode(CENTER);
      
      // 辨識左耳與右耳點位
      if (pose.leftEar && pose.leftEar.confidence > confThreshold) {
        // 將攝影機原始座標映射到畫布繪製區域的範圍 (-w/2 到 w/2)
        let lx = map(pose.leftEar.x, 0, capture.width, -w / 2, w / 2);
        let ly = map(pose.leftEar.y, 0, capture.height, -h / 2, h / 2);
        // 檢查圖片是否載入成功 (寬度 > 1 表示載入成功) 且確認 capture 已準備好
        if (activeEarring && activeEarring.width > 1 && capture.width > 0) {
          image(activeEarring, lx, ly, 40, 40);
        }
      }
      if (pose.rightEar && pose.rightEar.confidence > confThreshold) {
        let rx = map(pose.rightEar.x, 0, capture.width, -w / 2, w / 2);
        let ry = map(pose.rightEar.y, 0, capture.height, -h / 2, h / 2);
        if (activeEarring && activeEarring.width > 1 && capture.width > 0) {
          image(activeEarring, rx, ry, 40, 40);
        }
      }
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 計算伸出的手指數量 (基於 MediaPipe Handpose 關鍵點)
function countFingers(hand) {
  let landmarks = hand.landmarks;
  let count = 0;
  
  // 檢查食指、中指、無名指、小指 (指尖 Y 座標小於第二指節 Y 座標代表伸出)
  if (landmarks[8][1] < landmarks[6][1]) count++;   // 食指
  if (landmarks[12][1] < landmarks[10][1]) count++; // 中指
  if (landmarks[16][1] < landmarks[14][1]) count++; // 無名指
  if (landmarks[20][1] < landmarks[18][1]) count++; // 小指
  
  // 大拇指辨識：檢查大拇指尖(4)與大拇指根部(2)的水平偏移
  let thumbIsOut = Math.abs(landmarks[4][0] - landmarks[2][0]) > Math.abs(landmarks[5][0] - landmarks[17][0]) * 0.4;
  if (thumbIsOut) count++;

  return count;
}
