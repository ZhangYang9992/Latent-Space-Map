<template>
  <div class="view_container">
    <TopPanel/>
    <div class="latent_space">
      <LeftInformation/>
      <HeatMap/>
<!--      <ImageGrid/>-->
      <MiddleMenu/>
      <NeighborhoodGrid/>
    </div>
  </div>
</template>

<script>
import HeatMap from "../components/HeatMap";
import TopPanel from "@/components/TopPanel";
import LeftInformation from "@/components/LeftInformation";
import MiddleMenu from "@/components/MiddleMenu";
import ImageGrid from "../components/ImageGrid";
import NeighborhoodGrid from "@/components/NeighborhoodGrid";
// import TextGrid from "../components/TextGrid";
export default {
  name: "MicroLatentSpace",
  components: { TopPanel, HeatMap, LeftInformation, MiddleMenu, ImageGrid, NeighborhoodGrid }
}
</script>

<style scoped>
.latent_space {
  display: flex;
  flex-direction: row;
  /*justify-content: space-between;*/
  /*align-items: center;*/
}
</style>
