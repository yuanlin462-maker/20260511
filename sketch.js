let capture;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 建立攝影機擷取
  capture = createCapture(VIDEO);
  // 設定擷取影像的基礎解析度
  capture.size(windowWidth * 0.5, windowHeight * 0.5);
  // 隱藏預設產生的 HTML5 影片元件，我們要在 canvas 裡繪製
  capture.hide();
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
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
