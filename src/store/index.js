// 存储全局变量
import { createStore } from "vuex";

export default createStore({
  state() {
    return {
      // 坐标信息
      extent: {
        "start_x": -5.0,
        "end_x": 5.0,
        "start_y": -5.0,
        "end_y": 5.0
      },
      // 判断heatMap已经画好 用于监听
      isDrawHeatMap: false,
      // 判断ImageGrid已经画好 用于监听
      isDrawImageGrid: false,
      // 用于监听点击一个样本点 绘制邻域信息
      isDrawNeighborhood: false,
      // 存储置信度
      confidence: [],
      // 存储分类信息
      classification: [],
      // 存储位置信息
      coords_list: [],
      // 设置bin
      resolution: 300,
      // 设置采样数量
      sampleNumber: 300,
      // 邻域半径
      radiusNumber: 0.7,
      
      // 存储点击事件的neighborhood confidence
      neighborhoodConfidence: [],
      // 邻域的labels
      neighborhoodLabels: [],
      // 邻域的预测labels
      neighborhoodPredict: [],
      // 邻域图片的下标
      neighborhoodImageIndex: [],
      // 邻域的中心点图片idx
      centerIdx: -1,

      // 这些按钮只需要监听点击即可
      // 是否点击了Zoom In操作
      isClickZoomIn: false,
      // 是否点击了Zoom Out操作
      isClickZoomOut: false,
      // 是否点击了Erase操作
      isClickErase: false,

      // 这些按钮要保证true 和 false 代表按钮是否按下
      // 是否处于平移状态
      isClickPan: true,
      // 是否点击了Box Zoom操作
      isClickBoxZoom: false,
      // 是否点击框刷选
      isClickBoxSelect: false,
      // 是否点击单个选择样子
      isClickSelect: false,
      // 是否点击线对比
      isClickLineSelect: false,
      // 是否点击浏览网格邻域
      isClickNeighborhoodView: false,

      // 记录最低阈值和步长
      lowerBound: -1,
      resolutionStep: 0.2,

      // 是否绘制点
      isShowCentroids: 'false',

      // 数据集信息
      // MNIST Airfoil
      dataSetValue: 'Airfoil',

      // 存储对应数据的最小值和最大值 进行threshold映射
      attributeMin: -1,
      attributeMax: 1,

      // 设置选择的属性值
      attributeSetValue: 1,

      // 点击位置的坐标 用于邻域更新
      pointX: 0,
      pointY: 0,

      // Neighborhood loading
      isNeighborhoodLoading: false,

      // 存储neighborhood grid中的图片idx
      neighborhoodGridIdx: [],
      // 存储原始origin neighborhood的所有属性
      neighborhoodOriginMetric: [],

      // 辅助画图
      // 是否绘制热力图
      isShowMap: 'true',

      // 绘制邻域点的信息
      neighborhoodCoordinate: []
    }
  },
  mutations: {
    setExtent(state, extent) {
      state.extent = extent
    },
    setIsDrawHeatMap(state, isDrawHeatMap) {
      state.isDrawHeatMap = isDrawHeatMap
    },
    setIsDrawImageGrid(state, isDrawImageGrid) {
      state.isDrawImageGrid = isDrawImageGrid
    },
    setIsDrawNeighborhood(state, isDrawNeighborhood) {
      state.isDrawNeighborhood = isDrawNeighborhood
    },
    setConfidence(state, confidence) {
      state.confidence = confidence
    },
    setClassification(state, classification) {
      state.classification = classification
    },
    setCoords_list(state, coords_list) {
      state.coords_list = coords_list
    },
    setNeighborhoodConfidence(state, neighborhoodConfidence) {
      state.neighborhoodConfidence = neighborhoodConfidence
    },
    setNeighborhoodLabels(state, neighborhoodLabels) {
      state.neighborhoodLabels = neighborhoodLabels
    },
    setNeighborhoodPredict(state, neighborhoodPredict) {
      state.neighborhoodPredict = neighborhoodPredict
    },
    setNeighborhoodImageIndex(state, neighborhoodImageIndex) {
      state.neighborhoodImageIndex = neighborhoodImageIndex
    },
    setCenterIdx(state, centerIdx) {
      state.centerIdx = centerIdx
    },
    setIsClickZoomIn(state, isClickZoomIn) {
      state.isClickZoomIn = isClickZoomIn
    },
    setIsClickZoomOut(state, isClickZoomOut) {
      state.isClickZoomOut = isClickZoomOut
    },
    setIsClickErase(state, isClickErase) {
      state.isClickErase = isClickErase
    },
    setResolution(state, resolution) {
      state.resolution = resolution
    },
    setSampleNumber(state, sampleNumber) {
      state.sampleNumber = sampleNumber
    },
    setRadiusNumber(state, radiusNumber) {
      state.radiusNumber = radiusNumber
    },

    setIsClickPan(state, isClickPan) {
      state.isClickPan = isClickPan
    },
    setIsClickBoxZoom(state, isClickBoxZoom) {
      state.isClickBoxZoom = isClickBoxZoom
    },
    setIsClickBoxSelect(state, isClickBoxSelect) {
      state.isClickBoxSelect = isClickBoxSelect
    },
    setIsClickSelect(state, isClickSelect) {
      state.isClickSelect = isClickSelect
    },
    setIsClickLineSelect(state, isClickLineSelect) {
      state.isClickLineSelect = isClickLineSelect
    },
    setIsClickNeighborhoodView(state, isClickNeighborhoodView) {
      state.isClickNeighborhoodView = isClickNeighborhoodView
    },
    setLowerBound(state, lowerBound) {
      state.lowerBound = lowerBound
    },
    setResolutionStep(state, resolutionStep) {
      state.resolutionStep = resolutionStep
    },
    setIsShowCentroids(state, isShowCentroids) {
      state.isShowCentroids = isShowCentroids
    },
    setIsDataSetValue(state, dataSetValue) {
      state.dataSetValue = dataSetValue
    },
    setAttributeMin(state, attributeMin) {
      state.attributeMin = attributeMin
    },
    setAttributeMax(state, attributeMax) {
      state.attributeMax = attributeMax
    },
    setAttributeSetValue(state, attributeSetValue) {
      state.attributeSetValue = attributeSetValue
    },
    setPointX(state, pointX) {
      state.pointX = pointX
    },
    setPointY(state, pointY) {
      state.pointY = pointY
    },
    setIsNeighborhoodLoading(state, isNeighborhoodLoading) {
      state.isNeighborhoodLoading = isNeighborhoodLoading
    },
    setNeighborhoodGridIdx(state, neighborhoodGridIdx) {
      state.neighborhoodGridIdx = neighborhoodGridIdx
    },
    setNeighborhoodOriginMetric(state, neighborhoodOriginMetric) {
      state.neighborhoodOriginMetric = neighborhoodOriginMetric
    },
    setIsShowMap(state, isShowMap) {
      state.isShowMap = isShowMap
    },
    setNeighborhoodCoordinate(state, neighborhoodCoordinate) {
      state.neighborhoodCoordinate = neighborhoodCoordinate
    }
  },
  actions: {},
  modules: {}
})