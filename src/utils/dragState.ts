// True while a node is being dragged; the simulation loop skips its per-frame packet updates so the drag keeps the frame budget.
export const dragState = { active: false };
