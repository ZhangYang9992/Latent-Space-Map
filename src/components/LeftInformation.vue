<template>
<div class="left_information_container">
  <p class="information_title">{{ title }}</p>

  <!-- 分割线 -->
  <div class="information_divider"><a-divider :size="3"/></div>

  <!-- 单击点击一张图片: 显示单张图片与模型信息 -->
  <div class="click_single_image">
    <div class="one_image_group">
      <!-- 单击显示一张图片 -->
      <img class="click_img" src="../assets/None.png"
           style="width: 100%; height: 100%">
    </div>
    <div class="modal_information" v-show="datasetType === 'MNIST'">
      <p class="title_small">ResNet50</p>
    </div>
  </div>

  <!-- 通过对比两张图片：显示图片信息与image标识 -->
  <!--   style="display: none;" -->
  <div class="click_compare_image" style="display: none">
    <div class="two_image_group">
      <!-- 对比图片显示两张图片 -->
      <img class="image_group" id="click_start" src="../assets/None.png">
      <img class="image_group" id="click_end" src="../assets/None.png">
    </div>
    <div class="compare_pic_information">
      <div class="pic_info_p">
        <p class="title_small"><i class="bi bi-geo-alt-fill"></i>Image1</p>
      </div>
      <div class="pic_info_p">
        <p class="title_small"><i class="bi bi-geo-alt"></i>Image2</p>
      </div>
    </div>
  </div>

  <!-- 分割线 -->
  <div class="information_divider"><a-divider :size="2"/></div>

  <!-- MNIST 信息显示 -->
  <div v-show="datasetType === 'MNIST'">
    <!-- 分类信息与置信度 -->
    <div class="div_img_card_info">
      <p class="title_media" id="task_category">Category</p>
      <div class="data_card_info">
        <p class="imgcard_variable_p" id="classified_type_1"></p>
        <p class="imgcard_variable_p" id="classified_type_2" style="display:none"></p>
      </div>
      <p class="title_media" id="task_confidence">Confidence</p>
      <div class="data_card_info">
        <p class="imgcard_variable_p" id="confidence_value_1"></p>
        <p class="imgcard_variable_p" id="confidence_value_2" style="display:none"></p>
      </div>
    </div>

    <!-- 分割线 -->
    <div class="information_divider"><a-divider :size="2"/></div>

    <!-- 置信度分布 -->
    <div>
      <p class="title_media">Predicted Label</p>
      <div class="data_card_info">
        <p class="imgcard_variable_p" id="predicted_classified_type_1"></p>
        <p class="imgcard_variable_p" id="predicted_classified_type_2" style="display:none"></p>
      </div>
      <p class="title_media">Probability Distribution</p>
      <div id="svg_container_probability_distribution">
        <!-- 置信度分布svg -->
        <svg id="confidence_distribution">
          <g id="bars_1"></g>
          <g id="labels"></g>
          <g id="bars_2"></g>
        </svg>
      </div>
    </div>
  </div>

  <!-- Airfoil 信息显示 -->
  <div v-show="datasetType === 'Airfoil'">
    <p class="title_media">Chord Length</p>
    <div class="data_card_info airfoil_attribute_info">
      <p class="imgcard_variable_p" id="chord_length"></p>
<!--      <p class="imgcard_variable_p" id="chord_length2" style="display:none"></p>-->
    </div>
    <div class="data_bar_info" style="display:none">
      <svg id="chord_length_distribution">
        <g class="bars_1"></g>
        <g class="bars_2"></g>
      </svg>
    </div>

    <p class="title_media">Max Thickness (Xt)</p>
    <div class="data_card_info airfoil_attribute_info">
      <p class="imgcard_variable_p"><span id="max_thickness"></span><span id="Xt"></span></p>
<!--      <p class="imgcard_variable_p" id="thickness" style="display:none"><span id="max_thickness2"></span><span id="Xt2"></span></p>-->
    </div>
    <div class="data_bar_info" style="display:none">
      <svg id="max_thickness_distribution">
        <g class="bars_1"></g>
        <g class="bars_2"></g>
      </svg>
    </div>


    <!--    <p class="title_media">Xt</p>-->
<!--    <div class="data_card_info">-->
<!--      <p class="imgcard_variable_p" id="Xt"></p>-->
<!--      <svg id="Xt_distribution" style="display:none">-->
<!--        <g class="bars_1"></g>-->
<!--        <g class="bars_2"></g>-->
<!--      </svg>-->
<!--    </div>-->

    <p class="title_media">Max Camber (Xf)</p>
    <div class="data_card_info airfoil_attribute_info">
      <p class="imgcard_variable_p"><span id="max_camber"></span><span id="Xf"></span></p>
<!--      <p class="imgcard_variable_p" id="camber" style="display:none"><span id="max_camber2"></span><span id="Xf2"></span></p>-->
    </div>
    <div class="data_bar_info" style="display:none">
      <svg id="max_camber_distribution">
        <g class="bars_1"></g>
        <g class="bars_2"></g>
      </svg>
    </div>

<!--    <p class="title_media">Xf</p>-->
<!--    <div class="data_card_info">-->
<!--      <p class="imgcard_variable_p" id="Xf"></p>-->
<!--      <svg id="Xf_distribution" style="display:none">-->
<!--        <g class="bars_1"></g>-->
<!--        <g class="bars_2"></g>-->
<!--      </svg>-->
<!--    </div>-->

    <p class="title_media">LE Radius</p>
    <div class="data_card_info airfoil_attribute_info">
      <p class="imgcard_variable_p" id="leading_edge_radius"></p>
<!--      <p class="imgcard_variable_p" id="leading_edge_radius2" style="display:none"></p>-->
    </div>
    <div class="data_bar_info" style="display:none">
      <svg id="leading_edge_radius_distribution">
        <g class="bars_1"></g>
        <g class="bars_2"></g>
      </svg>
    </div>

    <p class="title_media">TE Angle</p>
    <div class="data_card_info airfoil_attribute_info">
      <p class="imgcard_variable_p" id="te_angle"></p>
<!--      <p class="imgcard_variable_p" id="te_angle2" style="display:none"></p>-->
    </div>
    <div class="data_bar_info" style="display:none">
      <svg id="te_angle_distribution">
        <g class="bars_1"></g>
        <g class="bars_2"></g>
      </svg>
    </div>

    <p class="title_media">Aerodynamics analysis</p>
    <img id="aerodynamics_coefficient_image" style="display:none">
  </div>

</div>
</template>

<script>
import * as d3 from "d3";

export default {
  name: "LeftInformation",
  data() {
    return {
      datasetType: this.$store.state.dataSetValue
    }
  },
  computed: {
    title() {
      switch (this.datasetType) {
        case 'MNIST':
          return 'Image Information';
        case 'Airfoil':
          return 'Airfoil Information';
        default:
          return 'Information';
      }
    },
  },
  watch: {
    "$store.state.dataSetValue": {
      deep: true,
      handler: function (v) {
        this.datasetType = this.$store.state.dataSetValue
      }
    },
  }
}
</script>

<style scoped>
.left_information_container {
  height: 100%;
  width: 230px;
  display: inline-block;
  vertical-align: middle;
}
.information_title {
  font-size: large;
  color: black;
  font-weight: 600;
}
.information_divider {
  width: 210px;
  margin: auto;
}
.one_image_group {
  width: 80px;
  height: 80px;
  margin: 10px auto;
}
.two_image_group {
  width: 180px;
  height: 80px;
  margin: auto;
}
.click_img {
  border: 1px solid rgb(24, 21, 21);
}
.image_group {
  width: 70px;
  height: 70px;
  border: 1px solid rgb(24, 21, 21);
  margin: 10px 5px 5px 10px;
  float: left;
}
.title_small {
  font-size: small;
  font-weight: 600;
  margin-bottom: 0px;
  text-align: center;
  color: black;
}
.modal_information {
  height: 25px;
}
.compare_pic_information {
  height: 25px;
  width: 170px;
  margin: auto;
}
.pic_info_p {
  float: left;
  width: 80px;
  height: 25px;
}
.title_media {
  font-size: medium;
  font-weight: 600;
  /*margin-bottom: 0;*/
  text-align: center;
  color: black;
  margin: 10px 0;
}
.data_card_info {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  text-align: center; /* 确保文本也居中 */
}
.data_bar_info {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  text-align: center; /* 确保文本也居中 */
  height: 20px;
}
.imgcard_variable_p {
  margin: 10px 10px;
}
#aerodynamics_coefficient_image {
  height: 190px;
}
</style>