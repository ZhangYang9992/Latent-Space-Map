<template>
  <div id="TextGrid_Container" style="display: block;">
    <svg id="textGrid_svg">
      <g id="textGrid_g"></g>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3';
export default {
  name: "TextGrid",
  data() {
    return {
      textGrid_width: 800,
      textGrid_height: 800,
      text_coords_lst_400: [],
      confidence: [],
      classification: [],
      grid_num: 20,
      classes: ['plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']
    }
  },
  watch: {
    "$store.state.isDrawImageGrid": {
      deep: true,
      handler: function (v) {
        this.draw_init_text_image()
      }
    }
  },
  methods: {
    async draw_init_text_image() {
      this.img_coords_lst_400 = this.$store.state.coords_list

      let interval = 4
      let confidence = []
      let classification = []
      for (let i = 0; i < this.$store.state.confidence.length; i += interval) {
        confidence.push(this.$store.state.confidence[i].toFixed(2));
        classification.push(this.$store.state.classification[i]);
      }
      this.confidence = confidence
      this.classification = classification

      this.draw_textGrid()
    },

    draw_textGrid() {
      let textGrid_svg = d3.select("#textGrid_svg")
      .attr("width", this.textGrid_width)
      .attr("height", this.textGrid_height)
      textGrid_svg.selectAll("#textConfidence").remove()
      textGrid_svg.selectAll("#textClass").remove()
      textGrid_svg.selectAll("text").remove()

      let rectWidth = 40
      let gridNum = 20

      let textGrid_svg_g = textGrid_svg.select("#textGrid_g")
      // textGrid_svg_g.selectAll("#textConfidence").remove()
      // textGrid_svg_g.selectAll("#textClass").remove()
      // textGrid_svg_g.selectAll("text").remove()

      //添加边框
      textGrid_svg_g.selectAll("rect")
      .data(this.img_coords_lst_400)
      .join("rect")
      .attr("class", "img_border_rect")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", "1")
      .attr("height", rectWidth)
      .attr("width", rectWidth)
      .attr("x", (d, i) => rectWidth * (i % gridNum))
      .attr("y", (d, i) => rectWidth * Math.floor(i / gridNum));

      //添加文字
      textGrid_svg_g.selectAll("#textConfidence")
      .data(this.confidence)
      .join("text")
      // .append("text")
      // .text(d => d )
      .text(function (d) {
        return d
      })
      .attr("height", rectWidth)
      .attr("width", rectWidth)
      .attr("x", (d, i) => rectWidth * (i % gridNum))
      .attr("y", (d, i) => rectWidth * Math.floor(i / gridNum) + 20)
      .attr("border", "5")

      //添加文字
      textGrid_svg_g.selectAll("#textClass")
      .data(this.classification)
      .join("text")
      // .append("text")
      // .text(d => d )
      .text(function (d) {
        // console.log(this.classes[d])
        return this.classes[d]
      }.bind(this))
      .attr("height", rectWidth)
      .attr("width", rectWidth)
      .attr("x", (d, i) => rectWidth * (i % gridNum))
      .attr("y", (d, i) => rectWidth * Math.floor(i / gridNum) + 35)
      .attr("border", "5")

    }
  }
}
</script>

<style scoped>
#TextGrid_Container {
  height: 802px;
  width: 802px;
  padding: 0;
  margin-top:2px;
  margin-bottom: 2px;
}
</style>
