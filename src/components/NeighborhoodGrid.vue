<template>
  <a-spin :loading="loading">
    <div id="neighborhood_grid_container" style="display: block;">
      <svg id="neighborhood_grid_svg">
        <g id="neighborhood_grid_g"></g>
        <g id="neighborhood_image_center_g"></g>
        <g id="circle_g"></g>
        <g id="compare_circle_g"></g>
      </svg>
    </div>
  </a-spin>
</template>

<script>
import * as d3 from 'd3';
import d3Tip from 'd3-tip'
import { getClickNeighborhoodSample, getClickSample } from "../serve/serve.js"

export default {
  name: "NeighborhoodGrid.vue",
  data() {
    return {
      neighborhood_grid_width: 800, // original: 800
      neighborhood_grid_height: 800, // original: 800
      grid_num: 20,
      color: ['#08519c', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a'],
      confidence: [],
      labels: [],
      predict_labels: [],
      image_index: [],
      image_center_index: -1,
      // 分类信息
      cifar10_classes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      // 画图
      bar_container_id: ['chord_length_distribution', 'max_thickness_distribution', 'max_camber_distribution', 'leading_edge_radius_distribution', 'te_angle_distribution'],
      // loading显示
      loading: false,

      // tip对象
      tip: null,
    }
  },
  watch: {
    // 监听neighborhood Loading是否发生改变
    "$store.state.isNeighborhoodLoading": {
      deep: true,
      handler: function (v) {
        this.loading = true
      }
    },
    // 监听点击事件 显示领域数据信息
    "$store.state.isDrawNeighborhood": {
      deep: true,
      handler: function (v) {
        this.confidence = this.$store.state.neighborhoodConfidence
        this.labels = this.$store.state.neighborhoodLabels
        this.predict_labels = this.$store.state.neighborhoodPredict
        this.image_index = this.$store.state.neighborhoodImageIndex
        this.image_center_index = this.$store.state.centerIdx
        this.draw_neighborhood_grid()
      }
    },

    // 监听半径是否调整
    "$store.state.radiusNumber": {
      deep: true,
      handler: async function (v) {
        this.loading = true
        let _this = this;
        let dataset_type = this.$store.state.dataSetValue
        let path_save = "./static/" + dataset_type + "_single_samples/tmp.png"
        // 设置网格大小决定其结果
        let sample_num = 300
        let grid_num = 16
        if (dataset_type === "Airfoil") {
          sample_num = 200
          grid_num = 11
        } else if (dataset_type === "MNIST") {
          sample_num = 300
          grid_num = 15
        }
        let radius = this.$store.state.radiusNumber
        let x = this.$store.state.pointX
        let y = this.$store.state.pointY

        let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")

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
        })
        this.confidence = this.$store.state.neighborhoodConfidence
        this.labels = this.$store.state.neighborhoodLabels
        this.predict_labels = this.$store.state.neighborhoodPredict
        this.image_index = this.$store.state.neighborhoodImageIndex
        this.image_center_index = this.$store.state.centerIdx
        this.draw_neighborhood_grid()
      }
    },

    // 监听 若不浏览网格邻域 则隐藏tip
    // "$store.state.isClickNeighborhoodView": {
    //   deep: true,
    //   handler: function (v) {
    //     this.tip.hide()
    //   }
    // },

    // 监听LowerBound和ResolutionStep
    "$store.state.lowerBound": {
      deep: true,
      handler: function (v) {
        let lowerBound = this.$store.state.lowerBound
        let step = this.$store.state.resolutionStep

        let minConfidence = Math.min(...this.confidence)
        let minValue = minConfidence > lowerBound ? lowerBound : minConfidence

        let colorScale = d3.scaleQuantize()
            .domain([minValue, lowerBound + step * 11])  // 输入域是[0, 100]
            .range(this.color);

        let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")
        let neighborhood_grid_svg_g = neighborhood_grid_svg.select("#neighborhood_grid_g")

        let rectWidth = 50
        let gridNum = 16

        let dataset_type = this.$store.state.dataSetValue
        if (dataset_type === "Airfoil") {
          // total长度为800
          // rectWidth = 80
          // gridNum = 10

          // 整除 total 810
          rectWidth = 72
          gridNum = 11

        } else if (dataset_type === "MNIST") {
          // rectWidth = 50
          // gridNum = 16
          rectWidth = 53
          gridNum = 15
        }

        neighborhood_grid_svg_g.selectAll("rect")
            .data(this.image_index)
            .join("rect")
            .attr("class", "img_border_rect")
            .attr("id", (d, i) => 'rect-' + i)
            .attr("fill", "none")
            .attr("stroke", function(d, i) {
              if(d === -1) {
                return '#ffffff'
              } else {
                return colorScale(this.confidence[i]);
              }
            }.bind(this))
            .attr("stroke-width", "3")
            .attr("height", rectWidth - 5)
            .attr("width", rectWidth - 5)
            .attr("x", (d, i) => rectWidth * (i % gridNum))
            .attr("y", (d, i) => rectWidth * Math.floor(i / gridNum));

      }
    },

    "$store.state.resolutionStep": {
      deep: true,
      handler: function (v) {
        let lowerBound = this.$store.state.lowerBound
        let step = this.$store.state.resolutionStep

        let minConfidence = Math.min(...this.confidence)
        let minValue = minConfidence > lowerBound ? lowerBound : minConfidence

        let colorScale = d3.scaleQuantize()
            .domain([minValue, lowerBound + step * 11])  // 输入域是[0, 100]
            .range(this.color);

        let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")
        let neighborhood_grid_svg_g = neighborhood_grid_svg.select("#neighborhood_grid_g")

        let rectWidth = 50
        let gridNum = 16

        let dataset_type = this.$store.state.dataSetValue
        if (dataset_type === "Airfoil") {
          // total长度为800
          // rectWidth = 80
          // gridNum = 10

          // 整除 total 810
          rectWidth = 72
          gridNum = 11

        } else if (dataset_type === "MNIST") {
          // rectWidth = 50
          // gridNum = 16
          rectWidth = 53
          gridNum = 15
        }

        neighborhood_grid_svg_g.selectAll("rect")
            .data(this.image_index)
            .join("rect")
            .attr("class", "img_border_rect")
            .attr("id", (d, i) => 'rect-' + i)
            .attr("fill", "none")
            .attr("stroke", function(d, i) {
              if(d === -1) {
                return '#ffffff'
              } else {
                return colorScale(this.confidence[i]);
              }
            }.bind(this))
            .attr("stroke-width", "3")
            .attr("height", rectWidth - 5)
            .attr("width", rectWidth - 5)
            .attr("x", (d, i) => rectWidth * (i % gridNum))
            .attr("y", (d, i) => rectWidth * Math.floor(i / gridNum));
      }
    },
  },
  methods: {
    draw_neighborhood_grid() {
      let neighborhood_grid_svg = d3.select("#neighborhood_grid_svg")
      .attr("width", this.neighborhood_grid_width)
      .attr("height", this.neighborhood_grid_height)

      let _this = this
      let dataset_type = this.$store.state.dataSetValue
      if (dataset_type === "Airfoil") {
        this.color = ['#f7fbff', '#deebf7', '#c6dbef',
          '#9ecae1', '#6baed6','#4292c6','#2171b5',
          '#0570b0','#08519c','#08306b', '#08306b']
      } else if (dataset_type === "MNIST") {
        this.color = ['#08519c', '#3182bd', '#6baed6',
          '#9ecae1', '#c6dbef', '#ffffcc','#ffeda0',
          '#fed976','#feb24c','#fd8d3c','#fc4e2a']
      }

      let colorScale = d3.scaleQuantize()
      .domain([this.$store.state.attributeMin, this.$store.state.attributeMax])  // 输入域是[0, 100]
      .range(this.color);

      // let grid_metric = this.$store.state.neighborhoodOriginMetric

      // 添加tip
      // 隐藏tip
      // this.tip = d3Tip()
      // .attr('class', 'd3-tip')
      // .offset([ -10, 0 ])
      // .html((d) => {
      //   // imageIdx 为点击的邻域的样本对应的idx
      //   // d.image_idx 为对应grid中下标中的样本对应的属性信息
      //   let imagesHtml = d.neighborhood_idx.map(imageIdx => `<img style="border: 3px solid ${colorScale(grid_metric[imageIdx])}"
      //                                                        src="http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${imageIdx}.png?t=${Math.random()}"
      //                                                        data-image-idx="${imageIdx}" data-grid-idx="${d.image_idx}"
      //                                                        width="50px"
      //                                                        />`).join('')
      //   return `<div class='tip-content' style='padding: 10px; background-color: #ffffff; border-radius: 5px; box-shadow: 2px 2px 2px 0px rgba(0,0,0,0.50);'>
      //           <strong style="margin: 10px">Neighborhood List:</strong>
      //           <div class="image-grid" style="margin: 5px 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
      //               ${imagesHtml}
      //           </div>`;
      // }).direction('s').offset([5, 0])
      //
      // neighborhood_grid_svg.call(this.tip)

      neighborhood_grid_svg.selectAll("image").remove()

      let rectWidth = 50
      let gridNum = 16

      if (dataset_type === "Airfoil") {
        // total长度为800
        // rectWidth = 80
        // gridNum = 10

        // 整除 total 810
        rectWidth = 72
        gridNum = 11

      } else if (dataset_type === "MNIST") {
        // rectWidth = 50
        // gridNum = 16
        rectWidth = 53
        gridNum = 15
      }

      let neighborhood_grid_svg_g = neighborhood_grid_svg.select("#neighborhood_grid_g")
      let center_x = 0;
      let center_y = 0;
      let click_num = 0;

      //添加图片
      neighborhood_grid_svg_g.selectAll("image")
      .data(this.image_index)
      .join("image")
      .attr("number", (d, i) => i) //方便后续定位图片
      .attr("id", (d, i) => 'image-' + i)
      .attr("href", function (d, i) {
        if(d === -1) {
          return "http://211.81.55.138:8086/static/white.png";
        } else {
          return `http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${d}.png?t=` + Math.random();
        }
      }.bind(this))
      .attr("height", rectWidth - 10)
      .attr("width", rectWidth - 10)
      .attr("x", function (d, i){
        let x_temp = rectWidth * (i % gridNum) + 1.5
        if(d === _this.image_center_index) {
          center_x = x_temp
        }
        return x_temp
      }.bind(_this))
      .attr("y", function (d, i) {
        let x_temp = rectWidth * Math.floor(i / gridNum) + 1.5
        if(d === _this.image_center_index) {
          center_y = x_temp
        }
        return x_temp
      }.bind(_this))
      .attr("data-bs-toggle", "tooltip")
      .attr("title", "image")
      .attr("border", "5")
      // .on("mouseover", function (e, d) {
      //   let isClickNeighborhoodView = _this.$store.state.isClickNeighborhoodView
      //   let idx = d3.select(this).attr("number")
      //   let idx_x = Math.floor(idx / gridNum);
      //   let idx_y = idx % gridNum;
      //   let neighborhood_idx = _this.$store.state.neighborhoodGridIdx[idx_x][idx_y]
      //   // 启动hover的条件 (1) 点击邻域按钮 (2) 不在空白处
      //   if (isClickNeighborhoodView && _this.confidence[idx] !== -2) {
      //     tip.show(neighborhood_idx, this);
      //   }
      // })
      // .on("mouseout", function (e, d) {
      //   let isClickNeighborhoodView = _this.$store.state.isClickNeighborhoodView
      //   let idx = d3.select(this).attr("number")
      //   let idx_x = Math.floor(idx / gridNum);
      //   let idx_y = idx % gridNum;
      //   let neighborhood_idx = _this.$store.state.neighborhoodGridIdx[idx_x][idx_y]
      //   if (isClickNeighborhoodView && _this.confidence[idx] !== -2) {
      //     tip.hide(neighborhood_idx, this);
      //   }
      // })
      .on("click", async function(e, d) {
        let icon_size = 16;
        let dataset_type = _this.$store.state.dataSetValue

        // 选择样本实现
        let idx = d3.select(this).attr("number")
        let idx_x = Math.floor(idx / gridNum);
        let idx_y = idx % gridNum;
        // 原算法
        // let neighborhood_idx = _this.$store.state.neighborhoodGridIdx[idx_x][idx_y]
        // 直接排序
        let neighborhood_idx = idx_x * gridNum + idx_y

        let data = {"neighborhood_idx": neighborhood_idx, "image_idx": idx }

        let show_image_idx = _this.image_index[idx]

        if (_this.$store.state.isClickSelect === true && show_image_idx !== -1) {
          d3.select("#circle_g")
          .append("g")
          .attr("width", icon_size)
          .attr("height", icon_size)
          .append("path")
          .attr("d", "M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z")
          .attr("transform", "translate(" + String(Number(d3.pointer(e)[0]) - icon_size / 2) + "," + String(Number(d3.pointer(e)[1]) - icon_size) + ")")

          await getClickNeighborhoodSample(show_image_idx, "false", _this.$store.state.dataSetValue).then((res) => {
            if (dataset_type === "MNIST") {
              let confidence_list = res.data.confidence_list
              let predicted = res.data.predicted
              let confidence = res.data.confidence
              let label = res.data.label

              let coordinate = res.data.coordinates
              _this.$store.commit("setNeighborhoodCoordinate", coordinate)

              d3.select(".click_img").attr("src", `http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${show_image_idx}.png?t=` + Math.random())

              // 显示类别
              d3.select("#classified_type_1").text(_this.cifar10_classes[label])
              // 显示预测类别
              d3.select("#predicted_classified_type_1").text(_this.cifar10_classes[predicted])
              // 显示置信度
              d3.select("#confidence_value_1").text(confidence.toFixed(3))
              // 显示置信度
              _this.draw_single_confidence_bar(confidence_list)

            } else if (dataset_type === "Airfoil") {
              let coefficient = res.data.coefficient

              let coordinate = res.data.coordinates
              _this.$store.commit("setNeighborhoodCoordinate", coordinate)

              d3.select(".click_img").attr("src", `http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${show_image_idx}.png?t=` + Math.random())

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
          })
        }
        else if (_this.$store.state.isClickLineSelect === true && show_image_idx !== -1) {
          let click_pos = d3.pointer(e)

          if (click_num === 0) {
            click_num = click_num + 1

            neighborhood_grid_svg.select("#compare_circle_g")
            .append("line")
            .attr("x1", click_pos[0])
            .attr("y1", click_pos[1])
            .attr("x2", click_pos[0])
            .attr("y2", click_pos[1])
            .attr("id", "pos" + String(click_pos[0]).replace(".", "") + "" + String(click_pos[1]).replace(".", ""))//把点击的坐标当作线段的id
            .attr("stroke-width", "3px")
            .attr("stroke", "black")
            .attr("opacity", "0.3")

            d3.select("#compare_circle_g")
            .append("g")
            .attr("width", icon_size)
            .attr("height", icon_size)
            .append("path")
            .attr("d", "M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z")
            .attr("transform", "translate(" + String(Number(d3.pointer(e)[0]) - icon_size / 2) + "," + String(Number(d3.pointer(e)[1]) - icon_size) + ")")

            neighborhood_grid_svg.on("mousemove", async function (event) {
              let move_pos = d3.pointer(event)
              d3.select("#compare_circle_g")
              .select("#" + "pos" + String(click_pos[0]).replace(".", "") + "" + String(click_pos[1]).replace(".", ""))
              .attr("x2", move_pos[0])
              .attr("y2", move_pos[1])
            })
          } else {
            // 将click_number 置为0
            click_num = 0;
            // 不是第一次点击 则取消悬停事件
            neighborhood_grid_svg.on("mousemove", null)

            let d = ["M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z", "M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]

            d3.select("#compare_circle_g")
            .append("g")
            .attr("width", icon_size)
            .attr("height", icon_size)
            .selectAll("path")
            .data(d)
            .join("path")
            .attr("d", d => d)
            .attr("transform", "translate(" + String(Number(click_pos[0]) - icon_size / 2) + "," + String(Number(click_pos[1]) - icon_size) + ")")

          }

          await getClickNeighborhoodSample(show_image_idx, "true", _this.$store.state.dataSetValue).then((res) => {
            if (dataset_type === "MNIST") {
              let confidence_list = res.data.confidence_list
              let predicted = res.data.predicted
              let confidence = res.data.confidence
              let label = res.data.label

              if (click_num === 1) {
                d3.select("#click_start")
                .attr("src", `http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${show_image_idx}.png?t=` + Math.random())

                // 显示类别
                d3.select("#classified_type_1").text(_this.cifar10_classes[label])
                // 显示预测类别
                d3.select("#predicted_classified_type_1").text(_this.cifar10_classes[predicted])
                // 显示置信度
                d3.select("#confidence_value_1").text(confidence.toFixed(3))
                // 显示置信度
                _this.draw_double_confidence_bar_with_side(confidence_list, 'left')

              } else {
                d3.select("#click_end")
                .attr("src", `http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${show_image_idx}.png?t=` + Math.random())

                // 显示类别
                d3.select("#classified_type_2").text(_this.cifar10_classes[label])
                // 显示预测类别
                d3.select("#predicted_classified_type_2").text(_this.cifar10_classes[predicted])
                // 显示置信度
                d3.select("#confidence_value_2").text(confidence.toFixed(3))
                // 显示置信度
                _this.draw_double_confidence_bar_with_side(confidence_list, 'right')
              }
            } else if (dataset_type === "Airfoil") {
              let coefficient = res.data.coefficient

              if (click_num === 1) {
                d3.select("#click_start")
                .attr("src", `http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${show_image_idx}.png?t=` + Math.random())

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

              } else {
                d3.select("#click_end")
                .attr("src", `http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${show_image_idx}.png?t=` + Math.random())

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
          })
        }
        else if (_this.$store.state.isClickNeighborhoodView === true && show_image_idx !== -1) {
          _this.tip.show(data, this);
          // 每张图片定义点击事件
          d3.selectAll('.image-grid img').on('click', function() {
            let image_idx = d3.select(this).attr("data-image-idx")
            let grid_idx = d3.select(this).attr("data-grid-idx")
            let new_url = `http://211.81.55.138:8086/static/${dataset_type}_neighborhood/${image_idx}.png?t=` + Math.random()

            d3.select(`#image-${grid_idx}`).attr("href", new_url)
            d3.select(`#rect-${grid_idx}`).attr("stroke", colorScale(grid_metric[image_idx]))

            // 更新image_grid中的数据 使得点击时对应是更新后的neighborhood的属性值
            _this.image_index[grid_idx] = image_idx
          });
        }
      })

      // 标记图标的大小
      const icon_size = 16;

      neighborhood_grid_svg.select("#neighborhood_image_center_g").selectAll("g").remove()

      // 隐藏了center_id
      neighborhood_grid_svg.select("#neighborhood_image_center_g")
      .append("g")
      .attr("width", icon_size)
      .attr("height", icon_size)
      .append("path")
      .attr("d", "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z")
      .attr("fill", "red")
      .attr("transform", "translate(" + String(center_x + rectWidth - icon_size - 2) + "," + String(center_y + rectWidth - icon_size - 5) + ")")

      //添加边框
      neighborhood_grid_svg_g.selectAll("rect")
      .data(this.image_index)
      .join("rect")
      .attr("class", "img_border_rect")
      .attr("id", (d, i) => 'rect-' + i)
      .attr("fill", "none")
      .attr("stroke", function(d, i) {
        if(d === -1) {
          return '#ffffff'
        } else {
          return colorScale(this.confidence[i]);
        }
      }.bind(this))
      .attr("stroke-width", "3")
      .attr("height", rectWidth - 5)
      .attr("width", rectWidth - 5)
      .attr("x", (d, i) => rectWidth * (i % gridNum))
      .attr("y", (d, i) => rectWidth * Math.floor(i / gridNum));

      this.loading = false
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
        }
        else {
          return "red"
        }
      })
      .transition()
      .duration(2000)
      .attr('x', function (d) {
        if (d <= 0.5) {
          return d * max_width;
        }
        else {
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
          }
          else {
            return "red"
          }
        })
        .transition()
        .duration(2000)
        .attr('x', function (d) {
          if (d <= 0.5) {
            return max_width - d * max_width - 28;
          }
          else {
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
          }
          else {
            return "red"
          }
        })
        .transition()
        .duration(2000)
        .attr('x', function (d) {
          if (d <= 0.5) {
            return d * max_width;
          }
          else {
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
  },
}
</script>

<style scoped>
#neighborhood_grid_container {
  height: 802px;
  width: 802px;
  padding: 0;
  margin-top:5px;
  margin-bottom: 2px;
  margin-left: 10px;
}

</style>