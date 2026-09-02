/**
 * Optional browser entry for custom-font zhuyin optical calibration.
 * Kept out of `han.js`: sites using the verified default font stacks should
 * not pay for Canvas measurement, grouping, cache, or code-generation code.
 */
export {
  calibrateZhuyinRuby,
  clearZhuyinRubyCalibration,
  clearZhuyinRubyCalibrationCache,
} from './ts/semantics/zhuyin-calibration.ts'

export type {
  ZhuyinCalibrationOptions,
  ZhuyinCalibrationResult,
  ZhuyinCalibrationGroupResult,
  ZhuyinCalibrationItemResult,
} from './ts/semantics/zhuyin-calibration.ts'
