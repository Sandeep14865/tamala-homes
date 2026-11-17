// Kept apart from viewer.js so checking for WebGL never pulls three.js into the first load.
export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}
