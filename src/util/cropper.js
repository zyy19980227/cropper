import Cropper from "cropperjs";

// 删除图标base64
const closeSrc =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAUZJREFUOE+lkztOw0AYhOf3KyZSCqghriLHQTSUVHQ0XIKWE4BEAaLiBNRcgpZbhCRVcEBKBxLKg3W8P9ooa60fERJ259XON//O7BJqflRTjwwwDLxPZm6EcbJHwLIKPAr8e2Z5DcJ3+CZ21Z4M8Np2ZwRqgpGmLbF/2MfUhCixZHmzWRPdWDRyAPUzaHsrADYAORfi6HiKvlo3xcxYRRPhangpAw0hZun5yUki/HPtzICINs5bAeYkBGYGrU0IvAjjpFnMZmsLo7aXSsBSAgYvozjZqQq2ElAIbM2g1L0IP2ZPf05gionwxYyWCpYBOJZz2RnPH01IboKiWHdttAMp7ave++KhFOI2sd5oQmzLuuuMl7e5ezAIPAGGq8bWzsXzZhUDaRgLJwcYHjSemeRpt6IqE6SMpKSX3uTnrHQT//Owar/GX3nJnRFl79BcAAAAAElFTkSuQmCC";
export default class CropperItem {
  constructor(src) {
    // cropper实例
    this.cropper = null;
    // cropper的容器
    this.container = null;
    // 当前操作类型 (move-->移动图像,select-->选择区域,none-->禁止任何操作)
    this.action = "move";
    // 图片的移动距离
    this.transform = {
      x: 0,
      y: 0,
    };
    // 当前active的裁剪框
    this.activeIndex = null;
    // 定时器
    this.timer = null;
    // 初始化
    this.init(src);
  }

  init(src) {
    const image = new Image();
    image.src = src;
    this.cropper = new Cropper(image, {
      container: ".cropper-container",
      // 实例初始化模板 detail: https://fengyuanchen.github.io/cropperjs/v2/zh/api/
      // cropper-handle的theme-color为active的裁剪框的内部透明背景色
      template: `<cropper-canvas style="height:100%" background>
          <cropper-image></cropper-image>
          <cropper-handle action="select" plain></cropper-handle>
          <cropper-selection class="selection" initial-coverage="0" movable resizable zoomable multiple>
            <img title="删除" class="delete" style="position:absolute;top:-17px;right:-20px;z-index:1000;cursor:pointer;" src="${closeSrc}" />
            <cropper-grid role="grid" bordered covered></cropper-grid>
            <cropper-crosshair theme-color="rgba(238, 238, 238, 0.5)" centered></cropper-crosshair>
            <cropper-handle class="inner" action="move" theme-color="rgba(255, 255, 255, 0.15)"></cropper-handle>
            <cropper-handle action="n-resize"></cropper-handle>
            <cropper-handle action="e-resize"></cropper-handle>
            <cropper-handle action="s-resize"></cropper-handle>
            <cropper-handle action="w-resize"></cropper-handle>
            <cropper-handle action="ne-resize"></cropper-handle>
            <cropper-handle action="nw-resize"></cropper-handle>
            <cropper-handle action="se-resize"></cropper-handle>
            <cropper-handle action="sw-resize"></cropper-handle>
          </cropper-selection>
        </cropper-canvas>`,
    });
    this.container = this.cropper.container;
    const selection = this.cropper.getCropperSelections()[0];
    selection.hidden = true;
    this.setAction("move");
    this.listenCanvasEvent();
    this.listerImageEvent();
  }

  // 禁用所有操作
  disable() {
    if (this.cropper) {
      const canvas = this.cropper.getCropperCanvas();
      canvas.disabled = true;
    }
  }

  // 恢复所有操作
  enable() {
    if (this.cropper) {
      const canvas = this.cropper.getCropperCanvas();
      canvas.disabled = false;
    }
  }

  // 设置操作类型
  setAction(action) {
    if (this.container) {
      const handle = this.container.querySelector("cropper-handle");
      handle.action = action;
      this.action = action;
      return action;
    }
  }

  // 获取所有有效的裁剪框
  getAllSelections() {
    if (this.cropper) {
      const res = [];
      const selections = this.cropper.getCropperSelections();
      for (let i = 0; i < selections.length; i++) {
        if (selections[i].width && selections[i].height && !selections.hidden) {
          res.push(selections[i]);
        }
      }
      return res;
    }
  }

  // 获取隐藏的裁剪框
  getHiddenSelection() {
    if (this.cropper) {
      let res;
      const selections = this.cropper.getCropperSelections();
      for (let i = 0; i < selections.length; i++) {
        if (selections[i].hidden === true) {
          res = selections[i];
          break;
        }
      }
      return res;
    }
  }

  // 监听图片的移动开始和移动结束事件
  listenCanvasEvent() {
    if (this.cropper) {
      const canvas = this.cropper.getCropperCanvas();
      // 开始移动，清空所有裁剪框的active状态，避免鼠标碰到active的裁剪框导致移位，并保存当前active的裁剪框的index
      canvas.addEventListener("actionstart", (e) => {
        const {
          detail: {
            action,
            relatedEvent: { target },
          },
        } = e;
        const { className } = target;
        // 判断触发元素的class避免与裁剪框内部的事件冲突
        if (action === "move" && className !== "inner") {
          const selections = this.getAllSelections();
          selections.forEach((selection, index) => {
            if (selection.active) {
              this.activeIndex = index;
            }
            selection.active = false;
          });
        } else if (className === "delete" && action === "") {
          // 删除逻辑，若没有隐藏的裁剪框则隐藏该裁剪框，有则删除该裁剪框并active隐藏的裁剪框
          const selection = target.parentNode;
          const hiddenSelection = this.getHiddenSelection();
          const currentASction = this.action;
          if (!hiddenSelection) {
            selection.hidden = true;
            selection.width = 0;
            selection.height = 0;
          } else {
            const canvas = this.cropper.getCropperCanvas();
            canvas.removeChild(selection);
            hiddenSelection.active = true;
          }
          // 防止快速点击误操作
          this.setAction("none");
          // 恢复当前操作类型
          setTimeout(() => {
            this.setAction(currentASction);
          }, 500);
        }
      });
      // 结束移动，根据图片移动距离移动所有裁剪框，并根据activeIndex恢复对应的裁剪框的active状态，并清空图片移动距离
      canvas.addEventListener("actionend", (e) => {
        const {
          detail: { action },
        } = e;
        if (action === "move") {
          const selections = this.getAllSelections();
          selections.forEach((selection, index) => {
            selection.$move(this.transform.x, this.transform.y);
            if (this.activeIndex !== null && index === this.activeIndex) {
              selection.active = true;
            }
          });
          this.transform.x = 0;
          this.transform.y = 0;
        }
      });
    }
  }

  // 监听图片的变化：移动时记录移动距离，缩放时置所有裁剪框的状态为active（只有active的裁剪框会同步图片缩放）
  listerImageEvent() {
    if (this.cropper) {
      const image = this.cropper.getCropperImage();
      image.addEventListener("transform", (e) => {
        this.timer && clearTimeout(this.timer);
        const {
          detail: { matrix, oldMatrix },
        } = e;
        // 缩放参数无变化（图片移动）
        if (matrix[0] === oldMatrix[0] && matrix[3] === oldMatrix[3]) {
          this.transform.x += matrix[4] - oldMatrix[4];
          this.transform.y += matrix[5] - oldMatrix[5];
        } else {
          // 缩放参数变化（图片缩放）
          this.transform.x = 0;
          this.transform.y = 0;
          const selections = this.getAllSelections();
          selections.forEach((selection, index) => {
            if (!selection.active) {
              selection.active = true;
            } else {
              if (this.activeIndex === null) {
                // 只记录第一次，避免之后的覆盖
                this.activeIndex = index;
              }
            }
          });
          // 延时恢复裁剪框状态
          this.timer = setTimeout(() => {
            selections.forEach((selection, index) => {
              selection.active = false;
              if (this.activeIndex !== null && index === this.activeIndex) {
                selection.active = true;
                // 恢复状态后清空active
                this.activeIndex = null;
              }
            });
          }, 500);
        }
      });
    }
  }

  // 获取所有裁剪框内图片的base64信息
  async getImageData() {
    const selections = this.getAllSelections();
    const res = [];
    for (let i = 0; i < selections.length; i++) {
      const canvas = await selections[i].$toCanvas();
      const base64url = canvas.toDataURL("image/png");
      res.push(base64url);
    }
    return res;
  }
}
