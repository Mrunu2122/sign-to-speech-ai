export const drawHand = (predictions: any, ctx: CanvasRenderingContext2D) => {
  if (!predictions.length) return;

  predictions.forEach((prediction: any) => {
    const landmarks = prediction.landmarks;
    ctx.fillStyle = "red";
    landmarks.forEach(([x, y]: number[]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
};
