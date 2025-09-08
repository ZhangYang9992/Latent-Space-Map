// 用于前后端通信
import axios from "axios";

// 初始化热力图
export async function getInitLatentSpace(bin = 100, attribute_value, dataSet) {
  let port = '8086'
  if (dataSet === 'MNIST') {
    port = '8087'
  }
  if (dataSet === 'Airfoil') {
    port = '8086'
  }
  return axios.get("http://211.81.55.138:" + port + "/init_latent_space", {
    params: {
      bin: bin,
      attribute_value: attribute_value
    }
  })
}

// 移动/缩放热力图
export async function getTransformLatentSpace(sample_num = 100, bin= 100, extent, dataSet) {
  let port = '8086'
  if (dataSet === 'MNIST') {
    port = '8087'
  }
  if (dataSet === 'Airfoil') {
    port = '8086'
  }
  return axios.get("http://211.81.55.138:" + port + "/transform_latent_space", {
    params: {
      sample_num: sample_num,
      bin: bin,
      start_x: extent.start_x,
      start_y: extent.start_y,
      end_x: extent.end_x,
      end_y: extent.end_y
    }
  })
}

// 获取图片数据
export async function getGridImage(grid_num= 20, extent, dataSet) {
  let port = '8086'
  if (dataSet === 'MNIST') {
    port = '8087'
  }
  if (dataSet === 'Airfoil') {
    port = '8086'
  }
  return axios.get("http://211.81.55.138:" + port + "/get_image_grid", {
    params: {
      grid_num: grid_num,
      start_x: extent.start_x,
      start_y: extent.start_y,
      end_x: extent.end_x,
      end_y: extent.end_y
    }
  })
}

// 获取改变resolution后的插值结果
export async function getChangeResolution(bin, extent, dataSet) {
  let port = '8086'
  if (dataSet === 'MNIST') {
    port = '8087'
  }
  if (dataSet === 'Airfoil') {
    port = '8086'
  }
  return axios.get("http://211.81.55.138:" + port + "/change_resolution", {
    params: {
      bin: bin,
      start_x: extent.start_x,
      start_y: extent.start_y,
      end_x: extent.end_x,
      end_y: extent.end_y
    }
  })
}

// 点击一点获取图片和置信度
// isGenerateNeighbor 用于是单击时为true 得到邻域样本 当是连线时为false 得到对比样本
export async function getClickSample(point_x, point_y, path_save, isGenerateNeighbor, sample_num, grid_num, radius, dataSet) {
  let port = '8086'
  if (dataSet === 'MNIST') {
    port = '8087'
  }
  if (dataSet === 'Airfoil') {
    port = '8086'
  }
  return axios.get("http://211.81.55.138:" + port + "/get_samples_by_point", {
    params: {
      point_x: point_x,
      point_y: point_y,
      path_save: path_save,
      sample_num: sample_num,
      radius: radius,
      isGenerateNeighbor: isGenerateNeighbor,
      grid_num: grid_num
    }
  })
}

// 点击neighborhood grid获得图片信息
export async function getClickNeighborhoodSample(neighborhood_idx, is_compare_neighbor, dataSet) {
  let port = '8086'
  if (dataSet === 'MNIST') {
    port = '8087'
  }
  if (dataSet === 'Airfoil') {
    port = '8086'
  }
  return axios.get("http://211.81.55.138:" + port + "/get_neigborhood_information", {
    params: {
      neighborhood_idx: neighborhood_idx,
      is_compare_neighbor: is_compare_neighbor,
    }
  })
}


// 初始化热力图
// export async function getInitLatentSpace(sample_num = 500, bw_method = 0.3) {
//   return axios.get("http://211.81.55.1381:8086/init_latent_space", {
//     params: {
//       sample_num: sample_num,
//       bw_method: bw_method
//     }
//   })
// }

// 移动/缩放热力图
// export async function getTransformLatentSpace(sample_num = 500, bw_method = 0.3, extent) {
//   return axios.get("http://211.81.55.1381:8086/transform_latent_space", {
//     params: {
//       sample_num: sample_num,
//       bw_method: bw_method,
//       start_x: extent.start_x,
//       start_y: extent.start_y,
//       end_x: extent.end_x,
//       end_y: extent.end_y
//     }
//   })
// }