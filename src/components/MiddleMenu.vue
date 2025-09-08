<template>
  <div>
<!--    <div>-->
<!--&lt;!&ndash;      <a-radio-group v-model="showType" :options="typeOptions" direction="vertical"/>&ndash;&gt;-->
<!--      <p>Image</p>-->
<!--      <a-switch v-model="isShowImage" checked-value="true" unchecked-value="false" size="small"/>-->
<!--    </div>-->
    <div id="thresholds" style="display: block; margin-left: 10px">
      <div class="color_block_rob" id="threshold0" style="background-color:#08519c; "></div>
      <div class="threshold_value_div">
        <p id="threshold-0-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold1" style="background-color:#3182bd; "></div>
      <div class="threshold_value_div">
        <p id="threshold-1-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold2" style="background-color:#6baed6; "></div>
      <div class="threshold_value_div">
        <p id="threshold-2-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold3" style="background-color:#9ecae1; "></div>
      <div class="threshold_value_div">
        <p id="threshold-3-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold4" style="background-color:#c6dbef; "></div>
      <div class="threshold_value_div">
        <p id="threshold-4-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold5" style="background-color:#ffffcc; "></div>
      <div class="threshold_value_div">
        <p id="threshold-5-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold6" style="background-color:#ffeda0; "></div>
      <div class="threshold_value_div">
        <p id="threshold-6-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold7" style="background-color:#fed976; "></div>
      <div class="threshold_value_div">
        <p id="threshold-7-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold8" style="background-color:#feb24c; "></div>
      <div class="threshold_value_div">
        <p id="threshold-8-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold9" style="background-color:#fd8d3c; "></div>
      <div class="threshold_value_div">
        <p id="threshold-9-value" class="threshold_value"></p>
      </div>
      <div class="color_block_rob" id="threshold10" style="background-color:#fc4e2a; "></div>
      <div class="threshold_value_div">
        <p id="threshold-10-value" class="threshold_value"></p>
      </div>
    </div>

  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: "MiddleMenu",
  data() {
    return {
      // showType: 'HeatMap',
      // typeOptions: ['HeatMap', 'ImageGrid']
      isShowImage: "true"
    }
  },
  watch: {
    // "showType": {
    //   deep: true,
    //   handler: function (v){
    //     if (this.showType === 'HeatMap') {
    //       d3.select("#ImageGrid_Container").style("display", "none");
    //       d3.select("#HeatMap_Container").style("display", "block");
    //     } else {
    //       d3.select("#ImageGrid_Container").style("display", "block");
    //       d3.select("#HeatMap_Container").style("display", "none");
    //     }
    //   }
    // }
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
  }
}
</script>

<style scoped>
.color_block_rob {
  margin: auto;
  width: 30px;
  height: 15px;
  margin-top: 8px;
}
.threshold_value_div {
  height: 18px;
}
.threshold_value {
  margin: auto;
  margin-top: 1px;
  text-align: center;
  font-family: Arial, Helvetica, sans-serif;
  font-size: x-small;
  color: #000;
}
#thresholds {
  width: 70px;
  margin-bottom: 5px;
  bottom: 0;
  margin-top: 355px;
}
</style>