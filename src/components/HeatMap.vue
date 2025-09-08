<template>
  <a-spin :loading="loading">
    <div id="HeatMap_Container" class="col-auto border rounded-2">
        <!-- 中间的概览 -->
        <svg id="center_heatMap_svg">
          <!-- 热力图g -->
          <g id="heatMap_g"></g>
          <!-- x轴g -->
          <g id="x_g"></g>
          <!-- y轴g -->
          <g id="y_g"></g>
          <!-- 在热力图上显示网格图片 -->
          <g id="image_grid_g"></g>
          <!-- crop裁剪矩形, 那个画出来的黑色正方形 -->
          <rect id="selection_inner_rect"></rect>
          <!-- 坐标图片和圈 -->
          <g id="image_and_circle_g"></g>
          <!-- 用来做图片对比的g -->
          <g id="image_compare_g" style="z-index: 100;"></g>
          <!--  绘制邻域  -->
          <g id="neighborhood_coords_g"></g>
          <!-- 绘制中心点 -->
          <g id="centroids_coords_g"></g>
          <!-- 点击中心点得到坐标 -->
          <g id="image_center_g" style="z-index: 100;"></g>
        </svg>
    </div>
  </a-spin>
</template>

<script>
import * as d3 from 'd3';
import { getChangeResolution, getInitLatentSpace, getTransformLatentSpace, getClickSample, getGridImage } from "../serve/serve.js"
import d3Tip from 'd3-tip'

// import ImageGrid from "./ImageGrid";
export default {
  name: "HeatMap",
  data() {
    return {
      // color: ['#4575b4', '#74add1', '#74add1', '#abd9e9', '#e0f3f8','#ffffbf', '#fee090','#fdae61','#f46d43','#d73027'],
      // color: ['#08519c', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef','#eff3ff','#ffffb2','#fed976','#feb24c','#fd8d3c','#f03b20','#bd0026'],
      // color: ['#ffffff', '#08519c', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26', '#a50f15'],

      // color: ['#ffffff', '#08519c', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#ffffb2','#fed976','#feb24c','#fd8d3c','#f03b20','#bd0026'],
      color: ['#ffffff', '#08519c', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a'],

      heatMap_height: 800,
      heatMap_width: 800,
      bins: this.$store.state.resolution, // 网格数量
      thresholds: [-2, -1.0, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1],
      // 二维数组(40 * 40) -> 一维数组 (1600)
      heatMap_data: [],
      // opacity_data: [],
      // extent: {
      //   "start_x": -5.0,
      //   "end_x": 5.0,
      //   "start_y": -5.0,
      //   "end_y": 5.0
      // }
      // 定义全局操作zoom
      zoom: null,
      // 全局坐标轴
      xScale: null,
      yScale: null,
      // 分类信息
      // cifar10_classes: ['plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'],
      cifar10_classes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],

      // 统计点击图片的数量
      image_number: 0,

      // draw_point
      centroids_coords: [],

      centroids_class: [],
      centroids_attribute: [],
      point_color: ['#74d2e7', '#0085ad', '#003666', '#8e43e7', '#ff4f81', '#ff9933', '#2dde98', '#1cc7d0', '#b84592', '#db3552'],
      // loading显示
      loading: true,
      // 图片的位置
      img_coords_confidence: [],
      bar_container_id: ['chord_length_distribution', 'max_thickness_distribution', 'max_camber_distribution', 'leading_edge_radius_distribution', 'te_angle_distribution'],
    }
  },
  // 初始化
  mounted() {
    this.draw_init_latent_space()
  },
  // 监听
  watch: {
    // 监听Zoom In按钮
    "$store.state.isClickZoomIn": {
      deep: true,
      handler: function (v) {
        let heatMap_svg = d3.select("#center_heatMap_svg")
        heatMap_svg.call(this.zoom.scaleBy, 1.3);
      }
    },
    // 监听Zoom Out按钮
    "$store.state.isClickZoomOut": {
      deep: true,
      handler: function (v) {
        let heatMap_svg = d3.select("#center_heatMap_svg")
        heatMap_svg.call(this.zoom.scaleBy, 0.9);
      }
    },
    // 监听Erase按钮
    "$store.state.isClickErase": {
      deep: true,
      handler: function (v) {
        let heatMap_svg = d3.select("#center_heatMap_svg")
        let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")
        let dataset_type = this.$store.state.dataSetValue

        // 删除单击时产生的图片
        heatMap_svg.select("#image_and_circle_g")
        .selectAll("image")
        .remove()

        // 删除单击时产生的点
        heatMap_svg.select("#image_and_circle_g")
        .selectAll("circle")
        .remove()

        // 删除对比时产生的线
        heatMap_svg.select("#image_compare_g")
        .selectAll("line")
        .remove()

        // 删除对比时产生的点
        heatMap_svg.select("#image_compare_g")
        .selectAll("circle")
        .remove()

        //删除图例
        heatMap_svg.select("#image_compare_g")
        .selectAll("g")
        .remove()

        // 删除邻域采样中心点
        heatMap_svg.select("#image_center_g")
        .selectAll("g")
        .remove()

        heatMap_svg.select("#neighborhood_coords_g")
            .selectAll("g")
            .remove()


        heatMap_svg.select("#neighborhood_coords_g")
            .selectAll("circle")
            .remove()

        // 删除neighborhood grid中的图标
        neighborhood_grid_svg.select("#circle_g")
        .selectAll("g")
        .remove()

        neighborhood_grid_svg.select("#circle_g")
        .selectAll("g")
        .remove()

        neighborhood_grid_svg.select("#compare_circle_g")
        .selectAll("line")
        .remove()

        neighborhood_grid_svg.select("#compare_circle_g")
        .selectAll("g")
        .remove()


        // 删除左侧面板单击时的信息
        d3.select(".click_img").attr("src", "http://211.81.55.138:8086/static/None.png")
        d3.select("#classified_type_1").text("")
        d3.select("#classified_type_2").text("")
        d3.select("#predicted_classified_type_1").text("")
        d3.select("#predicted_classified_type_2").text("")
        d3.select("#confidence_value_1").text("")
        d3.select("#confidence_value_2").text("")

        d3.select("#chord_length").text("")
        d3.select("#max_thickness").text("")
        d3.select("#Xt").text("")
        d3.select("#max_camber").text("")
        d3.select("#Xf").text("")
        d3.select("#leading_edge_radius").text("")
        d3.select("#te_angle").text("")
        d3.select('#aerodynamics_coefficient_image').style('display', 'none')

        // d3.select("#chord_length2").text("")
        // d3.select("#max_thickness2").text("")
        // d3.select("#Xt2").text("")
        // d3.select("#max_camber2").text("")
        // d3.select("#Xf2").text("")
        // d3.select("#leading_edge_radius2").text("")
        // d3.select("#te_angle2").text("")

        // 删除左侧面板中对比
        d3.select("#click_start").attr("src", "http://211.81.55.138:8086/static/None.png")
        d3.select("#click_end").attr("src", "http://211.81.55.138:8086/static/None.png")

        // 重置置信度
        let zero_confidence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        if (this.$store.state.isClickLineSelect === true) {
          if (dataset_type === 'MNIST') {
            this.draw_double_confidence_bar_with_side(zero_confidence, 'left')
            this.draw_double_confidence_bar_with_side(zero_confidence, 'right')
          } else if (dataset_type === 'Airfoil') {
            for (let i = 0; i < this.bar_container_id.length; i++) {
              this.erase_double_attribute_bar(this.bar_container_id[i])
            }
          }
        } else {
          if (dataset_type === 'MNIST') {
            this.draw_single_confidence_bar(zero_confidence)
          }
        }
      }
    },
    // 监听Resolution是否改变
    "$store.state.resolution": {
      deep: true,
      handler: function (v) {
        this.draw_change_resolution()
      }
    },
    // 监听SampleNumber是否改变 是否需要新的api来更新数据: 待确定
    "$store.state.sampleNumber": {
      deep: true,
      handler: function (v) {

      }
    },

    // 监听setIsClickPan是否改变
    "$store.state.isClickPan": {
      deep: true,
      handler: function (v) {
        let heatMap_svg = d3.select("#center_heatMap_svg")
        if (this.$store.state.isClickPan === true) {
          // 使得其他几个限制的按钮为false
          if (this.$store.state.isClickBoxZoom) {
            this.$store.commit("setIsClickBoxZoom", false)
          }
          if (this.$store.state.isClickBoxSelect) {
            this.$store.commit("setIsClickBoxSelect", false)
          }
          if (this.$store.state.isClickSelect) {
            this.$store.commit("setIsClickSelect", false)
          }
          if (this.$store.state.isClickLineSelect) {
            this.$store.commit("setIsClickLineSelect", false)
          }
          if (this.$store.state.isClickNeighborhoodView) {
            this.$store.commit("setIsClickNeighborhoodView", false)
          }

          heatMap_svg.style("cursor", "move");
          heatMap_svg.call(this.zoom)
        } else {
          heatMap_svg.style("cursor", "default");
          heatMap_svg.on(".zoom", null); // 禁用zoom
        }
      }
    },

    // 监听isClickBoxZoom是否改变
    "$store.state.isClickBoxZoom": {
      deep: true,
      handler:async function (v) {
        let _this = this;
        // 定义元素
        let heatMap_svg = d3.select("#center_heatMap_svg")

        // 裁剪区域将元素清除
        this.$store.commit("setIsClickErase", !this.$store.state.isClickErase);

        if (this.$store.state.isClickBoxZoom === true) {
          // 使得其他几个限制的按钮为false
          if (this.$store.state.isClickPan) {
            this.$store.commit("setIsClickPan", false)
          }
          if (this.$store.state.isClickBoxSelect) {
            this.$store.commit("setIsClickBoxSelect", false)
          }
          if (this.$store.state.isClickSelect) {
            this.$store.commit("setIsClickSelect", false)
          }
          if (this.$store.state.isClickLineSelect) {
            this.$store.commit("setIsClickLineSelect", false)
          }
          if (this.$store.state.isClickNeighborhoodView) {
            this.$store.commit("setIsClickNeighborhoodView", false)
          }
          // brush事件
          let crop_all = d3.brush()
          .on("brush", function (event) {
            let crop_start_pos = event.selection[0];
            let pos = event.selection[1];
            let length_x = Math.abs(pos[0] - crop_start_pos[0]);
            let length_y = Math.abs(pos[1] - crop_start_pos[1]);
            // 放大为正方形 取最短边
            let square_length = Math.min(length_x, length_y);

            // 热力图加选框
            heatMap_svg.select("#selection_inner_rect")
            .attr("x", function () {
              if (crop_start_pos[0] < pos[0]) {
                return crop_start_pos[0];
              } else {
                return crop_start_pos[0] - square_length;
              }
            })
            .attr("y", function () {
              if (crop_start_pos[1] < pos[1]) {
                return crop_start_pos[1];
              } else {
                return crop_start_pos[1] - square_length;
              }
            })
            .attr("height", square_length)
            .attr("width", square_length)
            .attr("fill-opacity", 0.5);
          })
          .on("end", function () {
            // 结束brush后将裁剪的crop隐藏
            if (!d3.select("#heatmap_crop_g").empty()) {
              heatMap_svg.select("#heatmap_crop_g .selection").style("display", "none")
            }

            let selection_inner_rect = heatMap_svg.select("#selection_inner_rect")

            // 得到新坐标
            let extent = {
              "start_x": _this.xScale.invert(selection_inner_rect.attr("x")),
              "end_x": _this.xScale.invert(Number(selection_inner_rect.attr("x")) + Number(selection_inner_rect.attr("width"))),
              "start_y": _this.yScale.invert(selection_inner_rect.attr("y")),
              "end_y": _this.yScale.invert(Number(selection_inner_rect.attr("y")) + Number(selection_inner_rect.attr("height"))),
            }
            _this.$store.commit("setExtent", extent);

            // 定义新的坐标轴
            // 定义X轴scale
            _this.xScale = d3.scaleLinear()
            .domain([extent.start_x, extent.end_x])
            .range([0, _this.heatMap_width]);
            // 定义Y轴scale
            _this.yScale = d3.scaleLinear()
            .domain([extent.start_y, extent.end_y])
            .range([0, _this.heatMap_height]);

            // 更新热力图
            _this.draw_crop_latent_space()

          })

          // 添加热力图的裁剪元素crop
          if (d3.select("#heatmap_crop_g").empty()) {
            heatMap_svg.append("g")
            .attr("class", "brush")
            .attr("id", "heatmap_crop_g")
            .call(crop_all);
          }

        } else {
          // 删除crop
          if (!d3.select("#heatmap_crop_g").empty()) {
            d3.select("#heatmap_crop_g").remove()
          }
          // 隐藏那个选框
          heatMap_svg.select("#selection_inner_rect")
          .attr("height", 0)
          .attr("width", 0)
        }
      }
    },

    // 监听isClickBoxSelect是否改变
    "$store.state.isClickBoxSelect": {
      deep: true,
      handler: function (v) {

        let heatMap_svg = d3.select("#center_heatMap_svg")

        if (this.$store.state.isClickBoxSelect === true) {
          // 使得其他几个限制的按钮为false
          if (this.$store.state.isClickPan) {
            this.$store.commit("setIsClickPan", false)
          }
          if (this.$store.state.isClickBoxZoom) {
            this.$store.commit("setIsClickBoxZoom", false)
          }
          if (this.$store.state.isClickSelect) {
            this.$store.commit("setIsClickSelect", false)
          }
          if (this.$store.state.isClickLineSelect) {
            this.$store.commit("setIsClickLineSelect", false)
          }
          if (this.$store.state.isClickNeighborhoodView) {
            this.$store.commit("setIsClickNeighborhoodView", false)
          }

          let heatMap_brush = d3.brush()

          // 热力图添加brush
          if (d3.select("#heatmap_brush_g").empty()) {
            heatMap_svg.append("g")
            .attr("class", "brush")
            .attr("id", "heatmap_brush_g")
            .call(heatMap_brush);
          }
        } else {
          // 删除brush
          if (!d3.select("#heatmap_brush_g").empty()) {
            d3.select("#heatmap_brush_g").remove()
          }
        }
      }
    },

    // 监听isClickSelect是否改变
    "$store.state.isClickSelect": {
      deep: true,
      handler: function (v) {
        let _this = this;
        let heatMap_svg = d3.select("#center_heatMap_svg")
        let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")

        let rectWidth = 40

        if (this.$store.state.isClickSelect === true) {
          console.log("$store.state.isClickSelect")

          // 使得其他几个限制的按钮为false
          if (this.$store.state.isClickPan) {
            this.$store.commit("setIsClickPan", false)
          }
          if (this.$store.state.isClickBoxZoom) {
            this.$store.commit("setIsClickBoxZoom", false)
          }
          if (this.$store.state.isClickBoxSelect) {
            this.$store.commit("setIsClickBoxSelect", false)
          }
          if (this.$store.state.isClickLineSelect) {
            this.$store.commit("setIsClickLineSelect", false)
          }
          if (this.$store.state.isClickNeighborhoodView) {
            this.$store.commit("setIsClickNeighborhoodView", false)
          }
          // 设置点击鼠标显示
          heatMap_svg.style("cursor", "pointer");
          neighborhood_grid_svg.style("cursor", "pointer");


          // 显示单张图片div
          d3.select(".click_single_image").style("display", "block")
          // 不显示多张图片比较div
          d3.select(".click_compare_image").style("display", "none")
          // 不显示点击两张图的相关信息
          d3.select("#classified_type_2").style("display", "none")
          d3.select("#confidence_value_2").style("display", "none")
          d3.select("#predicted_classified_type_2").style("display", "none")

          // d3.select("#chord_length2").style("display", "none")
          // d3.select("#thickness").style("display", "none")
          // d3.select("#camber").style("display", "none")
          // d3.select("#leading_edge_radius2").style("display", "none")
          // d3.select("#te_angle2").style("display", "none")
          d3.selectAll(".airfoil_attribute_info").style("display", "flex")
          d3.selectAll('.data_bar_info').style("display", "none")

          // 初始化清空信息
          d3.select(".click_img").attr("src", "http://211.81.55.138:8086/static/None.png")
          d3.select("#classified_type_1").text("")
          d3.select("#predicted_classified_type_1").text("")
          d3.select("#confidence_value_1").text("")

          d3.select("#chord_length").text("")
          d3.select("#max_thickness").text("")
          d3.select("#Xt").text("")
          d3.select("#max_camber").text("")
          d3.select("#Xf").text("")
          d3.select("#leading_edge_radius").text("")
          d3.select("#te_angle").text("")
          d3.select('#aerodynamics_coefficient_image').style('display', 'none')


          // 显示初始置信度
          let zero_confidence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          this.draw_single_confidence_bar(zero_confidence)
          let dataset_type = this.$store.state.dataSetValue

          // 热力图绑定点击事件
          heatMap_svg.on("click", async function (event) {
            // 获取事件坐标
            let temp_pos = d3.pointer(event)
            let x = _this.xScale.invert(temp_pos[0])
            let y = _this.yScale.invert(temp_pos[1])
            _this.$store.commit("setPointX", x);
            _this.$store.commit("setPointY", y);

            heatMap_svg.select("#image_and_circle_g")
            .append("circle")
            .attr("cx", temp_pos[0])
            .attr("cy", temp_pos[1])
            .attr("pos_x", x)
            .attr("pos_y", y)
            .attr("r", "3")
            .attr("fill", "black")
            .attr("fill-opacity", "1")

            _this.image_number = _this.image_number + 1;
            let path_save = "./static/" + dataset_type + "_single_samples/" + String(_this.image_number) + ".png"

            heatMap_svg.style("cursor", "wait");

            // 设置网格大小决定其结果
            let sample_num = 300
            let grid_num = 16
            if (dataset_type === "Airfoil") {
              // 修改 sample_num 由grid决定
              // sample_num = 200
              grid_num = 11
            } else if (dataset_type === "MNIST") {
              // sample_num = 300
              grid_num = 15
            }

            let radius = _this.$store.state.radiusNumber
            if (dataset_type === "Airfoil") {
              radius = 0.6
            } else if (dataset_type === "MNIST") {
              // sample_num = 300
              radius = 1
            }
            // _this.$store.commit("setRadiusNumber", radius)

            // loading 页面
            _this.$store.commit("setIsNeighborhoodLoading", !_this.$store.state.isNeighborhoodLoading);

            // 事件响应
            await getClickSample(x, y, path_save, true, sample_num, grid_num, radius, dataset_type).then((res) => {
              let confidence_list = res.data.confidence_list
              let predicted = res.data.predicted
              let confidence = res.data.confidence
              let label = res.data.label
              let coefficient = res.data.coefficient

              _this.$store.commit("setNeighborhoodConfidence", res.data.neighborhood_confidence);
              _this.$store.commit("setNeighborhoodLabels", res.data.neighborhood_labels);
              _this.$store.commit("setNeighborhoodPredict", res.data.neighborhood_predict);
              _this.$store.commit("setNeighborhoodImageIndex", res.data.neighborhood_image);
              _this.$store.commit("setCenterIdx",  res.data.center_idx);

              // _this.$store.commit("setNeighborhoodGridIdx", res.data.grid_index);
              // _this.$store.commit("setNeighborhoodOriginMetric",  res.data.origin_metric);

              // 清除neighborhood的信息
              // 删除neighborhood grid中的图标
              neighborhood_grid_svg.select("#circle_g")
              .selectAll("g")
              .remove()

              neighborhood_grid_svg.select("#circle_g")
              .selectAll("g")
              .remove()

              neighborhood_grid_svg.select("#compare_circle_g")
              .selectAll("line")
              .remove()

              neighborhood_grid_svg.select("#compare_circle_g")
              .selectAll("g")
              .remove()

              heatMap_svg.select("#image_and_circle_g")
              .append("image")
              .attr("href", `http://211.81.55.138:8086/static/${ dataset_type }_single_samples/${_this.image_number}.png?t=` + Math.random())
              .attr("x", temp_pos[0])
              .attr("y", temp_pos[1])
              .attr("pos_x", x)
              .attr("pos_y", y)
              .attr("width", rectWidth)
              .attr("height", rectWidth)

              // 修改左侧示例图
              // 显示图片
              d3.select(".click_img").attr("src", `http://211.81.55.138:8086/static/${ dataset_type }_single_samples/${_this.image_number}.png?t=` + Math.random())

              // 标记图标的大小
              const icon_size = 16;

              heatMap_svg.select("#image_center_g").selectAll("g").remove()

              heatMap_svg.select("#image_center_g")
              .append("g")
              .attr("width", icon_size)
              .attr("height", icon_size)
              .append("path")
              .attr("d", "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z")
              .attr("pos_x", x)
              .attr("pos_y", y)
              .attr("fill", "red")
              .attr("transform", "translate(" + String(Number(temp_pos[0]) + rectWidth - icon_size + 3) + "," + String(Number(temp_pos[1]) + rectWidth - icon_size + 2) + ")")

              if (dataset_type === "MNIST") {
                // 显示类别
                d3.select("#classified_type_1").text(_this.cifar10_classes[label])
                // 显示预测类别
                d3.select("#predicted_classified_type_1").text(_this.cifar10_classes[predicted])
                // 显示置信度
                d3.select("#confidence_value_1").text(confidence.toFixed(3))
                // 显示置信度
                _this.draw_single_confidence_bar(confidence_list)
              } else if (dataset_type === "Airfoil") {
                d3.select("#chord_length").text(coefficient[0].toFixed(4))
                d3.select("#max_thickness").text(coefficient[1].toFixed(4))
                d3.select("#Xt").text('(' + coefficient[2].toFixed(2) + ')')
                d3.select("#max_camber").text(coefficient[3].toFixed(4))
                d3.select("#Xf").text('(' + coefficient[4].toFixed(2) + ')')
                d3.select("#leading_edge_radius").text(coefficient[5].toFixed(4))
                d3.select("#te_angle").text(coefficient[6].toFixed(4))

                d3.select('#aerodynamics_coefficient_image').style('display', 'block')
                d3.select('#aerodynamics_coefficient_image').attr("src", `http://211.81.55.138:8086/static/Airfoil_analysis/cl.png?t=` + Math.random())
              }
              // 恢复鼠标设置
              heatMap_svg.style("cursor", "pointer");

              // 更新邻域信息
              _this.$store.commit("setIsDrawNeighborhood", !_this.$store.state.isDrawNeighborhood);

            })

          })

        } else {
          heatMap_svg.style("cursor", "default");
          neighborhood_grid_svg.style("cursor", "default");
          // 取消点击事件
          // 防止出现isClickLineSelect为true时点击事件被取消
          if (this.$store.state.isClickLineSelect === false) {
            heatMap_svg.on("click", null)
          }
        }
      }
    },

    // 监听isClickLineSelect是否改变
    "$store.state.isClickLineSelect": {
      deep: true,
      handler: function (v) {
        let heatMap_svg = d3.select("#center_heatMap_svg");
        let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")

        let _this = this;
        // 标记图标的大小
        const icon_size = 16;

        if (this.$store.state.isClickLineSelect === true) {
          // 使得其他几个限制的按钮为false
          if (this.$store.state.isClickPan) {
            this.$store.commit("setIsClickPan", false)
          }
          if (this.$store.state.isClickBoxZoom) {
            this.$store.commit("setIsClickBoxZoom", false)
          }
          if (this.$store.state.isClickBoxSelect) {
            this.$store.commit("setIsClickBoxSelect", false)
          }
          if (this.$store.state.isClickSelect) {
            this.$store.commit("setIsClickSelect", false)
          }
          if (this.$store.state.isClickNeighborhoodView) {
            this.$store.commit("setIsClickNeighborhoodView", false)
          }

          // 设置点击鼠标显示
          heatMap_svg.style("cursor", "pointer");
          neighborhood_grid_svg.style("cursor", "pointer");

          // 不显示单张图片div
          d3.select(".click_single_image").style("display", "none")
          // 显示多张图片比较div
          d3.select(".click_compare_image").style("display", "block")

          // 清空初始化之前的信息
          // 清空图片
          d3.select("#click_start").attr("src", "http://211.81.55.138:8086/static/None.png")
          d3.select("#click_end").attr("src", "http://211.81.55.138:8086/static/None.png")

          // 清空信息
          d3.select("#classified_type_1").text("")
          d3.select("#classified_type_2").text("")
          d3.select("#predicted_classified_type_1").text("")
          d3.select("#predicted_classified_type_2").text("")
          d3.select("#confidence_value_1").text("")
          d3.select("#confidence_value_2").text("")

          d3.select("#chord_length").text("")
          d3.select("#max_thickness").text("")
          d3.select("#Xt").text("")
          d3.select("#max_camber").text("")
          d3.select("#Xf").text("")
          d3.select("#leading_edge_radius").text("")
          d3.select("#te_angle").text("")
          d3.select('#aerodynamics_coefficient_image').style('display', 'none')

          // d3.select("#chord_length2").text("")
          // d3.select("#max_thickness2").text("")
          // d3.select("#Xt2").text("")
          // d3.select("#max_camber2").text("")
          // d3.select("#Xf2").text("")
          // d3.select("#leading_edge_radius2").text("")
          // d3.select("#te_angle2").text("")

          d3.select("#classified_type_2").style("display", "inline-block")
          d3.select("#predicted_classified_type_2").style("display", "inline-block")
          d3.select("#confidence_value_2").style("display", "inline-block")

          // d3.select("#chord_length2").style("display", "inline-block")
          // d3.select("#thickness").style("display", "inline-block")
          // d3.select("#camber").style("display", "inline-block")
          // d3.select("#leading_edge_radius2").style("display", "inline-block")
          // d3.select("#te_angle2").style("display", "inline-block")
          d3.selectAll(".airfoil_attribute_info").style("display", "none")
          d3.selectAll('.data_bar_info').style("display", "flex")

          // 置信度置为0
          let zero_confidence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          this.draw_double_confidence_bar_with_side(zero_confidence, 'left')
          this.draw_double_confidence_bar_with_side(zero_confidence, 'right')

          // 热力图事件绑定
          let click_number = 0; // 记录点击次数
          let first_click_pos; // 第一次点击的坐标

          heatMap_svg.on("click", async function (event) {
            console.log("isClickLineSelect click")

            // 获取事件坐标
            let temp_pos = d3.pointer(event)
            let x = _this.xScale.invert(temp_pos[0])
            let y = _this.yScale.invert(temp_pos[1])

            // 通过click控制线的绘制
            if (click_number === 0) {
              click_number = click_number + 1;
              first_click_pos = d3.pointer(event)

              // 第一次点击添加线 使得起点和终点一致
              heatMap_svg.select("#image_compare_g")
              .append("line")
              .attr("x1", first_click_pos[0])
              .attr("y1", first_click_pos[1])
              .attr("x2", first_click_pos[0])
              .attr("y2", first_click_pos[1])
              .attr("pos_x1", x)
              .attr("pos_y1", y)
              .attr("id", "pos" + String(first_click_pos[0]).replace(".", "") + "" + String(first_click_pos[1]).replace(".", ""))//把点击的坐标当作线段的id
              .attr("stroke-width", "3px")
              .attr("stroke", "black")
              .attr("opacity", "0.3")

              // 添加点
              heatMap_svg.select("#image_compare_g")
              .append("circle")
              .attr("cx", temp_pos[0])
              .attr("cy", temp_pos[1])
              .attr("pos_x", x)
              .attr("pos_y", y)
              .attr("r", "3")
              .attr("fill", "#00000")
              .attr("fill-opacity", "1")

              // 添加图例
              heatMap_svg.select("#image_compare_g")
              .append("g")
              .attr("width", icon_size)
              .attr("height", icon_size)
              .append("path")
              .attr("d", "M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z")
              .attr("pos_x", x)
              .attr("pos_y", y)
              .attr("transform", "translate(" + String(Number(temp_pos[0]) - icon_size / 2) + "," + String(Number(temp_pos[1]) - icon_size - 8) + ")")
              .transition()
              .duration(800)
              .attr("transform", "translate(" + String(Number(temp_pos[0]) - icon_size / 2) + "," + String(Number(temp_pos[1]) - icon_size) + ")")

              //如果是第一次点击 则绑定悬停事件
              heatMap_svg.on("mousemove", async function (event) {
                let move_pos = d3.pointer(event)
                heatMap_svg.select("#image_compare_g")
                .select("#" + "pos" + String(first_click_pos[0]).replace(".", "") + "" + String(first_click_pos[1]).replace(".", ""))
                .attr("x2", move_pos[0])
                .attr("y2", move_pos[1])
                .attr("pos_x2", _this.xScale.invert(move_pos[0]))
                .attr("pos_y2", _this.yScale.invert(move_pos[1]))
              })

            } else {
              // 将click_number 置为0
              click_number = 0;
              // 不是第一次点击 则取消悬停事件
              heatMap_svg.on("mousemove", null)
              // 添加点
              heatMap_svg.select("#image_compare_g")
              .append("circle")
              .attr("cx", temp_pos[0])
              .attr("cy", temp_pos[1])
              .attr("pos_x", x)
              .attr("pos_y", y)
              .attr("r", "3")
              .attr("fill", "#00000")
              .attr("fill-opacity", "1")

              // 添加图例
              let d = ["M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z", "M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]
              heatMap_svg.select("#image_compare_g")
              .append("g")
              .attr("width", icon_size)
              .attr("height", icon_size)
              .selectAll("path")
              .data(d)
              .join("path")
              .attr("d", d => d)
              .attr("pos_x", x)
              .attr("pos_y", y)
              .attr("transform", "translate(" + String(Number(temp_pos[0]) - icon_size / 2) + "," + String(Number(temp_pos[1]) - icon_size - 8) + ")")
              .transition()
              .duration(800)
              .attr("transform", "translate(" + String(Number(temp_pos[0]) - icon_size / 2) + "," + String(Number(temp_pos[1]) - icon_size) + ")")
            }

            _this.image_number = _this.image_number + 1;
            let dataset_type = _this.$store.state.dataSetValue

            // 让鼠标出现等待界面
            heatMap_svg.style("cursor", "wait");
            let path_save = "./static/" + dataset_type + "_single_samples/" + String(_this.image_number) + ".png"
            let radius = _this.$store.state.radiusNumber

            // 事件响应
            await getClickSample(x, y, path_save, false, 0, 0, radius, dataset_type).then((res) => {
              let confidence_list = res.data.confidence_list
              let predicted = res.data.predicted
              let confidence = res.data.confidence
              let label = res.data.label
              let coefficient = res.data.coefficient

              // 修改左边示例图
              if (click_number === 1) {
                d3.select("#click_start")
                .attr("src", `http://211.81.55.138:8086/static/${dataset_type}_single_samples/${_this.image_number}.png?t=` + Math.random())
                if(dataset_type === "MNIST") {
                  // 显示类别
                  d3.select("#classified_type_1").text(_this.cifar10_classes[label])
                  // 显示预测类别
                  d3.select("#predicted_classified_type_1").text(_this.cifar10_classes[predicted])
                  // 显示置信度
                  d3.select("#confidence_value_1").text(confidence.toFixed(3))
                  // 显示置信度
                  _this.draw_double_confidence_bar_with_side(confidence_list, 'left')
                } else if (dataset_type === "Airfoil") {
                  // d3.select("#chord_length").text(coefficient[0].toFixed(4))
                  // d3.select("#max_thickness").text(coefficient[1].toFixed(4))
                  // d3.select("#Xt").text('(' + coefficient[2].toFixed(2) + ')')
                  // d3.select("#max_camber").text(coefficient[3].toFixed(4))
                  // d3.select("#Xf").text('(' + coefficient[4].toFixed(2) + ')')
                  // d3.select("#leading_edge_radius").text(coefficient[5].toFixed(4))
                  // d3.select("#te_angle").text(coefficient[6].toFixed(4))

                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[0]], 'left', _this.bar_container_id[0], 1.2, 0.8, 0)
                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[1]], 'left', _this.bar_container_id[1], 0.5, 0, coefficient[2])
                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[3]], 'left', _this.bar_container_id[2], 0.3, -0.1, coefficient[4])
                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[5]], 'left', _this.bar_container_id[3], 0.05, 0, 0)
                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[6]], 'left', _this.bar_container_id[4], -100, 180, 0)

                }
              } else {
                // 修改右侧示例图
                d3.select("#click_end")
                .attr("src", `http://211.81.55.138:8086/static/${dataset_type}_single_samples/${_this.image_number}.png?t=` + Math.random())
                if(dataset_type === "MNIST") {
                  // 显示类别
                  d3.select("#classified_type_2").text(_this.cifar10_classes[label])
                  // 显示预测类别
                  d3.select("#predicted_classified_type_2").text(_this.cifar10_classes[predicted])
                  // 显示置信度
                  d3.select("#confidence_value_2").text(confidence.toFixed(3))
                  // 显示置信度
                  _this.draw_double_confidence_bar_with_side(confidence_list, 'right')
                }else if (dataset_type === "Airfoil") {
                  // d3.select("#chord_length2").text(coefficient[0].toFixed(4))
                  // d3.select("#max_thickness2").text(coefficient[1].toFixed(4))
                  // d3.select("#Xt2").text('(' + coefficient[2].toFixed(2) + ')')
                  // d3.select("#max_camber2").text(coefficient[3].toFixed(4))
                  // d3.select("#Xf2").text('(' + coefficient[4].toFixed(2) + ')')
                  // d3.select("#leading_edge_radius2").text(coefficient[5].toFixed(4))
                  // d3.select("#te_angle2").text(coefficient[6].toFixed(4))

                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[0]], 'right', _this.bar_container_id[0], 1.2, 0.8, 0)
                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[1]], 'right', _this.bar_container_id[1], 0.5, 0, coefficient[2])
                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[3]], 'right', _this.bar_container_id[2], 0.3, -0.1, coefficient[4])
                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[5]], 'right', _this.bar_container_id[3], 0.05, 0, 0)
                  _this.draw_double_confidence_bar_with_single_attribute([coefficient[6]], 'right', _this.bar_container_id[4], -100, 180, 0)

                  d3.select('#aerodynamics_coefficient_image').style('display', 'block')
                  d3.select('#aerodynamics_coefficient_image').attr("src", `http://211.81.55.138:8086/static/Airfoil_analysis/cl2.png?t=` + Math.random())
                }
              }

              // 恢复鼠标设置
              heatMap_svg.style("cursor", "pointer");
            })

          })

        } else {
          // 取消点击操作
          heatMap_svg.style("cursor", "default");
          neighborhood_grid_svg.style("cursor", "default");

          if (this.$store.state.isClickSelect === false) {
            heatMap_svg.on("click", null)
          }
        }
      }
    },

    // 监听isClickNeighborhoodView是否改变
    "$store.state.isClickNeighborhoodView": {
      deep: true,
      handler: function (v) {
        if (this.$store.state.isClickNeighborhoodView === true) {
          // 使得其他几个限制的按钮为false
          if (this.$store.state.isClickBoxZoom) {
            this.$store.commit("setIsClickBoxZoom", false)
          }
          if (this.$store.state.isClickBoxSelect) {
            this.$store.commit("setIsClickBoxSelect", false)
          }
          if (this.$store.state.isClickSelect) {
            this.$store.commit("setIsClickSelect", false)
          }
          if (this.$store.state.isClickLineSelect) {
            this.$store.commit("setIsClickLineSelect", false)
          }
          if (this.$store.state.isClickPan) {
            this.$store.commit("setIsClickPan", false)
          }
        }
      }
    },

    // 监听LowerBound和ResolutionStep
    "$store.state.lowerBound": {
      deep: true,
      handler: function (v) {
        let lowerBound = this.$store.state.lowerBound
        let step = this.$store.state.resolutionStep

        for (let i = 0; i < this.color.length - 1; i++) {
          let num = lowerBound + i * step;
          this.thresholds[i + 1] = num.toFixed(2);
        }

        this.draw_heatMap();
      }
    },

    "$store.state.resolutionStep": {
      deep: true,
      handler: function (v) {
        let lowerBound = this.$store.state.lowerBound
        let step = this.$store.state.resolutionStep

        for (let i = 0; i < this.color.length - 1; i++) {
          let num = lowerBound + i * step;
          this.thresholds[i + 1] = num.toFixed(2);
        }

        this.draw_heatMap();
      }
    },

    // 监听是否绘制
    "$store.state.isShowCentroids": {
      deep: true,
      handler: function (v) {
        if (this.$store.state.isShowCentroids === 'true') {
          this.draw_point();
        } else {
          let heatMap_svg = d3.select("#center_heatMap_svg")
          heatMap_svg.select("#centroids_coords_g")
          .selectAll("circle")
          .remove()
        }
      }
    },

    // 监听绘制neighborhood
    "$store.state.neighborhoodCoordinate": {
      deep: true,
      handler: function (v) {
        this.draw_neighborhood_point()
      }
    },

    "$store.state.isShowMap": {
      deep: true,
      handler: function (v) {
        let heatMap_svg = d3.select("#center_heatMap_svg")

        console.log("hihihi")
        if (this.$store.state.isShowMap === 'true') {
          heatMap_svg.select("#heatMap_g").style("visibility", "visible");
        } else {
          heatMap_svg.select("#heatMap_g").style("visibility", "hidden");
        }
      }
    },
    // 监听attributeSetValue来更新视图
    "$store.state.attributeSetValue": {
      deep: true,
      handler: function (v) {
        this.loading = true;
        this.$store.commit("setIsClickErase", !this.$store.state.isClickErase);
        let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")
        let neighborhood_grid_svg_g = neighborhood_grid_svg.select("#neighborhood_grid_g")
        // 恢复按钮
        if (this.$store.state.isClickPan === false) {
          this.$store.commit("setIsClickPan", true)
        }
        if (this.$store.state.isClickBoxZoom) {
          this.$store.commit("setIsClickBoxZoom", false)
        }
        if (this.$store.state.isClickBoxSelect) {
          this.$store.commit("setIsClickBoxSelect", false)
        }
        if (this.$store.state.isClickSelect) {
          this.$store.commit("setIsClickSelect", false)
        }
        if (this.$store.state.isClickLineSelect) {
          this.$store.commit("setIsClickLineSelect", false)
        }
        if (this.$store.state.isClickNeighborhoodView) {
          this.$store.commit("setIsClickNeighborhoodView", false)
        }

        neighborhood_grid_svg_g.selectAll("image")
        .remove()
        neighborhood_grid_svg_g.selectAll("rect")
        .remove()
        neighborhood_grid_svg.select("#neighborhood_image_center_g").selectAll("g")
        .remove()
        this.draw_init_latent_space()
        // this.loading = false;
      }
    },

    // 监听dataType来更新视图
    "$store.state.dataSetValue": {
      deep: true,
      handler: function (v) {
        this.loading = true;
        this.$store.commit("setIsClickErase", !this.$store.state.isClickErase);
        let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")
        let neighborhood_grid_svg_g = neighborhood_grid_svg.select("#neighborhood_grid_g")
        // 恢复按钮
        if (this.$store.state.isClickPan === false) {
          this.$store.commit("setIsClickPan", true)
        }
        if (this.$store.state.isClickBoxZoom) {
          this.$store.commit("setIsClickBoxZoom", false)
        }
        if (this.$store.state.isClickBoxSelect) {
          this.$store.commit("setIsClickBoxSelect", false)
        }
        if (this.$store.state.isClickSelect) {
          this.$store.commit("setIsClickSelect", false)
        }
        if (this.$store.state.isClickLineSelect) {
          this.$store.commit("setIsClickLineSelect", false)
        }
        if (this.$store.state.isClickNeighborhoodView) {
          this.$store.commit("setIsClickNeighborhoodView", false)
        }

        neighborhood_grid_svg_g.selectAll("image")
        .remove()
        neighborhood_grid_svg_g.selectAll("rect")
        .remove()
        neighborhood_grid_svg.select("#neighborhood_image_center_g").selectAll("g")
        .remove()
        this.draw_init_latent_space()
      }
    },
  },
  methods: {
    // 修改单击事件，以及划线比较事件中产生的点，线，图的位置
    zoom_the_click_result(new_xScale, new_yScale) {
      let heatMap_svg = d3.select("#center_heatMap_svg")
      // 标记图标的大小
      const icon_size = 16;
      const rectWidth = 40;

      // 修改点: 添加偏移
      heatMap_svg.select("#image_and_circle_g").selectAll("circle")
      .attr("cx", function () {
        let pos_x = parseFloat(d3.select(this).attr("pos_x"))
        let new_cx = new_xScale(pos_x)
        return new_cx;
      })
      .attr("cy", function () {
        let pos_y = parseFloat(d3.select(this).attr("pos_y"));
        let new_cy = new_yScale(pos_y)
        return new_cy;
      })
      // 修改图片: 添加偏移
      heatMap_svg.select("#image_and_circle_g").selectAll("image")
      .attr("x", function () {
        let pos_x = parseFloat(d3.select(this).attr("pos_x"))
        let new_cx = new_xScale(pos_x)
        return new_cx;
      })
      .attr("y", function () {
        let pos_y = parseFloat(d3.select(this).attr("pos_y"));
        let new_cy = new_yScale(pos_y)
        return new_cy;
      })

      // 划线对比产生结果移动
      heatMap_svg.select("#image_compare_g").selectAll("line")
      .attr("x1", function () {
        let pos_x1 = parseFloat(d3.select(this).attr("pos_x1"));
        let new_x1 = new_xScale(pos_x1);
        return new_x1;
      })
      .attr("y1", function () {
        let pos_y1 = parseFloat(d3.select(this).attr("pos_y1"));
        let new_y1 = new_yScale(pos_y1);
        return new_y1;
      })
      .attr("x2", function () {
        let pos_x2 = parseFloat(d3.select(this).attr("pos_x2"));
        let new_x2 = new_xScale(pos_x2);
        return new_x2;
      })
      .attr("y2", function () {
        let pos_y2 = parseFloat(d3.select(this).attr("pos_y2"));
        let new_y2 = new_yScale(pos_y2);
        return new_y2;
      })
      // 修改点
      heatMap_svg.select("#image_compare_g").selectAll("circle")
      .attr("cx", function () {
        let pos_x = parseFloat(d3.select(this).attr("pos_x"))
        let new_cx = new_xScale(pos_x)
        return new_cx;
      }).attr("cy", function () {
        let pos_y = parseFloat(d3.select(this).attr("pos_y"));
        let new_cy = new_yScale(pos_y)
        return new_cy;
      })
      // 修改图例
      heatMap_svg.select("#image_compare_g").selectAll("g").selectAll("path")
      .attr("transform", function () {
        var pos_x = parseFloat(d3.select(this).attr("pos_x"))
        var new_x = new_xScale(pos_x)
        var pos_y = parseFloat(d3.select(this).attr("pos_y"))
        var new_y = new_yScale(pos_y)
        // 这个icon_size在control.js中定义了
        return "translate(" + String(Number(new_x) - icon_size / 2) + "," + String(Number(new_y) - icon_size) + ")"
      })
      // 修改采样中心点的大小
      heatMap_svg.select("#image_center_g").selectAll("g").selectAll("path")
      .attr("transform", function () {
        var pos_x = parseFloat(d3.select(this).attr("pos_x"))
        var new_x = new_xScale(pos_x)
        var pos_y = parseFloat(d3.select(this).attr("pos_y"))
        var new_y = new_yScale(pos_y)
        // 这个icon_size在control.js中定义了
        return "translate(" + String(Number(new_x) + rectWidth - icon_size + 3) + "," + String(Number(new_y) + rectWidth - icon_size + 2) + ")"
      })

    },

    zoom_the_click_centroids_circle(new_xScale, new_yScale) {
      let heatMap_svg = d3.select("#center_heatMap_svg")

      // 修改点: 添加偏移
      heatMap_svg.select("#centroids_coords_g").selectAll("circle")
      .attr("cx", function () {
        let pos_x = parseFloat(d3.select(this).attr("pos_x"))
        let new_cx = new_xScale(pos_x)
        return new_cx;
      })
      .attr("cy", function () {
        let pos_y = parseFloat(d3.select(this).attr("pos_y"));
        let new_cy = new_yScale(pos_y)
        return new_cy;
      })
    },

    // 改变分辨率事件
    async draw_change_resolution() {
      this.loading = true;
      await getChangeResolution(this.$store.state.resolution, this.$store.state.extent, this.$store.state.dataSetValue).then((res) => {
        this.heatMap_data = res.data.data;
        this.bins = this.$store.state.resolution;
        this.loading = false;
        this.draw_heatMap();
        this.$store.commit("setConfidence", res.data.data)
      })
    },

    // 根据阈值范围类型和类别修改图例
    change_legends() {
      for (let i = 1; i < this.color.length; i++) {
        d3.select("#threshold" + (i-1).toString()).style("background-color", this.color[i])
        if(i !== this.color.length -1) {
          d3.select("#threshold-" + (i-1).toString() + "-value").text(this.thresholds[i] + " ~ " + this.thresholds[i + 1])
        } else {
          d3.select("#threshold-" + (i-1).toString() + "-value").text(" ≥ " + this.thresholds[i])
        }
      }
    },

    // TopPanel中setting的颜色板块
    init_setting_panel() {
      let _this = this
      // Define color scale
      const colorScales = [
        ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#0570b0', '#08519c', '#08306b', '#08306b'],
        ['#08519c', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a'],
        ['#440154', '#45225f', '#47316c', '#474076', '#3e4e87', '#32678d', '#26818e', '#24a383', '#38bb70', '#91d74b', '#fde725'], // Viridis
        ['#fde725', '#a1d646', '#38bb6f', '#25a282', '#27808e', '#32658d', '#3f4a86', '#464076', '#47306b', '#451d60', '#440154'],
        ['#0d0887', '#380598', '#5f00a4', '#8508a9', '#a72295', '#c23d7e', '#d95769', '#eb724f', '#f89139', '#fcb62e', '#fca636'], // Plasma
        ['#fca636', '#fcb72f', '#f89239', '#eb704f', '#d95669', '#c23d7e', '#a72295', '#8508a9', '#5f00a4', '#390497', '#0d0887']

        // ['#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027'],
        // ['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'],
        // ['#440154', '#482777', '#3E4989', '#31688E', '#26828E', '#1F9E89', '#35B779', '#6DCD59', '#FDE725'], // Viridis
        // ['#FDE725', '#6DCD59', '#35B779', '#1F9E89', '#26828E', '#31688E', '#3E4989', '#482777', '#440154'],
        // ['#0D0887', '#41049D', '#6A00A8', '#8F0DA4', '#B12A90', '#CC4778', '#E16462', '#F2844B', '#FCA636'], // Plasma
        // ['#FCA636', '#F2844B', '#E16462', '#CC4778', '#B12A90', '#8F0DA4', '#6A00A8', '#41049D', '#0D0887']
      ];

      // Create a container for each color scale
      const color_container = d3.select("#color-scale-container");

      // 初始化选择颜色
      let checked_color_index = 0
      if(this.$store.state.dataSetValue === "MNIST") {
        checked_color_index = 1
      } else {
        checked_color_index = 0
      }

      colorScales.forEach((scale, index) => {
        const scales = color_container.append("div")
            .datum(scale)
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "5px")

        scales.append("input")
            .attr("type", "radio")
            .attr("name", "colorScale")
            .attr("checked", (d, i) => index === checked_color_index ? true : null)
            .style("margin-right", "10px")
            .on("change", function (event, d) {
              // d为点击的scales中的数据数组
              let color_tmp = d;
              // 映射颜色 添加初始颜色第一个为#ffffff
              if(color_tmp[0] !== "#ffffff")
                color_tmp.unshift('#ffffff');
              _this.color = color_tmp
              _this.draw_heatMap();
            })

        scales.append("svg")
            .attr("width", 200)
            .attr("height", 30)
            .each(function (scale) {
              const svg = d3.select(this);
              svg.selectAll("rect")
                  .data(scale)
                  .enter()
                  .append("rect")
                  .attr("x", (d, i) => i * 20)
                  .attr("y", 0)
                  .attr("width", 20)
                  .attr("height", 30)
                  .attr("fill", d => d)
                  .style("cursor", "pointer")
                  .on("click", function (event, d) {
                    d3.selectAll("input[name='colorScale']")
                        .property("checked", function () {
                          // input元素的下一个兄弟节点正好是svg选择对应的DOM节点 则返回true
                          return this.nextSibling === svg.node();
                        });
                    // d为点击的颜色
                    let color_tmp = scale;
                    // 映射颜色 添加初始颜色第一个为#ffffff
                    if(color_tmp[0] !== "#ffffff")
                      color_tmp.unshift('#ffffff');
                    _this.color = color_tmp
                    _this.draw_heatMap();
                  });
            });
      })
    },

    // 初始化绘制图像
    async draw_init_latent_space() {
      console.log("draw init latent space")
      await getInitLatentSpace(this.$store.state.resolution, this.$store.state.attributeSetValue, this.$store.state.dataSetValue).then((res) => {
        // data
        // this.heatMap_data = res.data.data;
        // class
        this.heatMap_data = res.data.data;
        if (this.$store.state.dataSetValue === "Airfoil") {
          let filteredData = this.heatMap_data.filter(value => value !== -2);

          let max = Math.max(...filteredData)
          let min = Math.min(...filteredData)

          this.$store.commit("setAttributeMin", parseFloat(min.toFixed(2)))
          this.$store.commit("setAttributeMax", parseFloat(max.toFixed(2)))

          let level = 10
          let interval = (max - min) / level
          let threshold = [-2]

          for (let i = 0; i <= level; i++) {
            threshold.push((min + i * interval).toFixed(2))
          }

          this.thresholds = threshold
          this.color = ['#ffffff', '#f7fbff', '#deebf7', '#c6dbef',
            '#9ecae1', '#6baed6','#4292c6','#2171b5',
            '#0570b0','#08519c','#08306b', '#08306b']
        } else if (this.$store.state.dataSetValue === "MNIST") {
          this.color = ['#ffffff', '#08519c', '#3182bd', '#6baed6',
            '#9ecae1', '#c6dbef', '#ffffcc','#ffeda0',
            '#fed976','#feb24c','#fd8d3c','#fc4e2a']
          this.thresholds= [-2, -1.0, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1]

          this.$store.commit("setAttributeMin", -1)
          this.$store.commit("setAttributeMax", 1)
        }

        this.centroids_coords = res.data.centroids_coords
        this.centroids_class = res.data.centroids_class
        this.centroids_attribute = res.data.centroids_attribute

        let extent = {
          "start_x": res.data.x_min,
          "end_x": res.data.x_max,
          "start_y": res.data.y_min,
          "end_y": res.data.y_max
        }
        this.$store.commit("setExtent", extent);
        // 前端设置threshold
        // let thresholds = res.data.thresholds
        // for(let i = 0; i < thresholds.length; i++) {
        //   this.thresholds.push(thresholds[i])
        // }
        // this.thresholds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        // console.log("threshold:", this.thresholds)

        this.$store.commit("setIsDrawHeatMap", !this.$store.state.isDrawHeatMap);
        // this.draw_point()

        this.$store.commit("setConfidence", res.data.data)
        // this.$store.commit("setClassification", res.data.class)

        this.init_setting_panel()
      })
      await getGridImage(10, this.$store.state.extent, this.$store.state.dataSetValue).then((res) => {
        this.img_coords_confidence = res.data.confidence
        this.loading = false
        this.draw_heatMap();
      })
    },

    async draw_crop_latent_space() {
      let heatMap_svg = d3.select("#center_heatMap_svg")
      this.loading = true;

      await getGridImage(10, this.$store.state.extent, this.$store.state.dataSetValue).then((res) => {
        this.img_coords_confidence = res.data.confidence
        console.log("getGridImage")
      })

      await getTransformLatentSpace(this.$store.state.sampleNumber, this.$store.state.resolution, this.$store.state.extent, this.$store.state.dataSetValue).then((res) => {
        this.loading = false;
        // 隐藏那个选框
        heatMap_svg.select("#selection_inner_rect")
        .attr("height", 0)
        .attr("width", 0)

        this.heatMap_data = res.data.data

        // 重新绘制
        let contour_scale = this.heatMap_width / this.bins;

        let contours = d3.contours()
        .size([this.bins, this.bins])
        .thresholds(this.thresholds)
        .smooth(true)
        (this.heatMap_data);

        heatMap_svg.select("#heatMap_g").selectAll("path")
        .data(contours, d => d.value)
        .join("path")
        .attr("d", d3.geoPath())
        .attr("transform", "scale(" + contour_scale + ")")
        .attr("fill", (d, i) => this.color[i])
        .attr("stroke", "#fff")
        .attr("stroke-width", "0.0001px")

        // 绘制网格图
        heatMap_svg.selectAll(".imageGrid").remove()
        let rectWidth = 40
        let gridNum = 10

        let image_grid_svg_g = heatMap_svg.select("#image_grid_g")

        let dataset_type = this.$store.state.dataSetValue

        //添加图片
        image_grid_svg_g.selectAll("image")
        .data(this.img_coords_confidence)
        .join("image")
        .attr("number", (d, i) => i) //方便后续定位图片
        .attr("class", 'imageGrid')
        .attr("href", function (d, i) {
          if(d === -2) {
            return "";
          } else {
            return `http://211.81.55.138:8086/static/${dataset_type}/${i}.png?t=` + Math.random();
          }
        }.bind(this))
        .attr("display", function (d, i) {
          if(d === -2) {
            return "none";
          }
        }.bind(this))
        .attr("height", rectWidth)
        .attr("width", rectWidth)
        .attr("x", (d, i) => (rectWidth * 20 / gridNum) * (i % gridNum) + rectWidth / 2)
        .attr("y", (d, i) => (rectWidth * 20 / gridNum) * Math.floor(i / gridNum) + rectWidth / 2)
        .attr("data-bs-toggle", "tooltip")
        .attr("title", "image")
        .attr("border", "5")

        // 更新坐标轴
        let xAxis = d3.axisBottom(this.xScale)
        heatMap_svg.select("#x_g")
        .call(xAxis);
        // 绘制y轴
        let yAxis = d3.axisRight(this.yScale);
        heatMap_svg.select("#y_g")
        .call(yAxis);
      })
    },

    draw_heatMap() {
      // 绘制比例尺
      this.change_legends()

      // 缩放比 用于d3.contours()
      let contour_scale = this.heatMap_width / this.bins;

      // 定义X轴scale
      this.xScale = d3.scaleLinear()
      .domain([this.$store.state.extent.start_x, this.$store.state.extent.end_x])
      .range([0, this.heatMap_width]);

      // 定义Y轴scale
      this.yScale = d3.scaleLinear()
      .domain([this.$store.state.extent.start_y, this.$store.state.extent.end_y])
      .range([0, this.heatMap_height]);

      // 设置热力图大小
      let heatMap_svg = d3.select("#center_heatMap_svg")
      .attr("width", this.heatMap_width)
      .attr("height", this.heatMap_height)
      .style("cursor", "move"); // 初始化可以移动

      // 构建等值线返回由GeoJSON构成的数组 value是一个长度为nxm的数组
      let contours = d3.contours()
        .size([this.bins, this.bins])
        .thresholds(this.thresholds)
        .smooth(true)
        (this.heatMap_data);

      let selection_contour = heatMap_svg.select("#heatMap_g").selectAll("path")
      .data(contours, d => d.value)
      .join("path")
      .attr("d", d3.geoPath())
      .attr("transform", "scale(" + contour_scale + ")")
      .attr("fill", (d, i) => this.color[i])
      // .attr("fill", function(d, i) {
      //   console.log(i, this.color[i]);  // 添加 console.log
      //   return this.color[i];
      // }.bind(this))
      .attr("stroke", "#fff")
      .attr("stroke-width", "0.0001px")

      // 绘制点
      if (this.$store.state.isShowCentroids === 'true') {
        this.draw_point()
      }

      // 绘制网格图
      heatMap_svg.selectAll(".imageGrid").remove()
      let rectWidth = 40
      let gridNum = 10

      let image_grid_svg_g = heatMap_svg.select("#image_grid_g")

      let dataset_type = this.$store.state.dataSetValue

      //添加图片
      image_grid_svg_g.selectAll("image")
      .data(this.img_coords_confidence)
      .join("image")
      .attr("number", (d, i) => i) //方便后续定位图片
      .attr("class", 'imageGrid')
      .attr("href", function (d, i) {
        if(d === -2) {
          return "";
        } else {
          return `http://211.81.55.138:8086/static/${dataset_type}/${i}.png?t=` + Math.random();
        }
      }.bind(this))
      .attr("display", function (d, i) {
        if(d === -2) {
          return "none";
        }
      }.bind(this))
      .attr("height", rectWidth)
      .attr("width", rectWidth)
      .attr("x", (d, i) => (rectWidth * 20 / gridNum) * (i % gridNum) + rectWidth / 2 )
      .attr("y", (d, i) => (rectWidth * 20 / gridNum) * Math.floor(i / gridNum) + rectWidth / 2 )
      .attr("data-bs-toggle", "tooltip")
      .attr("title", "image")
      .attr("border", "5")

      // 绘制x轴
      let xAxis = d3.axisBottom(this.xScale)
      let gX = heatMap_svg.select("#x_g")
      .call(xAxis);
      // 绘制y轴
      let yAxis = d3.axisRight(this.yScale);
      let gY = heatMap_svg.select("#y_g")
      .call(yAxis);

      let _this = this;
      let new_xScale, new_yScale;
      // 定义zoom
      let zoom = d3.zoom()
        .on("zoom", function (event) {
          // 修改热力图
          heatMap_svg.select("#heatMap_g").attr("transform", event.transform);
          // 修改热力图中产生的圈和图片
          heatMap_svg.select("#image_and_circle_g").attr("transform", event.transform)
          heatMap_svg.select("#image_compare_g").attr("transform", event.transform)
          // 增加点
          heatMap_svg.select("#centroids_coords_g").attr("transform", event.transform)
          // 修改中心点的位置
          heatMap_svg.select("#image_center_g").attr("transform", event.transform)

          // 修改坐标轴
          new_xScale = event.transform.rescaleX(_this.xScale);
          new_yScale = event.transform.rescaleY(_this.yScale);
          gX.call(xAxis.scale(new_xScale));
          gY.call(yAxis.scale(new_yScale));
          let extent = {
            "start_x": new_xScale.domain()[0],
            "end_x": new_xScale.domain()[1],
            "start_y": new_yScale.domain()[0],
            "end_y": new_yScale.domain()[1]
          }
          _this.$store.commit("setExtent", extent);
        })
        .on("end", async function (event) {
          _this.xScale = new_xScale;
          _this.yScale = new_yScale;
          event.transform.x = 0;
          event.transform.y = 0;
          event.transform.k = 1;
          _this.loading = true;
          await getGridImage(10, _this.$store.state.extent, _this.$store.state.dataSetValue).then((res) => {
            this.img_coords_confidence = res.data.confidence
            console.log("getGridImage")
          })
          await getTransformLatentSpace(_this.$store.state.sampleNumber, _this.$store.state.resolution, _this.$store.state.extent, _this.$store.state.dataSetValue).then((res) => {
            // 让位移归位
            heatMap_svg.select("#heatMap_g").attr("transform", event.transform)
            heatMap_svg.select("#image_and_circle_g").attr("transform", event.transform)
            heatMap_svg.select("#image_compare_g").attr("transform", event.transform)
            heatMap_svg.select("#centroids_coords_g").attr("transform", event.transform)
            // 修改中心点的位置
            heatMap_svg.select("#image_center_g").attr("transform", event.transform)

            _this.loading = false;
            // 重新绘制 触发image_grid更新
            _this.$store.commit("setIsDrawHeatMap", !_this.$store.state.isDrawHeatMap)

            // 让点击产生的结果保持不变
            _this.zoom_the_click_result(new_xScale, new_yScale);
            // 让图中的circle 保持不变
            _this.zoom_the_click_centroids_circle(new_xScale, new_yScale);

            // if(res.data.code === 101) {
            //   _this.heatMap_data = res.data.data
            //   _this.thresholds = res.data.thresholds
            // } else if (res.data.code === 102) {
            //   _this.heatMap_data = []
            // }

            _this.heatMap_data = res.data.data

            _this.$store.commit("setConfidence", res.data.data)
            // _this.$store.commit("setClassification", res.data.class)

            // _this.thresholds = res.data.thresholds
            // 重新绘制
            let contour_scale = _this.heatMap_width / _this.bins;

            let contours = d3.contours()
            .size([_this.bins, _this.bins])
            .thresholds(_this.thresholds)
            .smooth(true)
            (_this.heatMap_data);

            heatMap_svg.select("#heatMap_g").selectAll("path")
            .data(contours, d => d.value)
            .join("path")
            .attr("d", d3.geoPath())
            .attr("transform", "scale(" + contour_scale + ")")
            .attr("fill", (d, i) => _this.color[i])
            // .attr("fill", function(d, i) {
            //   console.log(i, this.color[i]);  // 添加 console.log
            //   return _this.color[i];
            // }.bind(_this))
            .attr("stroke", "#fff")
            .attr("stroke-width", "0.0001px")

            heatMap_svg.selectAll(".imageGrid").remove()
            let rectWidth = 40
            let gridNum = 10

            let image_grid_svg_g = heatMap_svg.select("#image_grid_g")

            let dataset_type = _this.$store.state.dataSetValue

            //添加图片
            image_grid_svg_g.selectAll("image")
            .data(this.img_coords_confidence)
            .join("image")
            .attr("number", (d, i) => i) //方便后续定位图片
            .attr("class", 'imageGrid')
            .attr("href", function (d, i) {
              if(d === -2) {
                return "";
              } else {
                return `http://211.81.55.138:8086/static/${dataset_type}/${i}.png?t=` + Math.random();
              }
            }.bind(this))
            .attr("display", function (d, i) {
              if(d === -2) {
                return "none";
              }
            }.bind(this))
            .attr("height", rectWidth)
            .attr("width", rectWidth)
            .attr("x", (d, i) => (rectWidth * 20 / gridNum) * (i % gridNum) + rectWidth / 2 )
            .attr("y", (d, i) => (rectWidth * 20 / gridNum) * Math.floor(i / gridNum) + rectWidth / 2)
            .attr("data-bs-toggle", "tooltip")
            .attr("title", "image")
            .attr("border", "5")

            // let xAxis = d3.axisBottom(xScale)
            // heatMap_svg.select("#x_g")
            // .call(xAxis);
            // // 绘制y轴
            // let yAxis = d3.axisRight(yScale);
            // heatMap_svg.select("#y_g")
            // .call(yAxis);

            // 触发image_grid更新
            // _this.$store.commit("setIsDrawHeatMap", !_this.$store.state.isDrawHeatMap);
          })

        })

      this.zoom = zoom
      heatMap_svg.call(zoom)
    },

    // 辅助工具 画点
    draw_point() {
      let heatMap_svg = d3.select("#center_heatMap_svg")
      let _this = this

      let dataset_type = this.$store.state.dataSetValue

      // 添加tip
      // const tip = d3Tip()
      // .attr('class', 'd3-tip')
      // .offset([ -10, 0 ])
      // .html((d) => {
      //   return "<strong>class: </strong><span class='tip-details'>" + d + "<br></span>";
      // })
      // heatMap_svg.call(tip)

      heatMap_svg.select("#centroids_coords_g")
      .selectAll("circle")
      .data(this.centroids_coords)
      .enter()
      .append("circle")
      .attr("cx", (d) => {
        return this.xScale(d[0])
      })
      .attr("cy", (d) => {
        return this.yScale(d[1])
      })
      .attr("pos_x", (d) => {
        return d[0]
      })
      .attr("pos_y", (d) => {
        return d[1]
      })
      .attr("idx", (d, i) => {
        return i
      })
      .attr("r", 9)
      .attr("fill", (d, i) => {
        if (dataset_type === "MNIST") {
          return this.point_color[this.centroids_class[i]]
        } else if (dataset_type === "Airfoil") {
          let attribute_value = _this.centroids_attribute[i]
          let len = _this.thresholds.length
          for (let i = 0; i < len - 1; i++) {
            if (attribute_value >= _this.thresholds[i] && attribute_value < _this.thresholds[i + 1]) {
              return _this.color[i];
            }
          }
          // 如果 x 超出所有阈值范围，返回一个默认颜色
          return _this.color[len - 1];        }
      })
      .on("mouseover", function (e, d) {
        if (dataset_type === "MNIST") {
          let idx = d3.select(this).attr("idx")
          let sample_class = _this.cifar10_classes[_this.centroids_class[idx]]
          tip.show(sample_class, this);
        }
      })
      .on("mouseout", function (e, d) {
        if (dataset_type === "MNIST") {
          let idx = d3.select(this).attr("idx")
          let sample_class = _this.cifar10_classes[_this.centroids_class[idx]]
          tip.hide(sample_class, this);
        }
      })
    },

    // 画neighborhood对应的点
    draw_neighborhood_point() {
      let heatMap_svg = d3.select("#center_heatMap_svg")
      let _this = this

      let dataset_type = this.$store.state.dataSetValue
      let coordinats = this.$store.state.neighborhoodCoordinate

      // 标记图标的大小
      const icon_size = 16
      // const d = "M823.279 678.842l2.638 0.798 1.312 0.402 2.607 0.809c0.433 0.135 0.865 0.27 1.296 0.407l2.575 0.818 1.28 0.412 2.544 0.83c0.422 0.138 0.844 0.277 1.264 0.417l2.512 0.839c2.501 0.842 4.97 1.695 7.407 2.558l2.426 0.866 1.205 0.436 2.393 0.876a444.156 444.156 0 0 1 9.352 3.571l2.282 0.91 2.26 0.916a363.655 363.655 0 0 1 18.293 8.05l2.042 0.979c13.2 6.378 24.917 13.166 35.034 20.344C953.663 745.126 971 770.553 971 800c0 29.447-17.337 54.874-46.999 75.921-15.045 10.675-33.63 20.486-55.368 29.373l-2.26 0.916-2.282 0.91c-1.147 0.453-2.302 0.903-3.466 1.351l-2.338 0.893c-1.174 0.445-2.357 0.887-3.548 1.327l-2.393 0.876-2.415 0.87c-1.213 0.433-2.434 0.863-3.663 1.291l-2.47 0.853-2.49 0.846c-1.25 0.421-2.51 0.84-3.776 1.256l-2.544 0.83-1.28 0.411-2.576 0.82c-0.862 0.271-1.727 0.542-2.596 0.811l-2.618 0.806-2.638 0.798C740.602 945.972 630.092 960 512.5 960c-117.592 0-228.102-14.028-310.78-38.841l-2.638-0.798-2.618-0.806c-0.869-0.27-1.734-0.54-2.596-0.812l-2.576-0.819-1.28-0.412-2.544-0.829a534.97 534.97 0 0 1-3.776-1.256l-2.49-0.846-2.47-0.853c-1.229-0.428-2.45-0.858-3.663-1.291l-2.415-0.87-2.393-0.876c-1.19-0.44-2.374-0.882-3.548-1.327l-2.338-0.893a431.314 431.314 0 0 1-3.466-1.352l-2.282-0.909-2.26-0.916c-21.739-8.887-40.323-18.698-55.368-29.373C71.337 854.874 54 829.447 54 800c0-29.447 17.337-54.874 46.999-75.92 10.116-7.178 21.833-13.966 35.033-20.344l2.043-0.978a363.65 363.65 0 0 1 18.292-8.051l2.26-0.916 2.282-0.91c1.147-0.453 2.302-0.903 3.466-1.351l2.338-0.893 1.177-0.444 2.371-0.883 2.393-0.876 2.415-0.87c1.213-0.433 2.434-0.863 3.663-1.291l2.47-0.853a529.177 529.177 0 0 1 6.266-2.103l2.544-0.829 1.28-0.412 2.576-0.818c0.43-0.136 0.862-0.272 1.295-0.407l2.607-0.809 2.628-0.802c0.44-0.133 0.88-0.266 1.322-0.398 16.928-5.08 34.768 4.523 39.848 21.45 5.08 16.928-4.523 34.768-21.45 39.849l-2.252 0.68-1.118 0.343-2.22 0.688-2.2 0.692-2.178 0.696-2.158 0.701-1.07 0.352-2.126 0.707-1.054 0.355-2.093 0.713-2.072 0.717-1.028 0.36-2.038 0.723-2.017 0.727-1.995 0.73-0.99 0.367-1.961 0.736-1.94 0.74-1.917 0.742-1.894 0.746-1.872 0.75-0.927 0.376-1.838 0.754c-1.217 0.504-2.419 1.01-3.606 1.519l-1.768 0.763-1.745 0.767-1.721 0.77-1.698 0.772c-0.562 0.258-1.12 0.516-1.675 0.775l-1.65 0.777-1.627 0.78-0.804 0.392-1.59 0.784-0.787 0.393-1.554 0.788-1.53 0.79-1.505 0.792c-0.249 0.132-0.497 0.264-0.744 0.397l-1.468 0.795c-1.213 0.664-2.4 1.33-3.562 1.997l-1.381 0.803a157.46 157.46 0 0 0-7.143 4.443l-1.215 0.813c-0.802 0.542-1.586 1.085-2.353 1.63-7.983 5.664-13.624 11.107-16.93 15.955C118.828 795.57 118 798.016 118 800s0.828 4.432 3.104 7.77c3.306 4.848 8.947 10.291 16.93 15.956a128.74 128.74 0 0 0 2.353 1.63l1.215 0.812a157.455 157.455 0 0 0 7.143 4.443l1.38 0.803a197.271 197.271 0 0 0 5.775 3.19l1.505 0.791 1.53 0.79 1.554 0.788 0.786 0.393 1.59 0.784 0.805 0.391 1.627 0.78 1.65 0.778 1.675 0.775 1.698 0.772 0.857 0.386 1.734 0.768 0.875 0.383 1.768 0.763c0.89 0.381 1.789 0.761 2.696 1.14l1.826 0.756 0.922 0.377 1.86 0.751 1.883 0.748 1.906 0.745 1.928 0.74c0.647 0.247 1.297 0.493 1.95 0.738l1.973 0.734c0.331 0.123 0.663 0.244 0.995 0.366l2.006 0.729 1.011 0.363 2.04 0.722 1.027 0.36 2.071 0.717 2.094 0.714 2.114 0.709 1.066 0.353 2.146 0.702 2.168 0.7 2.19 0.693 1.101 0.346 2.22 0.688 1.119 0.342 2.251 0.681C296.377 882.747 400.782 896 512.5 896c111.718 0 216.124-13.253 292.383-36.14l2.251-0.68 2.23-0.687c0.371-0.114 0.74-0.229 1.109-0.344l2.199-0.692 1.092-0.348 2.168-0.699 2.146-0.702 2.126-0.707 1.054-0.355 2.094-0.714 2.071-0.717 2.05-0.72 1.017-0.362 2.017-0.727c0.668-0.243 1.333-0.486 1.995-0.73l1.972-0.735 0.978-0.368 1.94-0.74c0.321-0.123 0.642-0.246 0.961-0.37l1.906-0.745 1.883-0.748 1.86-0.751 1.838-0.754c1.217-0.504 2.42-1.01 3.606-1.519l1.768-0.763 0.875-0.383 1.734-0.768 0.857-0.386 1.698-0.772 1.675-0.775 1.65-0.778 1.627-0.78c0.269-0.13 0.537-0.26 0.804-0.391l1.59-0.784 0.787-0.393 1.554-0.788 1.53-0.79 1.505-0.792a197.271 197.271 0 0 0 5.774-3.19l1.381-0.802a157.455 157.455 0 0 0 7.143-4.443l1.215-0.813a128.74 128.74 0 0 0 2.353-1.63c7.983-5.664 13.624-11.107 16.93-15.956 2.276-3.337 3.104-5.785 3.104-7.769 0-1.983-0.828-4.43-3.104-7.768-3.306-4.849-8.947-10.292-16.93-15.957-0.384-0.272-0.772-0.543-1.164-0.815l-1.189-0.814-1.215-0.813c-4.708-3.113-9.986-6.195-15.804-9.227l-1.53-0.79-1.554-0.788-0.786-0.393-1.59-0.784c-0.802-0.391-1.612-0.782-2.431-1.171l-1.65-0.778a274.25 274.25 0 0 0-1.675-0.775l-1.698-0.773c-0.57-0.257-1.144-0.513-1.722-0.769l-1.745-0.767-1.768-0.763c-0.89-0.381-1.788-0.761-2.696-1.14l-1.826-0.756-1.849-0.753-0.933-0.375-1.883-0.748-1.906-0.745-0.96-0.37-1.94-0.74-1.962-0.736-1.984-0.732-1-0.365-2.017-0.727-1.017-0.362-2.05-0.72-1.033-0.36-2.082-0.715a458.09 458.09 0 0 0-1.05-0.356l-2.114-0.709-1.065-0.353-2.147-0.703-2.168-0.698-1.092-0.348-2.2-0.692-2.22-0.688-2.24-0.683-1.13-0.34c-16.926-5.08-26.53-22.921-21.45-39.848 5.08-16.928 22.92-26.531 39.848-21.451zM512.5 64c170.608 0 309.225 135.277 309.225 302.545 0 55.07-16.737 110.29-47.39 165.083-25.31 45.244-59.46 89.082-100.245 131.16-31.432 32.43-65.01 61.997-98.596 88.186l-2.424 1.884-2.4 1.854-2.376 1.823-2.35 1.792-2.326 1.762-2.3 1.73-2.272 1.7-2.246 1.667-2.218 1.637-2.19 1.605-2.161 1.573-1.07 0.775-2.117 1.525-2.088 1.493c-0.69 0.493-1.376 0.98-2.057 1.462l-0.693 0.49-1.355 0.954-2.588 1.808-2.422 1.674-1.147 0.786-2.72 1.844-1.679 1.118-0.69 0.449a32 32 0 0 1-34.711-0.325l-0.377-0.248-1.374-0.915-2.321-1.568-1.275-0.871-2.292-1.581-2.495-1.74-2.694-1.9-2.296-1.632-2.32-1.662-2.273-1.641a825.38 825.38 0 0 1-1.148-0.833l-2.315-1.69-1.168-0.857-2.356-1.737-2.382-1.77-2.408-1.801-2.433-1.833-2.458-1.864-2.482-1.895-2.505-1.926-2.528-1.958-2.551-1.988-2.573-2.019-1.294-1.02c-33.676-26.606-67.009-56.37-97.989-88.81-39.81-41.686-73.032-85.016-97.584-129.662-29.598-53.82-45.728-108.034-45.728-162.088C203.275 199.277 341.892 64 512.5 64z m0 64c-135.606 0-245.225 106.977-245.225 238.545 0 42.332 13.074 86.272 37.807 131.248 21.625 39.323 51.553 78.357 87.79 116.302 28.76 30.115 59.908 57.927 91.38 82.791l1.308 1.033 2.6 2.038 2.574 2.005 2.548 1.97 2.522 1.933c0.835 0.64 1.667 1.272 2.493 1.9l2.466 1.863 2.437 1.828c0.403 0.302 0.806 0.602 1.207 0.9l2.392 1.775 2.36 1.738c0.782 0.573 1.559 1.14 2.33 1.702l1.011 0.733 2.521-1.834 1.182-0.866 2.391-1.763 2.429-1.804 2.465-1.845 2.5-1.886c0.42-0.318 0.841-0.637 1.263-0.959l2.553-1.947 1.288-0.988 2.602-2.008 2.445-1.9c31.388-24.475 62.785-52.122 91.996-82.259 37.184-38.364 68.009-77.932 90.346-117.862 25.66-45.867 39.244-90.687 39.244-133.838C757.725 234.977 648.106 128 512.5 128z m0 106.667c76.563 0 138.625 62.086 138.625 138.666S589.063 512 512.5 512s-138.625-62.086-138.625-138.667c0-76.58 62.062-138.666 138.625-138.666z m0 64c-41.21 0-74.625 33.427-74.625 74.666 0 41.24 33.414 74.667 74.625 74.667 41.21 0 74.625-33.427 74.625-74.667s-33.414-74.666-74.625-74.666z"

      let cx = this.xScale(coordinats[0])
      let cy = this.yScale(coordinats[1])

      heatMap_svg.select("#neighborhood_coords_g")
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("pos_x", coordinats[0])
          .attr("pos_y", coordinats[1])
          .attr("r", "3")
          .attr("fill", "#00000")
          .attr("fill-opacity", "1")

      // heatMap_svg.select("#neighborhood_coords_g")
      //     .append("g")
      //     .attr("width", icon_size)
      //     .attr("height", icon_size)
      //     .selectAll("path")
      //     .data(d)
      //     .join("path")
      //     .attr("d", d => d)
      //     .attr("pos_x", coordinats[0])
      //     .attr("pos_y", coordinats[0])
      //     .attr("transform", "translate(" + String(Number(cx) - icon_size / 2) + "," + String(Number(cy) - icon_size - 8) + ")")
      //     .transition()
      //     .duration(800)
      //     .attr("transform", "translate(" + String(Number(cx) - icon_size / 2) + "," + String(Number(cy) - icon_size) + ")")

      let d = ["M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z", "M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]
      heatMap_svg.select("#image_compare_g")
          .append("g")
          .attr("width", icon_size)
          .attr("height", icon_size)
          .selectAll("path")
          .data(d)
          .join("path")
          .attr("d", d => d)
          .attr("pos_x", coordinats[0])
          .attr("pos_y", coordinats[1])
          .attr("transform", "translate(" + String(Number(cx) - icon_size / 2) + "," + String(Number(cy) - icon_size - 8) + ")")
          .transition()
          .duration(800)
          .attr("transform", "translate(" + String(Number(cx) - icon_size / 2) + "," + String(Number(cy) - icon_size) + ")")


      // heatMap_svg.select("#neighborhood_coords_g")
      //     .append("circle")
      //     .attr("cx", (d) => {
      //       return this.xScale(coordinats[0])
      //     })
      //     .attr("cy", (d) => {
      //       return this.yScale(coordinats[1])
      //     })
      //     .attr("pos_x", coordinats[0])
      //     .attr("pos_y", coordinats[1])
      //     .attr("r", 9)
      //     .attr("fill", "#000000")
    },

    draw_single_confidence_bar(confidence) {
      const svg_width = 180;
      const svg_height = 280;
      const rect_height = 17;
      const margin = 10;
      const shift = 13;
      const max_width = 60
      const min_width = 0.1

      // 创建置信度直方图svg
      const svg_confidence = d3.select("#svg_container_probability_distribution")
          .select("#confidence_distribution")
          .attr("width", svg_width)
          .attr("height", svg_height)

      svg_confidence.select("#labels")
          .attr("class", "labels")
          .attr("transform", "translate(60, 5)")

      svg_confidence.select("#bars_2")
          .attr("class", "bars2")
          .attr("transform", "translate(80, 5)")

      //添加矩形
      d3.select('#bars_2')
          .selectAll('rect')
          .data(confidence)
          .join('rect')
          .attr('y', function (d, i) {
            return i * (rect_height + margin);
          })
          .attr('fill', 'grey')
          .attr('height', rect_height)
          .attr("width", 0)
          .transition()
          .duration(2000)
          .attr('width', function (d) {
            return d * max_width + min_width; //2是保底宽度
          })

      //添加文字
      d3.select('#bars_1')
          .selectAll('text')
          .remove()

      d3.select('#bars_1')
          .selectAll('rect')
          .remove()

      d3.select('#bars_2')
          .selectAll('text')
          .data(confidence)
          .join('text')
          .attr("class", 'labels_text')
          .attr("x", 0)
          .attr('y', function (d, i) {
            return i * (rect_height + margin) + shift;
          })
          .text(function (d) {
            return d.toFixed(2);
          })
          .style("fill", function (d) {
            if (d <= 0.5) {
              return "black"
            } else {
              return "red"
            }
          })
          .transition()
          .duration(2000)
          .attr('x', function (d) {
            if (d <= 0.5) {
              return d * max_width;
            } else {
              return d * max_width - 28;
            }
          })

      d3.select('#labels')
          .selectAll('text')
          .data(this.cifar10_classes)
          .join('text')
          .attr('y', function (d, i) {
            return i * (rect_height + margin) + shift;
          })
          .text(function (d) {
            return d;
          })
          .style('text-anchor', 'middle');
    },

    draw_double_confidence_bar_with_side(confidence, side) {
      const svg_width = 180;
      const svg_height = 280;
      const rect_height = 17;
      const margin = 10;
      const shift = 13;
      const max_width = 60
      const min_width = 0.1

      const svg_confidence = d3.select("#svg_container_probability_distribution")
          .select("#confidence_distribution")
          .attr("width", svg_width)
          .attr("height", svg_height)

      svg_confidence.select("#bars_1")
          .attr("class", "bars1")
          .attr("transform", "translate(4, 5)");
      svg_confidence.select("#labels")
          .attr("class", "labels")
          .attr("transform", "translate(90, 5)")
      svg_confidence.select("#bars_2")
          .attr("class", "bars2")
          .attr("transform", "translate(110, 5)")

      if (side === "left") {
        //添加矩形
        d3.select('#bars_1')
            .selectAll('rect')
            .data(confidence)
            .join('rect')
            .attr('y', function (d, i) {
              return i * (rect_height + margin);
            })
            .attr('fill', 'grey')
            .attr('height', rect_height)
            .attr("width", 0)
            .attr('x', function (d) {
              return max_width + min_width;
            })
            .transition()
            .duration(2000)
            .attr('width', function (d) {
              return d * max_width + min_width; //2是保底宽度
            })
            .attr('x', function (d) {
              return max_width - d * max_width;
            })
        //添加文字
        d3.select('#bars_1')
            .selectAll('text')
            .data(confidence)
            .join('text')
            .attr("class", 'labels_text')
            .attr('y', function (d, i) {
              return i * (rect_height + margin) + shift;
            })
            .text(function (d) {
              return d.toFixed(2);
            })
            .attr('x', function (d) {
              return max_width + min_width;
            })
            .style("fill", function (d) {
              if (d <= 0.5) {
                return "black"
              } else {
                return "red"
              }
            })
            .transition()
            .duration(2000)
            .attr('x', function (d) {
              if (d <= 0.5) {
                return max_width - d * max_width - 28;
              } else {
                return max_width - d * max_width + 3;
              }

            })

      } else if (side === "right") {
        //添加矩形
        d3.select('#bars_2')
            .selectAll('rect')
            .data(confidence)
            .join('rect')
            .attr('y', function (d, i) {
              return i * (rect_height + margin);
            })
            .attr('fill', 'grey')
            .attr('height', rect_height)
            .attr("width", 0)
            .transition()
            .duration(2000)
            .attr('width', function (d) {
              return d * max_width + min_width; //2是保底宽度
            })
        //添加文字
        d3.select('#bars_2')
            .selectAll('text')
            .data(confidence)
            .join('text')
            .attr("class", 'labels_text')
            .attr("x", 0)
            .attr('y', function (d, i) {
              return i * (rect_height + margin) + shift;
            })
            .text(function (d) {
              return d.toFixed(2);
            })
            .style("fill", function (d) {
              if (d <= 0.5) {
                return "black"
              } else {
                return "red"
              }
            })
            .transition()
            .duration(2000)
            .attr('x', function (d) {
              if (d <= 0.5) {
                return d * max_width;
              } else {
                return d * max_width - 28;
              }

            })
      }

      d3.select('#labels')
          .selectAll('text')
          .data(this.cifar10_classes)
          .join('text')
          .attr('y', function (d, i) {
            return i * (rect_height + margin) + shift;
          })
          .text(function (d) {
            return d;
          })
          .style('text-anchor', 'middle');
    },

    erase_double_attribute_bar(container_id) {
      const svg_container = d3.select('#' + container_id)
      svg_container.select(".bars_1").selectAll('rect').remove()
      svg_container.select(".bars_1").selectAll('text').remove()

      svg_container.select(".bars_2").selectAll('rect').remove()
      svg_container.select(".bars_2").selectAll('text').remove()
    },

    draw_double_confidence_bar_with_single_attribute(data, side, container_id, max, min, addition_data) {
      const svg_width = 180;
      const svg_height = 30;
      const rect_height = 17;
      const margin = 2;
      const shift = 13;
      const max_width = 60
      const min_width = 0.1

      const range = max - min
      // let data_normalize = (data - min) / range
      let data_normalize = data.map(value => (value - min) / range);
      let left_x = 0
      let right_width = 0

      const svg_container = d3.select('#' + container_id)
      // .style("display", "block")
      .attr("width", svg_width)
      .attr("height", svg_height)

      svg_container.select(".bars_1")
      .attr("transform", "translate(0, 5)");

      svg_container.select(".bars_2")
      .attr("transform", "translate(90, 5)")

      if (side === 'left') {
        svg_container.select(".bars_1")
        .selectAll('rect')
        .data(data_normalize)
        .join('rect')
        .attr('y', margin)
        .attr('fill', '#4093c7')
        .attr('height', rect_height)
        .attr("width", min_width)
        .attr('x', function (d) {
          return svg_width / 2;
        })
        .transition()
        .duration(2000)
        .attr('width', function (d) {
          return d * max_width + min_width; //2是保底宽度
        })
        .attr('x', function (d) {
          left_x = (svg_width / 2) - d * max_width - min_width
          return left_x;
        })

        if (addition_data !== 0) {
          svg_container.select(".bars_1")
          .selectAll('text')
          .remove()

          // 添加文字
          svg_container.select(".bars_1")
          .append('text')
          .data(data)
          .attr("class", 'labels_text')
          .attr('y', shift - 2.5 * margin)
          .text(function (d) {
            return d.toFixed(3);
          })
          .attr('x', function (d) {
            return svg_width / 2;
          })
          .transition()
          .duration(2000)
          .attr('x', function (d) {
            return left_x - 45;
          })

          svg_container.select(".bars_1")
          .append('text')
          .data(data)
          .join('text')
          .attr("class", 'labels_text')
          .attr('y', shift + 3.5 * margin)
          .text(function (d) {
            return `(${addition_data.toFixed(2)})`;
          })
          .attr('x', function (d) {
            return svg_width / 2;
          })
          .transition()
          .duration(2000)
          .attr('x', function (d) {
            return left_x - 45;
          })
        } else {
          // 添加文字
          svg_container.select(".bars_1")
          .selectAll('text')
          .data(data)
          .join('text')
          .attr("class", 'labels_text')
          .attr('y', margin + shift)
          .text(function (d) {
            return d.toFixed(3);
          })
          .attr('x', function (d) {
            return svg_width / 2;
          })
          .transition()
          .duration(2000)
          .attr('x', function (d) {
            return left_x - 45;
          })
        }

      } else if (side === 'right') {
        //添加矩形
        svg_container.select(".bars_2")
        .selectAll('rect')
        .data(data_normalize)
        .join('rect')
        .attr('y', margin - 0.15)
        .attr('fill', '#ef3828')
        .attr('height', rect_height)
        .attr("width", min_width)
        .transition()
        .duration(2000)
        .attr('width', function (d) {
          right_width = d * max_width + min_width
          return right_width; //2是保底宽度
        })

        //添加文字

        if (addition_data !== 0) {
          svg_container.select(".bars_2")
          .selectAll('text')
          .remove()

          // 添加文字
          svg_container.select(".bars_2")
          .append('text')
          .data(data)
          .attr("class", 'labels_text')
          .attr('y', shift - 2.5 * margin)
          .text(function (d) {
            return d.toFixed(3);
          })
          .transition()
          .duration(2000)
          .attr("x", right_width + 2)

          svg_container.select(".bars_2")
          .append('text')
          .data(data)
          .join('text')
          .attr("class", 'labels_text')
          .attr('y', shift + 3.5 * margin)
          .text(function (d) {
            return `(${addition_data.toFixed(2)})`;
          })
          .transition()
          .duration(2000)
          .attr("x", right_width + 2)

        } else {
          // 添加文字
          svg_container.select(".bars_2")
          .selectAll('text')
          .data(data)
          .join('text')
          .attr("class", 'labels_text')
          .attr('y', margin + shift)
          .text(function (d) {
              return d.toFixed(3);;
          })
          .transition()
          .duration(2000)
          .attr("x", right_width + 2)
        }

        // svg_container.select(".bars_2")
        // .selectAll('text')
        // .data(data)
        // .join('text')
        // .attr("class", 'labels_text')
        // .attr('y', margin + shift)
        // .text(function (d) {
        //   if (addition_data !== 0) {
        //     return `${d.toFixed(3)}(${addition_data.toFixed(2)})`;
        //   } else {
        //     return d.toFixed(3);;
        //   }
        // })
        // .transition()
        // .duration(2000)
        // .attr("x", right_width + 2)
      }
    }
  }
}
</script>

<style scoped>
#HeatMap_Container {
  height: 802px;
  width: 802px;
  padding: 0;
  margin-top:5px;
  margin-bottom: 2px;
  margin-left: 20px;
}

/** Tooltip CSS */
.d3-tip {
  line-height: 1.5;
  font-weight: 400;
  font-family: "avenir next", Arial, sans-serif;
  padding: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #FFA500;
  border-radius: 1px;
  pointer-events: none;
}

/* Creates a small triangle extender for the tooltip */
.d3-tip:after {
  box-sizing: border-box;
  display: inline;
  font-size: 8px;
  width: 100%;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
  position: absolute;
  pointer-events: none;

}

/* Northward tooltips */
.d3-tip.n:after {
  content: "\25BC";
  margin: -1px 0 0 0;
  top: 100%;
  left: 0;
  text-align: center;
}

/* Eastward tooltips */
.d3-tip.e:after {
  content: "\25C0";
  margin: -4px 0 0 0;
  top: 50%;
  left: -8px;
}

/* Southward tooltips */
.d3-tip.s:after {
  content: "\25B2";
  margin: 0 0 1px 0;
  top: -8px;
  left: 0;
  text-align: center;
}

/* Westward tooltips */
.d3-tip.w:after {
  content: "\25B6";
  margin: -4px 0 0 -1px;
  top: 50%;
  left: 100%;
}
</style>
