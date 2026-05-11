let capture;
let poseNet;
let poses = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 建立攝影機擷取
  capture = createCapture(VIDEO);
  // 設定擷取影像的基礎解析度
  capture.size(windowWidth * 0.5, windowHeight * 0.5);
  // 隱藏預設產生的 HTML5 影片元件，我們要在 canvas 裡繪製
  capture.hide();

  // 初始化 PoseNet 模型
  poseNet = ml5.poseNet(capture, () => console.log('模型已載入'));
  // 當偵測到人體關鍵點時，更新 poses 變數
  poseNet.on('pose', (results) => {
    poses = results;
  });
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

  // 繪製耳垂位置的黃色圓圈
  if (poses.length > 0) {
    for (let i = 0; i < poses.length; i++) {
      let pose = poses[i].pose;
      // 設定填色為黃色
      fill(255, 255, 0);
      noStroke();
      
      // 將偵測到的座標轉換為畫布上的相對位置並繪製圓圈
      // 由於在 push/pop 內已經處理了翻轉與置中，座標需減去 w/2 與 h/2
      if (pose.leftEar) {
        ellipse(pose.leftEar.x - w / 2, pose.leftEar.y - h / 2, 20);
      }
      if (pose.rightEar) {
        ellipse(pose.rightEar.x - w / 2, pose.rightEar.y - h / 2, 20);
      }
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
