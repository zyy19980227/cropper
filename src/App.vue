<template>
  <div class="wrapper" id="wrapper">
    <div class="action">
      <button v-if="action === 'move'" @click="start">开始框选</button>
      <button v-if="action === 'select'" @click="end">结束框选</button>
      <button @click="run">获取图像</button>
    </div>
    <div class="cropper-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import CropperItem from "./util/cropper";
import image from "./assets/image.jpg";

const cropper = ref();
const action = ref("move");

const start = () => {
  action.value = cropper.value.setAction("select");
};

const end = () => {
  action.value = cropper.value.setAction("move");
};

const init = () => {
  cropper.value = new CropperItem(image);
};

const run = async () => {
  const urls = await cropper.value.getImageData();
  console.log(urls);
};

onMounted(() => {
  init();
});
</script>

<style lang="less" scoped>
.wrapper {
  width: 100%;
  height: 100vh;
  .action {
    width: 100%;
    height: 36px;
    background: #fff;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    padding-left: 5px;
    padding-right: 5px;
    button {
      &:not(:first-child) {
        margin-left: 10px;
      }
    }
  }
  .cropper-container {
    height: 100%;
    width: 100%;
    .canvas {
      height: 100%;
    }
  }
}
</style>

<style lang="less">
// 边框颜色
cropper-selection {
  outline: 2px dashed #fff !important;
}
// 边框的拖拽点的颜色
cropper-canvas {
  cropper-selection {
    cropper-handle::after {
      background: red !important;
    }
  }
}
</style>
