<template>
  <div class="panel_container">
    <!--  数据集选择  -->
    <div class="data-setting-item">
      <p>Selected dataset:</p>
      <a-select v-model="dataSetValue" size="small" :style="{ width: '120px' }" :options="dataSetOptions"/>
    </div>
    <!--  模型选择  -->
<!--    <div class="data-setting-item" v-show="dataSetValue === 'MNIST'">-->
<!--      <p>Selected model:</p>-->
<!--      <a-select v-model="modalSetValue" size="small" :style="{ width: '120px' }" :options="modalSetOptions"/>-->
<!--    </div>-->
    <!--  属性选择  -->
    <div class="data-setting-item">
      <p>Selected attribute:</p>
      <a-select v-model="attributeSetValue" size="small" :style="{ width: '120px' }" :options="attributeSetOptions"/>
    </div>
    <!--  采样样本数量选择  -->
<!--    <div class="data-setting-item">-->
<!--      <p>Sample Number:</p>-->
<!--      <a-slider v-model="sampleNumber" :style="{ width: '90px' }" :min="50" :max="500" :step="10" @change="handleChangeSampleNumberSlider"/>-->
<!--      <p>{{ sampleNumber }}</p>-->
<!--    </div>-->
    <!--  分辨率选择  -->
<!--    <div class="data-setting-item">-->
<!--      <p>Resolution:</p>-->
<!--      <a-slider v-model="resolutionNumber" :style="{ width: '90px' }" :min="40" :max="200" :step="20" @change="handleChangeResolutionSlider"/>-->
<!--      <p>{{ resolutionNumber }} × {{ resolutionNumber }}</p>-->
<!--    </div>-->
    <!--  是否显示原始点  -->
<!--    <div class="data-setting-item" style="width: 150px">-->
<!--      <p>Show Centroids:</p>-->
<!--      <a-switch v-model="isShowCentroids" checked-value="true" unchecked-value="false"/>-->
<!--    </div>-->
<!--    <div class="data-setting-item" style="width: 150px">-->
<!--      <p>Show Map:</p>-->
<!--      <a-switch v-model="isShowMap" checked-value="true" unchecked-value="false"/>-->
<!--    </div>-->
    <!--  交互式按钮  -->
    <a-button-group class="button_group">
      <!-- 放大按钮 -->
      <a-tooltip content="Zoom In" position="bottom">
        <a-button :style="{ width: '35px', height: '35px' }" @click="handleClickZoomIn"><i class="bi bi-zoom-in"></i></a-button>
      </a-tooltip>
      <!-- 缩小按钮 -->
      <a-tooltip content="Zoom Out" position="bottom">
        <a-button :style="{ width: '35px', height: '35px' }" @click="handleClickZoomOut"><i class="bi bi-zoom-out"></i></a-button>
      </a-tooltip>
      <!-- 选框放大按钮 -->
      <a-tooltip content="Box Zoom" position="bottom">
        <a-button :style="{ width: '35px', height: '35px', background: $store.state.isClickBoxZoom? '#165dff': '#f2f3f5'}" @click="handleClickBoxZoom">
          <i :style="{ color: $store.state.isClickBoxZoom ? 'white': ''}" class="bi bi-plus-square"></i>
        </a-button>
      </a-tooltip>
      <!-- 平移按钮 -->
      <a-tooltip content="Pan" position="bottom">
        <a-button :style="{ width: '35px', height: '35px', background: $store.state.isClickPan? '#165dff': '#f2f3f5' }" @click="handleClickPan">
          <i :style="{ color: $store.state.isClickPan ? 'white': ''}" class="bi bi-arrows-move"></i>
        </a-button>
      </a-tooltip>
      <!-- 刷子按钮 -->
<!--      <a-tooltip content="Box Select" position="bottom">-->
<!--        <a-button :style="{ width: '35px', height: '35px', background: $store.state.isClickBoxSelect? '#165dff': '#f2f3f5' }" @click="handleClickBoxSelect">-->
<!--          <i :style="{ color: $store.state.isClickBoxSelect ? 'white': ''}" class="bi bi-fullscreen"></i>-->
<!--        </a-button>-->
<!--      </a-tooltip>-->
      <!-- 定位点按钮 -->
      <a-tooltip content="Click Select" position="bottom">
        <a-button :style="{ width: '35px', height: '35px', background: $store.state.isClickSelect? '#165dff': '#f2f3f5' }" @click="handleClickSelect">
          <i :style="{ color: $store.state.isClickSelect ? 'white': ''}" class="bi bi-geo-alt"></i>
        </a-button>
      </a-tooltip>
      <!-- 画线对比按钮 -->
      <a-tooltip content="Line Select" position="bottom">
        <a-button :style="{ width: '35px', height: '35px', background: $store.state.isClickLineSelect? '#165dff': '#f2f3f5' }" @click="handleClickLineSelect">
          <i :style="{ color: $store.state.isClickLineSelect ? 'white': ''}" class="bi bi-slash-lg"></i>
        </a-button>
      </a-tooltip>
      <!-- 浏览邻域按钮 -->
<!--      <a-tooltip content="Neighborhood View" position="bottom">-->
<!--        <a-button :style="{ width: '35px', height: '35px', background: $store.state.isClickNeighborhoodView? '#165dff': '#f2f3f5' }" @click="handleClickNeighborhoodView">-->
<!--          <i :style="{ color: $store.state.isClickNeighborhoodView ? 'white': ''}" class="bi bi-view-list"></i>-->
<!--        </a-button>-->
<!--      </a-tooltip>-->
      <!-- 清除记录按钮 -->
      <a-tooltip content="Clear" position="bottom">
        <a-button :style="{ width: '35px', height: '35px' }" @click="handleClickClear"><i class="bi bi-eraser"></i></a-button>
      </a-tooltip>
      <!-- 设置热力图区间 -->
      <a-tooltip content="Setting Threshold" position="bottom" @click="handleClickSettingThreshold" @ok="handleOk">
        <a-button :style="{ width: '35px', height: '35px' }"><i class="bi bi-gear"></i></a-button>
      </a-tooltip>
<!--      <a-popover>-->
<!--        <a-button :style="{ width: '35px', height: '35px' }"><i class="bi bi-gear"></i></a-button>-->
<!--        <template #content>-->
<!--          &lt;!&ndash;  分辨率选择  &ndash;&gt;-->
<!--          <h4 class="modal-setting-title">Resolution Setting</h4>-->
<!--          <div class="modal-data-setting-item">-->
<!--            <a-slider v-model="resolutionNumber" :style="{ width: '150px' }" :min="40" :max="200" :step="20" @change="handleChangeResolutionSlider"/>-->
<!--            <p>{{ resolutionNumber }} × {{ resolutionNumber }}</p>-->
<!--          </div>-->
<!--          <a-divider :margin="15"/>-->
<!--          &lt;!&ndash;  阈值设置  &ndash;&gt;-->
<!--          <h4 class="modal-setting-title">Contour Setting</h4>-->
<!--          <a-space direction="vertical">-->
<!--            <a-space>-->
<!--              <a-typography-text style="width: 120px">Lower Bound:</a-typography-text>-->
<!--              <a-input-number v-model="lower_bound" :style="{width:'100px'}" class="input-demo" :min=attributeMin :max=attributeMax :step="0.01"/>-->
<!--            </a-space>-->
<!--            <a-space>-->
<!--              <a-typography-text style="width: 120px">Threshold Step:</a-typography-text>-->
<!--              <a-input-number v-model="resolution_step" :style="{width:'100px'}" class="input-demo" :min="0.01" :max="1" :step="0.01"/>-->
<!--            </a-space>-->
<!--          </a-space>-->
<!--          <a-divider :margin="15"/>-->
<!--          &lt;!&ndash;  颜色设置  &ndash;&gt;-->
<!--          <h4 class="modal-setting-title">Color Scheme</h4>-->
<!--          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px">-->
<!--            <span>low&lt;</span>-->
<!--            <div style="flex-grow: 1; height: 1px; border-top: 1px solid black; margin-top: 3px;"></div>-->
<!--            <span>&gt;high</span>-->
<!--          </div>-->
<!--          <div id="color-scale-container" style="width: 100%; text-align: center; padding-top: 2px"></div>-->
<!--        </template>-->
<!--      </a-popover>-->
    </a-button-group>
    <div class="data-setting-item" style="margin-left: 20px">
      <p>Radius:</p>
      <a-slider v-model="radiusNumber" :style="{ width: '130px' }" :min="0.1" :max="5" :step="0.1" @change="handleChangeRadiusSlider"/>
      <p>{{ radiusNumber }}</p>
    </div>
    <a-modal v-model:visible="visible" width="auto" draggable :alignCenter="false" top="150px">
      <template #title>
        Setting
      </template>
      <h4 class="modal-setting-title">Sampling</h4>
<!--      <div class="modal-data-setting-item">-->
<!--        <a-slider v-model="resolutionNumber" :style="{ width: '150px' }" :min="40" :max="200" :step="20" @change="handleChangeResolutionSlider"/>-->
<!--        <p>{{ resolutionNumber }} × {{ resolutionNumber }}</p>-->
<!--      </div>-->
      <div class="modal-data-setting-item">
        <a-slider v-model="sampleNumber" :style="{ width: '150px' }" :min="50" :max="1000" :step="10" @change="handleChangeSampleNumberSlider"/>
        <p>{{ sampleNumber }}</p>
      </div>
      <a-divider :margin="15"/>
      <!--  阈值设置  -->
      <h4 class="modal-setting-title">Contour</h4>
      <a-space direction="vertical">
        <a-space>
          <a-typography-text style="width: 120px">LowerBound :</a-typography-text>
          <a-input-number v-model="lower_bound" :style="{width:'100px'}" class="input-demo" :min=attributeMin :max=attributeMax :step="0.01"/>
        </a-space>
        <a-space>
          <a-typography-text style="width: 120px">StepSize:</a-typography-text>
          <a-input-number v-model="resolution_step" :style="{width:'100px'}" class="input-demo" :min="0.01" :max="1" :step="0.01"/>
        </a-space>
      </a-space>
      <a-divider :margin="15"/>
      <!--  颜色设置  -->
      <h4 class="modal-setting-title">Color Scheme</h4>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px">
        <span>low&lt;</span>
        <div style="flex-grow: 1; height: 1px; border-top: 1px solid black; margin-top: 3px;"></div>
        <span>&gt;high</span>
      </div>
      <div id="color-scale-container" style="width: 100%; text-align: center; padding-top: 2px;"></div>

      <div style="display: flex; justify-content: space-between; align-items: center; vertical-align: top; margin-top: 10px">
        <h4 class="modal-setting-title">Samples</h4>
        <a-switch v-model="isShowImage" checked-value="true" unchecked-value="false" size="small"/>
      </div>

      <template #footer>
        <a-button @click="handleOk">Confirm</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  name: "TopPanel",
  data() {
    return {
      isShowImage: "true",
      dataSetValue: this.$store.state.dataSetValue,
      dataSetOptions: [
        {
          value: 'MNIST',
          label: 'MNIST'
        },
        {
          value: 'Airfoil',
          label: 'Airfoil'
        }
      ],
      modalSetValue: "ResNet50",
      modalSetOptions: [
        {
          value: 'ResNet50',
          label: 'ResNet50'
        },
      ],
      // attributeSetValue: "Label",
      // attributeSetOptions: [
      //   {
      //     value: 'Label',
      //     label: 'Label'
      //   },
      // ],
      attributeSetValue: this.$store.state.attributeSetValue,
      attributeSetOptions: [
        {
          value: 0,
          label: 'Chord Length'
        },
        {
          value: 1,
          label: 'Max Thickness'
        },
        {
          value: 2,
          label: 'Xt'
        },
        {
          value: 3,
          label: 'Max Camber'
        },
        {
          value: 4,
          label: 'Xf'
        },
        {
          value: 5,
          label: 'LE Radius'
        },
        {
          value: 6,
          label: 'TE angle'
        },
      ],
      resolutionNumber: this.$store.state.resolution,
      sampleNumber: this.$store.state.sampleNumber,
      radiusNumber: this.$store.state.radiusNumber,
      visible: false,
      lower_bound: this.$store.state.lowerBound,
      resolution_step: this.$store.state.resolutionStep,
      isShowCentroids: this.$store.state.isShowCentroids,
      isShowMap: this.$store.state.isShowMap,

      attributeMin: this.$store.state.attributeMin,
      attributeMax: this.$store.state.attributeMax,
    }
  },
  created() {
    let dataset_type = this.$store.state.dataSetValue
    if (dataset_type === "Airfoil") {
      this.radiusNumber = 0.6
    } else if (dataset_type === "MNIST") {
      this.radiusNumber = 1
    }
    this.$store.commit("setRadiusNumber", this.radiusNumber)
  },
  watch: {
    "lower_bound": {
      deep: true,
      handler: function (v) {
        if(this.lower_bound !== this.attributeMin) {
          console.log("update lower_bound")
          this.$store.commit("setLowerBound", this.lower_bound)
        }
      }
    },
    "resolution_step": {
      deep: true,
      handler: function (v) {
        this.$store.commit("setResolutionStep", this.resolution_step)
      }
    },
    "isShowCentroids": {
      deep: true,
      handler: function (v) {
        console.log(this.isShowCentroids)
        this.$store.commit("setIsShowCentroids", this.isShowCentroids)
      }
    },
    "isShowMap": {
      deep: true,
      handler: function (v) {
        console.log(this.isShowMap)
        this.$store.commit("setIsShowMap", this.isShowMap)
      }
    },
    'dataSetValue': {
      deep: true,
      handler: function (v) {
        console.log("dataSetValue", this.dataSetValue)
        this.$store.commit("setIsDataSetValue", this.dataSetValue)
        if(this.dataSetValue === "Airfoil") {
          this.attributeSetValue = 1
          this.$store.commit("setAttributeSetValue", this.attributeSetValue)

          this.attributeSetOptions = [
            {
              value: 0,
              label: 'Chord Length'
            },
            {
              value: 1,
              label: 'Max Thickness'
            },
            {
              value: 2,
              label: 'Xt'
            },
            {
              value: 3,
              label: 'Max Camber'
            },
            {
              value: 4,
              label: 'Xf'
            },
            {
              value: 5,
              label: 'LE Radius'
            },
            {
              value: 6,
              label: 'TE angle'
            },
          ]
        } else if (this.dataSetValue === "MNIST") {

          this.attributeSetValue = 0
          this.$store.commit("setAttributeSetValue", this.attributeSetValue)
          this.attributeSetOptions = [
              {
                value: 0,
                label: 'Label'
              },
          ]
        }
      }
    },
    "attributeSetValue": {
      deep: true,
      handler: function (v) {
        this.$store.commit("setAttributeSetValue", this.attributeSetValue)
      }
    },
    "$store.state.attributeMin": {
      deep: true,
      handler: function (v) {
        console.log("attributeMin", this.$store.state.attributeMin)
        this.attributeMin = this.$store.state.attributeMin
        console.log(typeof this.$store.state.attributeMin)
        console.log(typeof this.attributeMin)

        if (this.lowerbound !== this.attributeMin) {
          console.log("intial lower bound ")
          this.lower_bound = this.attributeMin
        }
      }
    },
    "$store.state.attributeMax": {
      deep: true,
      handler: function (v) {
        console.log("attributeMax", this.$store.state.attributeMax)
        this.attributeMax = this.$store.state.attributeMax
      }
    },

    "isShowImage": {
      deep: true,
      handler: function (v) {
        if (this.isShowImage === "true") {
          d3.select("#image_grid_g").style("display", "block");
        }
        else {
          d3.select("#image_grid_g").style("display", "none");
        }
      }
    }
  },
  methods: {
    handleClickZoomIn() {
      this.$store.commit("setIsClickZoomIn", !this.$store.state.isClickZoomIn);
    },

    handleClickZoomOut() {
      this.$store.commit("setIsClickZoomOut", !this.$store.state.isClickZoomOut);
    },

    handleClickBoxZoom() {
      this.$store.commit("setIsClickBoxZoom", !this.$store.state.isClickBoxZoom);
    },

    handleClickPan() {
      this.$store.commit("setIsClickPan", !this.$store.state.isClickPan);
    },

    handleClickBoxSelect() {
      this.$store.commit("setIsClickBoxSelect", !this.$store.state.isClickBoxSelect);
    },

    handleClickSelect() {
      this.$store.commit("setIsClickSelect", !this.$store.state.isClickSelect);
    },

    handleClickLineSelect() {
      this.$store.commit("setIsClickLineSelect", !this.$store.state.isClickLineSelect);
    },

    handleClickClear() {
      this.$store.commit("setIsClickErase", !this.$store.state.isClickErase);
    },
    handleClickNeighborhoodView() {
      this.$store.commit("setIsClickNeighborhoodView", !this.$store.state.isClickNeighborhoodView);
    },

    handleClickSettingThreshold() {
      this.visible = true;
    },

    handleChangeResolutionSlider(changeNumber) {
      this.$store.commit("setResolution", changeNumber);
    },

    handleChangeSampleNumberSlider(changeNumber) {
      this.$store.commit("setSampleNumber", changeNumber);
    },

    handleChangeRadiusSlider(changeNumber) {
      this.$store.commit("setRadiusNumber", changeNumber);
    },

    handleOk() {
      this.visible = false;
    }
  }
}
</script>

<style scoped>
.panel_container {
  width: 100%;
  height: 60px;
  display: flex;
  /*background: #f0f0f0;*/
}
.data-setting-item {
  margin-bottom: 6px;
  padding-left: 10px;
  padding-right: 10px;
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 250px;
}
.modal-data-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  line-height: 0;
}
.modal-setting-title{
  margin-bottom: 15px;
  padding: 0;
  line-height: 0;
}
.button_group {
  margin-left: 20px;
  margin-top: -7px;
}
</style>
