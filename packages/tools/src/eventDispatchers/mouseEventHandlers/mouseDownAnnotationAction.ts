import { getEnabledElement } from '@cornerstonejs/core';
import { state } from '../../store/state';
import { ToolModes } from '../../enums';
import type { EventTypes } from '../../types';

// Util
import filterToolsWithAnnotationsForElement from '../../store/filterToolsWithAnnotationsForElement';
import filterMoveableAnnotationTools from '../../store/filterMoveableAnnotationTools';
import getToolsWithActionsForMouseEvent from '../shared/getToolsWithActionsForMouseEvent';
import type { AnnotationTool } from '../../tools';

const { Active, Passive } = ToolModes;

/**
 * 查找具有基于绑定可处理该事件的动作的活动或被动注释，并调用找到的第一个。
 * 这通常用于处理像 “点击选中标注”、“点击删除标注” 或者其他自定义的交互行为，而不是创建新标注。
 *
 * @param evt - 标准化的 mouseDown 事件。
 * @returns 如果已执行动作则返回 true，否则返回 false
 */
// TODO: 我们之后可以对这个功能做一个升级！
export default function mouseDownAnnotationAction(
  evt: EventTypes.MouseDownEventType
): boolean {
  // 如果一个工具锁定了当前状态，则说明它正在处理自身事件循环中的交互。
  if (state.isInteractingWithTool) {
    return false;
  }

  const eventDetail = evt.detail;
  const { element } = eventDetail;
  const enabledElement = getEnabledElement(element);
  const { canvas: canvasCoords } = eventDetail.currentPoints;

  if (!enabledElement) {
    return false;
  }

  // Find all tools that might respond to this mouse down
  const toolsWithActions = getToolsWithActionsForMouseEvent(evt, [
    Active,
    Passive,
  ]);

  const tools = Array.from(toolsWithActions.keys());

  // Filter tools with annotations for this element
  const annotationToolsWithAnnotations = filterToolsWithAnnotationsForElement(
    element,
    tools as AnnotationTool[]
  );

  // Only moveable annotations (unlocked, visible and close to the canvas coordinates) may trigger actions
  const moveableAnnotationTools = filterMoveableAnnotationTools(
    element,
    annotationToolsWithAnnotations,
    canvasCoords
  );

  // If there are annotation tools that are interactable, select the first one
  // that isn't locked. If there's only one annotation tool, select it.
  if (moveableAnnotationTools.length > 0) {
    const { tool, annotation } = moveableAnnotationTools[0];
    const action = toolsWithActions.get(tool);
    const method =
      typeof action.method === 'string' ? tool[action.method] : action.method;

    method.call(tool, evt, annotation);

    return true;
  }

  return false;
}
