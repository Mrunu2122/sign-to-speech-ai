type Prediction = {
  landmarks: [number, number, number][];
};

export const drawHand = (
  predictions: Prediction[],
  ctx: CanvasRenderingContext2D
) => {
  if (!predictions.length) return;

  predictions.forEach((prediction) => {
    const landmarks = prediction.landmarks;
    ctx.fillStyle = "red";

    landmarks.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
};
