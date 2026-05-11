let capture;
let poseNet;
let poses = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 使用 floor 確保數值為整數，避免某些瀏覽器報 NotFoundError
  let captureW = floor(windowWidth * 0.5);
  let captureH = floor(windowHeight * 0.5);

  // 建立攝影機擷取，並加入錯誤處理
  capture = createCapture(VIDEO, (stream) => {
    console.log('攝影機已啟動');
  });
  capture.size(captureW, captureH);
  // 隱藏預設產生的 HTML5 影片元件，我們要在 canvas 裡繪製
  capture.hide();

  // 初始化 PoseNet 模型
  // 檢查 ml5 是否正確載入
  if (typeof ml5 !== 'undefined') {
    poseNet = ml5.poseNet(capture, () => console.log('模型已載入'));
    poseNet.on('pose', (results) => {
      poses = results;
    });
  } else {
    console.error('錯誤：找不到 ml5 程式庫，請確保 HTML 中已引入 ml5.js');
  }
}

function draw() {
  background('#e7c6ff');

  let w = width * 0.5;
  let h = height * 0.5;

  push();
  // 將座標原點移至畫布中心
  translate(width / 2, height / 2);
  // 水平翻轉以達到左右顛倒（鏡像）效果
  scale(-1, 1);
  // 繪製影像，起點設在負的一半寬高處以確保中心對齊
  image(capture, -w / 2, -h / 2, w, h);

  // 繪製耳垂位置的黃色圓圈 (在 push/pop 內，座標會隨 scale(-1, 1) 自動翻轉)
  if (poses.length > 0) {
    for (let i = 0; i < poses.length; i++) {
      let pose = poses[i].pose;
      // 設定填色為黃色
      fill(255, 255, 0);
      noStroke();

      // 使用 map 函數確保偵測點座標能精確對應到畫面上顯示的大小 (w, h)
      // 並加入信心值 (confidence) 檢查，避免圓圈閃爍或跳動
      let confThreshold = 0.5; 
      
      // 將偵測到的座標轉換為畫布上的相對位置並繪製圓圈
      // 由於在 push/pop 內已經處理了翻轉與置中，座標需減去 w/2 與 h/2
      if (pose.leftEar && pose.leftEar.confidence > confThreshold) {
        let lx = map(pose.leftEar.x, 0, capture.width, -w / 2, w / 2);
        let ly = map(pose.leftEar.y, 0, capture.height, -h / 2, h / 2);
        ellipse(lx, ly, 20);
      }
      if (pose.rightEar && pose.rightEar.confidence > confThreshold) {
        let rx = map(pose.rightEar.x, 0, capture.width, -w / 2, w / 2);
        let ry = map(pose.rightEar.y, 0, capture.height, -h / 2, h / 2);
        ellipse(rx, ry, 20);
      }
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
