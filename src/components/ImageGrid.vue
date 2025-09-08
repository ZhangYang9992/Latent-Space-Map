<template>
  <div id="ImageGrid_Container" style="display: inline;">
    <svg id="imageGrid_svg">
      <g id="imageGrid_g"></g>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { getGridImage } from "../serve/serve.js"
import d3Tip from 'd3-tip'

export default {
  name: "ImageGrid",
  data() {
    return {
      imageGrid_width: 800,
      imageGrid_height: 800,
      img_coords_lst_400: [],
      grid_num: 20,
      color: ['#08519c', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#ffffb2','#fed976','#feb24c','#fd8d3c','#f03b20','#bd0026'],
      confidence: [],
      labels: [],
      predict_labels: []
    }
  },
  // // 初始化
  // mounted() {
  //   this.draw_init_grid_image()
  // },
  // 监听
  watch: {
    // 监听heatMap在缩放平移操作时重新绘制imageGrid
    "$store.state.isDrawHeatMap": {
      deep: true,
      handler: function (v) {
        this.draw_init_grid_image()
      }
    }
  },
  methods: {
    async draw_init_grid_image() {
      await getGridImage(this.grid_num, this.$store.state.extent).then((res) => {
        this.img_coords_lst_400 = res.data.coords
        this.confidence = res.data.confidence
        this.labels = res.data.lables
        this.predict_labels = res.data.predict_labels
        this.draw_imageGrid()
        this.$store.commit("setCoords_list", res.data.coords)
      })
    },

    draw_imageGrid() {
      let imageGrid_svg = d3.select("#imageGrid_svg")
      .attr("width", this.imageGrid_width)
      .attr("height", this.imageGrid_height)

      // 添加tip
      const tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([ -10, 0 ])
      .html((d) => {
        return "<strong>Class: </strong><span class='tip-details'>" + d[0] + "<br></span>"
            + "<strong>Predict class: </strong><span class='tip-details'>" + d[1] + "<br></span>"
            + "<strong>Confidence: </strong><span class='tip-details'>" + d[2] + "<br></span>";
      })
      imageGrid_svg.call(tip)

      let _this = this

      imageGrid_svg.selectAll("image").remove()
      let rectWidth = 40
      let gridNum = 20

      let imageGrid_svg_g = imageGrid_svg.select("#imageGrid_g")

      let dataset_type = "MNIST"
      //添加图片
      imageGrid_svg_g.selectAll("image")
      .data(this.img_coords_lst_400)
      .join("image")
      .attr("number", (d, i) => i) //方便后续定位图片
      .attr("href", function (d, i) {
        if(this.confidence[i] === -2) {
          return "http://211.81.55.138:8086/static/white.png";
        } else {
          return `http://211.81.55.138:8086/static/${dataset_type}/${i}.png?t=` + Math.random();
        }
      }.bind(this))
      .attr("height", rectWidth - 8)
      .attr("width", rectWidth - 8)
      .attr("x", (d, i) => rectWidth * (i % gridNum) + 1.5)
      .attr("y", (d, i) => rectWidth * Math.floor(i / gridNum) + 1.5)
      .attr("data-bs-toggle", "tooltip")
      .attr("title", "image")
      .attr("border", "5")
      .on("mouseover", function (e, d) {
        let idx = d3.select(this).attr("number")
        if(_this.confidence[idx] !== -2) {
          let text_list = [_this.labels[idx], _this.predict_labels[idx], _this.confidence[idx]]
          tip.show(text_list, this);
        }
      })
      .on("mouseout", function (e, d) {
        let idx = d3.select(this).attr("number")
        if(_this.confidence[idx] !== -2) {
          let text_list = [ _this.labels[idx], _this.predict_labels[idx], _this.confidence[idx] ]
          tip.hide(text_list, this);
        }
      })

      let colorScale = d3.scaleQuantize()
      .domain([-1, 1])  // 输入域是[0, 100]
      .range(this.color);

      //添加边框
      imageGrid_svg_g.selectAll("rect")
      .data(this.img_coords_lst_400)
      .join("rect")
      .attr("class", "img_border_rect")
      .attr("fill", "none")
      .attr("stroke", function(d, i) {
        if(this.confidence[i] === -2) {
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
  }
}
</script>

<style scoped>
#ImageGrid_Container {
  height: 802px;
  width: 802px;
  padding: 0;
  margin-top:5px;
  margin-bottom: 2px;
  margin-left: 10px;
}
</style>
